from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import AnonymousUser #테스트용
from feedback.models import InterventionEvaluation

from . import services
from .serializers import (
    DailyRecordListSerializer,
    InterventionRecordDetailSerializer,
)


# F-1101: 일별 이용 기록 목록(최신순)
class DailyRecordListView(generics.ListAPIView):
    serializer_class = DailyRecordListSerializer
    permission_classes = [permissions.AllowAny] #로컬에서 기능 테스트 위해 잠시 로그인 인증 풀기
    #permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            InterventionEvaluation.objects
            .all() #로컬 기능테스트 위해 잠시 로그인 인증 풀기
            #.filter(user=self.request.user)
            .order_by("-created_at")
        )


# F-1102: 일별 기록 상세 조회
class InterventionRecordDetailView(APIView):
    permission_classes = [permissions.AllowAny] #테스트용 인증 풀기
    #permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        evaluation = get_object_or_404(
            InterventionEvaluation, pk=pk, user=request.user
        )

        detail = services.get_intervention_detail(evaluation)
        if detail is None:
            return Response(
                {"detail": "세션 정보를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = InterventionRecordDetailSerializer({
            "intervention_type": evaluation.intervention_type,
            "session_id": evaluation.session_id,
            **detail,
        })
        return Response(serializer.data)


# F-1103: 기간별 이명 불편도 · 수면 변화 표시
class PeriodTrendView(APIView):
    permission_classes = [permissions.AllowAny] #테스트용 인증 풀기
    #permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            days = int(request.query_params.get("days", 14))
        except ValueError:
            return Response(
                {"detail": "days는 정수여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # 로컬 테스트용
        test_user = AnonymousUser.objects.first()

        return Response(
            services.get_period_trend(
                test_user,
                days=days,
            ))

        return Response(services.get_period_trend(request.user, days=days))


# F-1106: 기록 부족 상태 안내 (패턴 인사이트 표시 가능 여부)
class RecordInsightStatusView(APIView):
    permission_classes = [permissions.AllowAny] #테스트용 인증 풀기
    #permission_classes = [permissions.IsAuthenticated]


    def get(self, request):
        test_user = AnonymousUser.objects.first() #테스트용 유저 

        
        return Response({
            "has_enough_records": services.has_enough_records_for_insight(test_user),
            "window_days": services.INSIGHT_WINDOW_DAYS,
            "min_required": services.MIN_RECORDS_FOR_INSIGHT,
        })