from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EvaluationStatus, InterventionEvaluation, InterventionType
from .serializers import (
    InterventionEvaluationSerializer,
    PendingEvaluationSerializer,
)


EVALUATION_WINDOW = timedelta(hours=24)  # 뷰에서 공유하는 컷오프 시간 설정

# 24시간 이내 응답 없는 개입 -> 미응답으로 처리
# 24시간 시점에 실시간으로 바뀌는 것이 아닌, 다음 접속 시 정리
def _expire_stale_pending(user):
    cutoff = timezone.now() - EVALUATION_WINDOW
    InterventionEvaluation.objects.filter(
        user=user,
        status=EvaluationStatus.PENDING,
        created_at__lt=cutoff,
    ).update(status=EvaluationStatus.EXPIRED)


# 개입(사운드/이완)이 끝났을 때 평가 대기 row를 만들어두는 내부용 뷰.
class InterventionEvaluationCreateView(generics.GenericAPIView):
    serializer_class = InterventionEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, intervention_type, session_id):
        if intervention_type not in InterventionType.values:
            return Response(
                {"detail": "intervention_type은 sound 또는 relaxation이어야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        evaluation, created = InterventionEvaluation.objects.get_or_create(
            user=request.user,
            intervention_type=intervention_type,
            session_id=session_id,
        )

        return Response(
            {"id": evaluation.id, "status": evaluation.status},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# 24시간 이내인 PENDING 평가 목록
class PendingEvaluationListView(generics.ListAPIView):
    serializer_class = PendingEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        _expire_stale_pending(self.request.user)

        return (
            InterventionEvaluation.objects.filter(
                user=self.request.user,
                status=EvaluationStatus.PENDING,
            )
            .order_by("-created_at")
        )


# 평가 제출 
class EvaluationSubmitView(generics.UpdateAPIView):
    serializer_class = InterventionEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = InterventionEvaluation.objects.all()

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset()).select_for_update()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)

        with transaction.atomic():
            instance = self.get_object()

            if instance.status != EvaluationStatus.PENDING:
                return Response(
                    {"detail": "이미 처리되었거나 만료된 항목입니다."},
                    status=status.HTTP_409_CONFLICT,
                )

            if instance.created_at < timezone.now() - EVALUATION_WINDOW:
                instance.status = EvaluationStatus.EXPIRED
                instance.save(update_fields=["status"])
                return Response(
                    {"detail": "평가 가능 시간이 지났습니다."},
                    status=status.HTTP_409_CONFLICT,
                )

            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def perform_update(self, serializer):
        serializer.save(
            status=EvaluationStatus.EVALUATED,
            evaluated_at=timezone.now(),
        )


#사용자가 평가 안하기를 선택할 때(스킵 기능)
class SkipEvaluationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            evaluation = get_object_or_404(
                InterventionEvaluation.objects.select_for_update(),
                pk=pk,
                user=request.user,
            )

            if evaluation.status != EvaluationStatus.PENDING:
                return Response(
                    {"detail": "이미 처리되었거나 만료된 항목입니다."},
                    status=status.HTTP_409_CONFLICT,
                )

            if evaluation.created_at < timezone.now() - EVALUATION_WINDOW:
                evaluation.status = EvaluationStatus.EXPIRED
                evaluation.save(update_fields=["status"])
                return Response(
                    {"detail": "평가 가능 시간이 지났습니다."},
                    status=status.HTTP_409_CONFLICT,
                )

            evaluation.status = EvaluationStatus.SKIPPED
            evaluation.evaluated_at = timezone.now()
            evaluation.save(update_fields=["status", "evaluated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)