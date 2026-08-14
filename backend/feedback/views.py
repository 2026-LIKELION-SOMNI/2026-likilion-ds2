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
# 현재 평가 가능한 PENDING 목록을 생성/정리한 뒤 가장 최근 평가 1개 반환
class NightlyEvaluationTodayView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        try:
            evaluations = services.ensure_pending_evaluations(
                user=user,
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

        # 현재 평가할 수 있는 기록이 없는 경우
        if not evaluations:
            return Response(
                {
                    "detail": "현재 평가 가능한 기록이 없습니다."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        evaluation = evaluations[0]

        return Response(
            NightlyEvaluationSerializer(
                evaluation
            ).data
        )


# 24시간 이내의 미평가 목록 조회
class NightlyEvaluationPendingListView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        try:
            evaluations = services.ensure_pending_evaluations(
                user=user,
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
            NightlyEvaluationSerializer(
                evaluations,
                many=True,
            ).data
        )


class NightlyEvaluationDetailView(APIView):

    def get(self, request, uuid, pk):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        evaluation = get_object_or_404(
            NightlyEvaluation,
            pk=pk,
            user=user,
        )

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
            NightlyEvaluationSerializer(
                evaluation
            ).data
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
        req.is_valid(
            raise_exception=True
        )

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
            NightlyEvaluationSerializer(
                evaluation
            ).data
        )