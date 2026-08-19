from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser

from .models import PitchMatchSession, TinnitusProfile
from .serializers import (
    MatchingSelectSerializer,
    OctaveCheckSerializer,
    PitchMatchSessionSerializer,
    TinnitusProfileSerializer,
    MixingPointGainSerializer,
)
from .services import pitch_matching as pm


# F-301~304: 이명 프로필 저장/조회
class TinnitusProfileView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        profile = get_object_or_404(TinnitusProfile, user=user)
        return Response(TinnitusProfileSerializer(profile).data)

    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        profile, created = TinnitusProfile.objects.get_or_create(user=user)

        # 최초로 생성했을 때 필수 필드 검증해야 함
        serializer = TinnitusProfileSerializer(profile, data=request.data, partial=not created)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# F-305~306: 음역 매칭 시작
class MatchingStartView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        profile = get_object_or_404(TinnitusProfile, user=user)

        primary = request.data.get("primary_tone_type")
        if profile.tone_type == "multiple" and primary:
            profile.primary_tone_type = primary
            profile.save(update_fields=["primary_tone_type"])

        tinnitus_type = profile.tinnitus_type
        if tinnitus_type is None:
            return Response(
                {"detail": "복합형(multiple)은 primary_tone_type을 먼저 선택해야 매칭을 시작할 수 있습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        range_min, range_max = pm.start_session_range()
        session = PitchMatchSession.objects.create(
            user=user,
            tinnitus_type=tinnitus_type,
            range_min=range_min,
            range_max=range_max,
            round_number=1,
            freq_a=range_min,
            freq_b=range_max,
        )
        return Response(PitchMatchSessionSerializer(session).data, status=status.HTTP_201_CREATED)


# F-307~309: 매칭 A/B 선택 제출
class MatchingSelectView(APIView):

    def post(self, request, session_id):
        session = get_object_or_404(
            PitchMatchSession,
            pk=session_id,
            done=False,
            abandoned=False,
            octave_test_started=False,
        )

        serializer = MatchingSelectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        selected = serializer.validated_data["selected"]

        session.rounds.append({
            "round": session.round_number,
            "selected": selected,
            "freq_a": session.freq_a,
            "freq_b": session.freq_b,
            "range_min_before": session.range_min,
            "range_max_before": session.range_max,
        })

        new_min, new_max = pm.next_round_range(session.range_min, session.range_max, selected)
        session.range_min = new_min
        session.range_max = new_max
        session.round_number += 1

        if pm.is_matching_complete(session.round_number):
            session.provisional_center = pm.compute_provisional_center(new_min, new_max)
            session.octave_test_started = True
            session.freq_a = None
            session.freq_b = None
        else:
            session.freq_a = new_min
            session.freq_b = new_max

        session.save()
        return Response(PitchMatchSessionSerializer(session).data, status=status.HTTP_200_OK)


# - A/B 라운드 중: 직전 라운드의 A/B와 범위로 돌아감
# - Octave Confusion Test: 마지막 A/B 라운드(7/7)로 돌아감
class MatchingPreviousView(APIView):

    def post(self, request, session_id):
        session = get_object_or_404(
            PitchMatchSession, pk=session_id, done=False, abandoned=False
        )

        if not session.rounds:
            return Response(
                {"detail": "더 이상 되돌아갈 라운드가 없습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        last_round = session.rounds.pop()

        # 옥타브 테스트 단계에서 이전으로 가는 경우 -> 마지막 A/B 라운드로 복귀
        if session.octave_test_started:
            session.octave_test_started = False
            session.octave_selection = None
            session.octave_check_limited = False
            session.provisional_center = None

        session.round_number = last_round["round"]
        session.range_min = last_round["range_min_before"]
        session.range_max = last_round["range_max_before"]
        session.freq_a = last_round["freq_a"]
        session.freq_b = last_round["freq_b"]

        session.save()
        return Response(PitchMatchSessionSerializer(session).data, status=status.HTTP_200_OK)


# F-309(연장): Octave Confusion Test
class OctaveCheckView(APIView):

    def post(self, request, session_id):
        session = get_object_or_404(
            PitchMatchSession,
            pk=session_id,
            done=False,
            abandoned=False,
            octave_test_started=True,
        )

        serializer = OctaveCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        selected = serializer.validated_data["selected"]

        candidates = pm.octave_test_candidates(session.provisional_center)
        if candidates.get(selected) is None:
            return Response(
                {"detail": "지원 범위를 벗어난 후보는 선택할 수 없습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = pm.apply_octave_correction(
            session.provisional_center, session.range_min, session.range_max, selected
        )

        session.octave_selection = selected
        session.octave_check_limited = candidates["limited"]
        session.center_frequency = result["center_frequency"]
        session.lower_bound = result["lower_bound"]
        session.upper_bound = result["upper_bound"]
        session.octave_corrected = result["octave_corrected"]
        session.save()

        return Response(PitchMatchSessionSerializer(session).data, status=status.HTTP_200_OK)


# F-310: 추정 음역 결과 조회 (sound 앱이 참조해야 하는 필드!!)
class MatchingResultView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        session = (
            PitchMatchSession.objects.filter(user=user, done=True, abandoned=False)
            .order_by("-completed_at")
            .first()
        )
        if session is None:
            return Response(
                {"detail": "완료된 음역 매칭 결과가 없습니다."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(PitchMatchSessionSerializer(session).data)


# F-311~312: 매칭 초기 음량 설정 조회
class MatchingVolumeConfigView(APIView):

    INITIAL_VOLUME = 0.3
    MAX_VOLUME = 0.6

    def get(self, request):
        return Response({"initial_volume": self.INITIAL_VOLUME, "max_volume": self.MAX_VOLUME})


# F-314: 매칭 중단 / 다시 시작
class MatchingAbandonView(APIView):

    def post(self, request, session_id):
        session = get_object_or_404(PitchMatchSession, pk=session_id, done=False, abandoned=False)
        session.abandoned = True
        session.abandoned_at = timezone.now()
        session.save(update_fields=["abandoned", "abandoned_at"])
        return Response(
            {"id": session.id, "abandoned": True, "abandoned_at": session.abandoned_at}
        )


# 혼합점 저장 view
class MatchingMixingPointView(APIView):

    def post(self, request, session_id):
        session = get_object_or_404(
            PitchMatchSession,
            pk=session_id,
            done=False,
            abandoned=False,
            octave_selection__isnull=False,
        )

        serializer = MixingPointGainSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )

        session.mixing_point_gain = (
            serializer.validated_data["mixing_point_gain"]
        )

        # 혼합점까지 입력돼야 최종 완료
        session.done = True
        session.completed_at = timezone.now()

        session.save(
            update_fields=[
                "mixing_point_gain",
                "done",
                "completed_at",
            ]
        )

        return Response(
            PitchMatchSessionSerializer(session).data,
            status=status.HTTP_200_OK,
        )