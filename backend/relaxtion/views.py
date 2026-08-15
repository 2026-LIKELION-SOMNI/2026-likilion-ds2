from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser

from . import services
from .models import RelaxationSession
from .serializers import (
    RelaxationRecommendationRequestSerializer,
    RelaxationSessionSerializer,
)

# 잘못된 세션 상태 전이를 400 응답으로 변환
def _state_error_response(exc):
    return Response(
        {"detail": str(exc)},
        status=status.HTTP_400_BAD_REQUEST,
    )

# F-801
# 오늘 상태값을 받아 이완/주의전환 활동을 추천하고 시작 전 상태의 세션을 하나 생성
class RelaxationRecommendationView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        req = RelaxationRecommendationRequestSerializer(
            data=request.data,
        )
        req.is_valid(
            raise_exception=True,
        )

        session = services.create_recommended_session(
            user=user,
            tinnitus_discomfort=req.validated_data[
                "tinnitus_discomfort"
            ],
            anxiety=req.validated_data["anxiety"],
            stress=req.validated_data["stress"],
            fatigue=req.validated_data.get("fatigue"),
            caffeine=req.validated_data.get(
                "caffeine",
                False,
            ),
        )

        return Response(
            RelaxationSessionSerializer(session).data,
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
            session = services.start_session(session)

        except services.InvalidRelaxationStateError as exc:
            return _state_error_response(exc)

        return Response(
            RelaxationSessionSerializer(session).data
        )


#건너뛰기(시작 전)
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
            session = services.skip_session(session)

        except services.InvalidRelaxationStateError as exc:
            return _state_error_response(exc)

        return Response(
            RelaxationSessionSerializer(session).data
        )


#중단(시작 후)
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
            session = services.cancel_session(session)

        except services.InvalidRelaxationStateError as exc:
            return _state_error_response(exc)

        return Response(
            RelaxationSessionSerializer(session).data
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
            session = services.complete_session(session)

        except services.InvalidRelaxationStateError as exc:
            return _state_error_response(exc)

        return Response(
            RelaxationSessionSerializer(session).data
        )