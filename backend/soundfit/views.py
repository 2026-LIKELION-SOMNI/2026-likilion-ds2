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


# Sound Fit 시작 (1/2 라운드, Texture 축)
# 디자인에 "다시 측정하기" 버튼도 이 엔드포인트를 그대로 재사용함 (tinnitus의 matching/start와 동일 패턴)
class SoundFitStartView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)

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
            session.done = True
            session.completed_at = timezone.now()
            session.save()
            services.finalize_profile(session)
        else:
            next_axis, _, _ = services.next_round_options(session.round_number)
            session.current_axis = next_axis
            session.save()

        return Response(SoundFitSessionSerializer(session).data, status=status.HTTP_200_OK)


# 이전 단계로 rollback
class SoundFitPreviousView(APIView):

    def post(self, request, session_id):
        session = get_object_or_404(SoundFitSession, pk=session_id, abandoned=False)

        if not session.rounds:
            return Response(
                {"detail": "더 이상 되돌아갈 라운드가 없습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        last_round = session.rounds.pop()

        # 완료된 상태(결과 화면)에서 이전으로 가는 경우 -> 완료 취소하고 해당 라운드로 복귀
        if session.done:
            session.done = False
            session.completed_at = None

        session.round_number = last_round["round"]
        session.current_axis = last_round["axis"]

        if last_round["axis"] == FitAxis.TEXTURE:
            session.texture = None
        elif last_round["axis"] == FitAxis.LAYER_MIX:
            session.layer_mix = None

        session.save()
        return Response(SoundFitSessionSerializer(session).data, status=status.HTTP_200_OK)


# My Sound Profile 조회
class SoundFitProfileView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        profile = get_object_or_404(SoundFitProfile, user=user)
        return Response(SoundFitProfileSerializer(profile).data)