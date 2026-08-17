from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser
from personalization.models import InterventionDecision
from personalization import services as personalization_services

from . import services
from .models import RelaxationSession
from .serializers import RelaxationSessionSerializer


# 잘못된 세션 상태 전이를 400 응답으로 변환
def _state_error_response(exc):
    return Response(
        {"detail": str(exc)},
        status=status.HTTP_400_BAD_REQUEST,
    )


# F-801
# personalization의 최신 개입 결정을 바탕으로
# 시작 전 상태의 이완 세션을 하나 생성
class RelaxationRecommendationView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        # 가장 최근 personalization 결정 조회
        decision = (
            InterventionDecision.objects
            .filter(user=user)
            .order_by("-decided_at")
            .first()
        )

        if decision is None:
            return Response(
                {
                    "detail": (
                        "이완 세션을 생성할 "
                        "personalization 결정이 없습니다."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 같은 decision으로 이미 relaxation 세션을 생성한 경우
        # 중복 생성하지 않고 기존 세션 반환
        if decision.relaxation_session_id is not None:
            existing_session = (
                RelaxationSession.objects
                .filter(
                    pk=decision.relaxation_session_id,
                    user=user,
                )
                .first()
            )

            if existing_session is not None:
                return Response(
                    RelaxationSessionSerializer(
                        existing_session
                    ).data,
                    status=status.HTTP_200_OK,
                )

        state_snapshot = (
            decision.state_snapshot
            or {}
        )

        # personalization이 결정한 값으로
        # relaxation 세션 생성
        session = services.create_recommended_session(
            user=user,
            activity_type=(
                decision.relaxation_activity_type
            ),
            recommendation_source=(
                decision.relaxation_recommendation_source
            ),
            tinnitus_discomfort=(
                state_snapshot.get(
                    "tinnitus_discomfort",
                    3,
                )
            ),
            anxiety=(
                state_snapshot.get(
                    "anxiety",
                    3,
                )
            ),
            stress=(
                state_snapshot.get(
                    "stress",
                    False,
                )
            ),
            fatigue=(
                state_snapshot.get(
                    "fatigue"
                )
            ),
            caffeine=(
                state_snapshot.get(
                    "caffeine",
                    False,
                )
            ),
        )

        # personalization 결정과 실제 relaxation 세션 연결
        personalization_services.attach_sessions(
            decision,
            relaxation_session_id=session.pk,
        )

        return Response(
            RelaxationSessionSerializer(
                session
            ).data,
            status=status.HTTP_201_CREATED,
        )


# 추천된 세션 시작
class RelaxationSessionStartView(APIView):

    def post(self, request, uuid, session_id):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            RelaxationSession,
            session_id=session_id,
            user=user,
        )

        try:
            session = services.start_session(
                session
            )

        except services.InvalidRelaxationStateError as exc:
            return _state_error_response(
                exc
            )

        return Response(
            RelaxationSessionSerializer(
                session
            ).data
        )


# 건너뛰기(시작 전)
class RelaxationSessionSkipView(APIView):

    def post(self, request, uuid, session_id):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            RelaxationSession,
            session_id=session_id,
            user=user,
        )

        try:
            session = services.skip_session(
                session
            )

        except services.InvalidRelaxationStateError as exc:
            return _state_error_response(
                exc
            )

        return Response(
            RelaxationSessionSerializer(
                session
            ).data
        )


# 중단(시작 후)
class RelaxationSessionCancelView(APIView):

    def post(self, request, uuid, session_id):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            RelaxationSession,
            session_id=session_id,
            user=user,
        )

        try:
            session = services.cancel_session(
                session
            )

        except services.InvalidRelaxationStateError as exc:
            return _state_error_response(
                exc
            )

        return Response(
            RelaxationSessionSerializer(
                session
            ).data
        )


# 개입 완료
class RelaxationSessionCompleteView(APIView):

    def post(self, request, uuid, session_id):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            RelaxationSession,
            session_id=session_id,
            user=user,
        )

        try:
            session = services.complete_session(
                session
            )

        except services.InvalidRelaxationStateError as exc:
            return _state_error_response(
                exc
            )

        return Response(
            RelaxationSessionSerializer(
                session
            ).data
        )