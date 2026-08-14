
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser

from . import services
from .models import NightlyEvaluation
from .serializers import (
    NightlyEvaluationSerializer,
    NightlyEvaluationSubmitRequestSerializer,
)

# 결과 기록 화면 진입점
# 어젯밤에 대한 평가가 없으면 생성 / 있으면 그대로 반환
# 24시간 지난 PENDING 건은 조회 시점에 EXPIRED로 정리
class NightlyEvaluationTodayView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser,uuid=uuid,)

        try:
            evaluation = services.ensure_nightly_evaluation(
                user=user,
            )
            evaluation = services.expire_evaluation_if_needed(
                evaluation,
            )
        except ValidationError as e:
            return Response({"detail": (e.messages[0]
                        if e.messages
                        else str(e)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            NightlyEvaluationSerializer(evaluation).data
        )


class NightlyEvaluationDetailView(APIView):

    def get(self, request, uuid, pk):
        user = get_object_or_404(AnonymousUser,uuid=uuid,)

        evaluation = get_object_or_404(NightlyEvaluation,pk=pk,user=user,)

        try:
            evaluation = services.expire_evaluation_if_needed(
                evaluation,
            )
        except ValidationError as e:
            return Response(
                {
                    "detail": (
                        e.messages[0]
                        if e.messages
                        else str(e)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            NightlyEvaluationSerializer(evaluation).data
        )

# 저장하기 - 평가 항목 제출
class NightlyEvaluationSubmitView(APIView):

    def post(self, request, uuid, pk):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        evaluation = get_object_or_404(
            NightlyEvaluation,
            pk=pk,
            user=user,
        )

        req = NightlyEvaluationSubmitRequestSerializer(
            data=request.data
        )
        req.is_valid(raise_exception=True)

        try:
            evaluation = services.submit_evaluation(
                evaluation,
                **req.validated_data,
            )

        except ValidationError as e:
            return Response(
                {
                    "detail": (
                        e.messages[0]
                        if e.messages
                        else str(e)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            NightlyEvaluationSerializer(evaluation).data
        ) 