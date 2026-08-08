from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from datetime import timedelta

from django.utils import timezone

from .models import InterventionEvaluation, InterventionType
from .serializers import InterventionEvaluationSerializer, PendingEvaluationSerializer

#개입 직후 평가 저장 api
class InterventionEvaluationCreateView(generics.GenericAPIView):
    serializer_class = InterventionEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated] #로그인된 사용자만 접근 가능

    def post(self, request, intervention_type, session_id):
        if intervention_type not in InterventionType.values:
            return Response(
                {"detail": "intervention_type은 sound 또는 relaxation이어야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        evaluation, _ = InterventionEvaluation.objects.get_or_create(
            user = request.user,
            intervention_type=intervention_type,
            session_id=session_id,
            defaults={"user": request.user},
        )

        skipped = request.data.get("skipped", False) #기본 false
        serializer = self.get_serializer(evaluation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(evaluated_at=timezone.now(), skipped=bool(skipped))
        return Response(serializer.data, status=status.HTTP_200_OK)

# 다음 접속 시 보여줄 미평가 개입 목록(24시간이 지나지 않은 것들만)
class PendingEvaluationListView(generics.ListAPIView):
    serializer_class = PendingEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cutoff = timezone.now() - timedelta(hours=24)

        return (
            InterventionEvaluation.objects.filter(
                user=self.request.user,
                evaluated_at__isnull=True,
                skipped=False,
                created_at__gte=cutoff,
            )
            .order_by("-created_at")
        )

#다음 날 지연 평가 제출/수정(24시간 지난 것은 불가능)
class DelayedEvaluationSubmitView(generics.UpdateAPIView):
    serializer_class = InterventionEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = InterventionEvaluation.objects.all()

    def get_queryset(self):
        cutoff = timezone.now() - timedelta(hours=24)

        return super().get_queryset().filter(
            user=self.request.user,
            created_at__gte=cutoff,
            evaluated_at__isnull=True,
            skipped=False,
        )

    def perform_update(self, serializer):
        serializer.save(
            is_delayed=True,
            evaluated_at=timezone.now(),
        )

# 사용자가 평가 안하기를 누를 때 호출, 
class SkipEvaluationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        evaluation = get_object_or_404(
            InterventionEvaluation, pk=pk, user=request.user
        )
        evaluation.skipped = True
        evaluation.evaluated_at = timezone.now()
        evaluation.save(update_fields=["skipped", "evaluated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)