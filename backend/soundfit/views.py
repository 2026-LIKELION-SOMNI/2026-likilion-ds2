from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser

from . import services
from .models import FitAxis, SoundFitProfile, SoundFitSession
from .serializers import (
    SoundFitProfileSerializer,
    SoundFitSelectSerializer,
    SoundFitSessionSerializer,
)


# Sound Fit 시작
# Figma "다시 측정하기" 버튼도 이 엔드포인트를 그대로 재사용!
class SoundFitStartView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)

        # 이전에 완료하지 못하고 남아있는 세션이 있으면 중단 처리 (다시 측정하기 시 정리)
        SoundFitSession.objects.filter(
            user=user, done=False, abandoned=False
        ).update(abandoned=True)

        axis, _, _ = services.start_session_options()
        session = SoundFitSession.objects.create(
            user=user,
            round_number=1,
            current_axis=axis,
        )
        return Response(SoundFitSessionSerializer(session).data, status=status.HTTP_201_CREATED)


# A/B 선택 제출
class SoundFitSelectView(APIView):

    def post(self, request, session_id):
        session = get_object_or_404(
            SoundFitSession, pk=session_id, done=False, abandoned=False
        )

        serializer = SoundFitSelectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        selected = serializer.validated_data["selected"]

        session = services.apply_selection(session, selected)

        if services.is_fit_complete(session.round_number):
            # TODO: "마지막 확인" 단계 - 팀 답변 확인 후 여기 로직 추가 예정.
            # 그 전까지는 2라운드 완료 시점에 바로 프로필 확정.
            session.done = True
            session.completed_at = timezone.now()
            session.save()
            services.finalize_profile(session)
        else:
            next_axis, _, _ = services.next_round_options(session.round_number)
            session.current_axis = next_axis
            session.save()

        return Response(SoundFitSessionSerializer(session).data, status=status.HTTP_200_OK)


# My Sound Profile 조회
class SoundFitProfileView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        profile = get_object_or_404(SoundFitProfile, user=user)
        return Response(SoundFitProfileSerializer(profile).data)