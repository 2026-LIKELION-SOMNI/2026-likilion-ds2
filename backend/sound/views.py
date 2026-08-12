import concurrent.futures
import logging

from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser
from tinnitus.models import PitchMatchSession

from . import services
from .models import SoundDiscomfortReport, SoundSession
from .serializers import (
    GenerateTodaySoundRequestSerializer,
    SoundDiscomfortReportSerializer,
    SoundMixingPointUpdateSerializer,
    SoundPlaybackUpdateSerializer,
    SoundSessionResultSerializer,
    SoundVolumeUpdateSerializer,
)


logger = logging.getLogger(__name__)

# 사운드 파라미터 결정 제한시간
GENERATION_TIMEOUT_SECONDS = 8

# 사운드 생성에 필요한 사용자 데이터 수집
def _gather_generation_input(
    user,
    regenerate_avoid_reasons=None,
) -> services.GenerationInput:

    # 가장 최근에 완료된 음역 매칭 결과
    matching_session = (
        PitchMatchSession.objects
        .filter(
            user=user,
            done=True,
            abandoned=False,
        )
        .order_by("-completed_at")
        .first()
    )

    # 음역 매칭을 완료하지 않은 사용자
    if matching_session is None:
        raise services.MatchingNotCompletedError(
            "완료된 음역 매칭 결과가 없어 "
            "사운드를 생성할 수 없습니다."
        )

    # 최근 checkin
    latest_checkin = (
        user.checkins
        .order_by("-created_at")
        .first()
        if hasattr(user, "checkins")
        else None
    )

    # personalization 앱은 아직 구현 전이므로
    # 존재할 경우에만 값을 가져온다.
    personalization = getattr(
        user,
        "personalization_profile",
        None,
    )

    # 과거 도움 평가
    # feedback 구조 확정 전까지 방어적으로 조회
    past_helpful_tags = []

    if hasattr(user, "feedback_entries"):
        past_helpful_tags = list(
            user.feedback_entries
            .filter(helped=True)
            .values_list(
                "sound_tag",
                flat=True,
            )[:20]
        )

    # 최근 사운드 불편 신고
    past_discomfort_reasons = []

    recent_reports = (
        SoundDiscomfortReport.objects
        .filter(session__user=user)
        .order_by("-reported_at")[:10]
    )

    for report in recent_reports:
        past_discomfort_reasons.extend(
            report.reasons
        )

    # 재생성 시 바로 직전 불편 사유도 추가
    if regenerate_avoid_reasons:
        past_discomfort_reasons.extend(
            regenerate_avoid_reasons
        )

    return services.GenerationInput(
        tinnitus_center_hz=(
            matching_session.center_frequency
        ),
        tinnitus_freq_min_hz=(
            matching_session.lower_bound
        ),
        tinnitus_freq_max_hz=(
            matching_session.upper_bound
        ),

        sound_preferences=getattr(
            personalization,
            "sound_preferences",
            [],
        ) or [],

        current_discomfort=getattr(
            latest_checkin,
            "discomfort",
            3,
        ),

        current_tension=getattr(
            latest_checkin,
            "tension",
            3,
        ),

        sleep_hours=getattr(
            latest_checkin,
            "sleep_hours",
            None,
        ),

        daily_factors=getattr(
            latest_checkin,
            "daily_factors",
            [],
        ) or [],

        past_helpful_tags=past_helpful_tags,

        past_discomfort_reasons=(
            past_discomfort_reasons
        ),
    )


# 오늘의 사운드 준비
class GenerateTodaySoundView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        req = GenerateTodaySoundRequestSerializer(
            data=request.data
        )
        req.is_valid(raise_exception=True)

        try:
            gi = _gather_generation_input(user)

        except services.MatchingNotCompletedError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        input_snapshot = (
            services.build_input_snapshot(gi)
        )

        # 생성 시도 기록을 먼저 생성
        session = SoundSession.objects.create(
            user=user,
            input_snapshot=input_snapshot,
            status=SoundSession.Status.GENERATING,
        )

        try:
            params = self._decide_with_timeout(gi)

            session.generated_params = params

            session.recommended_duration_minutes = (
                params["duration_minutes"]
            )

            session.initial_volume = (
                params["initial_volume"]
            )

            session.status = (
                SoundSession.Status.READY
            )


            session.fallback_sound = (
                services.select_fallback_sound(gi)
            )

            session.save()

        except (
            TimeoutError,
            concurrent.futures.TimeoutError,
        ):
            self._apply_fallback(
                session,
                gi,
                error_code="timeout",
            )

        except Exception:
            logger.exception(
                "사운드 생성 실패 session_id=%s",
                session.session_id,
            )

            self._apply_fallback(
                session,
                gi,
                error_code="generation_error",
            )

        return Response(
            SoundSessionResultSerializer(
                session
            ).data,
            status=status.HTTP_201_CREATED,
        )

    # 생성 제한시간 적용
    @staticmethod
    def _decide_with_timeout(
        gi: services.GenerationInput,
    ) -> dict:

        with concurrent.futures.ThreadPoolExecutor(
            max_workers=1
        ) as executor:

            future = executor.submit(
                services.decide_parameters,
                gi,
            )

            return future.result(
                timeout=GENERATION_TIMEOUT_SECONDS
            )

    # 생성 실패 처리
    @staticmethod
    def _apply_fallback(
        session: SoundSession,
        gi: services.GenerationInput,
        error_code: str,
    ):

        fallback = (
            services.select_fallback_sound(gi)
        )

        session.fallback_sound = fallback

        session.generation_error_code = (
            error_code
        )

        session.status = (
            SoundSession.Status.GENERATION_FAILED
        )

        # fallback 후보의 재생시간을 화면에 보여줄 수 있도록 저장
        if fallback:
            session.recommended_duration_minutes = (
                fallback.duration_seconds // 60
            )

            session.initial_volume = (
                services.SAFE_INITIAL_VOLUME
            )

        session.save()


# 예비 사운드로 시작하기
class UseFallbackSoundView(APIView):

    def post(
        self,
        request,
        uuid,
        session_id,
    ):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            SoundSession,
            session_id=session_id,
            user=user,
        )

        # 생성 실패 상태에서만 fallback 사용 가능
        if (
            session.status
            != SoundSession.Status.GENERATION_FAILED
        ):
            return Response(
                {
                    "detail": (
                        "생성 실패 상태에서만 "
                        "예비 사운드를 사용할 수 있습니다."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 사용할 fallback 자체가 없는 경우
        if session.fallback_sound is None:
            return Response(
                {
                    "detail": (
                        "사용 가능한 예비 사운드가 없습니다."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 실제 fallback 사용 확정
        session.is_fallback = True

        # 재생 가능한 준비 상태로 변경
        session.status = (
            SoundSession.Status.READY
        )

        session.save(
            update_fields=[
                "is_fallback",
                "status",
                "updated_at",
            ]
        )

        return Response(
            SoundSessionResultSerializer(
                session
            ).data,
            status=status.HTTP_200_OK,
        )

# 사운드 다시 생성하기
class RegenerateSoundView(APIView):
    def post(
        self,
        request,
        uuid,
        session_id,
    ):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        prev = get_object_or_404(
            SoundSession,
            session_id=session_id,
            user=user,
        )

        # 직전 불편 신고 사유
        avoid_reasons = []

        last_report = (
            prev.discomfort_reports
            .order_by("-reported_at")
            .first()
        )

        if last_report:
            avoid_reasons = (
                last_report.reasons
            )

        try:
            gi = _gather_generation_input(
                user,
                regenerate_avoid_reasons=(
                    avoid_reasons
                ),
            )

        except services.MatchingNotCompletedError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 재생성은 새로운 세션으로 기록
        new_session = SoundSession.objects.create(
            user=user,
            input_snapshot=(
                services.build_input_snapshot(gi)
            ),
            status=SoundSession.Status.GENERATING,
            regenerated_from=prev,
        )

        try:
            params = (
                GenerateTodaySoundView
                ._decide_with_timeout(gi)
            )

            new_session.generated_params = params

            new_session.recommended_duration_minutes = (
                params["duration_minutes"]
            )

            new_session.initial_volume = (
                params["initial_volume"]
            )

            new_session.status = (
                SoundSession.Status.READY
            )

            # 성공해도 fallback 후보 미리 저장
            new_session.fallback_sound = (
                services.select_fallback_sound(gi)
            )

            new_session.save()

        except (
            TimeoutError,
            concurrent.futures.TimeoutError,
        ):
            GenerateTodaySoundView._apply_fallback(
                new_session,
                gi,
                error_code="timeout",
            )

        except Exception:
            logger.exception(
                "사운드 재생성 실패 session_id=%s",
                new_session.session_id,
            )

            GenerateTodaySoundView._apply_fallback(
                new_session,
                gi,
                error_code="generation_error",
            )

        return Response(
            SoundSessionResultSerializer(
                new_session
            ).data,
            status=status.HTTP_201_CREATED,
        )



# SoundSession 조회
class SoundSessionDetailView(APIView):
    def get(
        self,
        request,
        uuid,
        session_id,
    ):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            SoundSession,
            session_id=session_id,
            user=user,
        )

        return Response(
            SoundSessionResultSerializer(
                session
            ).data
        )

# 사운드 재생 상태 관리
class SoundPlaybackView(APIView):

    def patch(
        self,
        request,
        uuid,
        session_id,
    ):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            SoundSession,
            session_id=session_id,
            user=user,
        )

        body = SoundPlaybackUpdateSerializer(
            data=request.data
        )
        body.is_valid(raise_exception=True)

        action = body.validated_data["action"]

        now = timezone.now()

        # 재생 시작
        if action == "start":

            # 재생 준비 상태가 아닐 경우 시작 불가
            if (
                session.status
                != SoundSession.Status.READY
            ):
                return Response(
                    {
                        "detail": (
                            "재생 준비가 완료된 "
                            "사운드만 시작할 수 있습니다."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            session.playback_started_at = (
                session.playback_started_at
                or now
            )

            session.status = (
                SoundSession.Status.PLAYING
            )

        # 일시정지
        elif action == "pause":

            if (
                session.status
                != SoundSession.Status.PLAYING
            ):
                return Response(
                    {
                        "detail": (
                            "재생 중인 사운드만 "
                            "일시정지할 수 있습니다."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            session.status = (
                SoundSession.Status.PAUSED
            )

        # 재개
        elif action == "resume":

            if (
                session.status
                != SoundSession.Status.PAUSED
            ):
                return Response(
                    {
                        "detail": (
                            "일시정지된 사운드만 "
                            "재개할 수 있습니다."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            session.status = (
                SoundSession.Status.PLAYING
            )

        # 종료 / 완료
        elif action in (
            "stop",
            "complete",
        ):
            session.playback_ended_at = now

            session.total_played_seconds += (
                body.validated_data.get(
                    "played_seconds_delta",
                    0,
                )
            )

            session.end_reason = (
                body.validated_data.get(
                    "end_reason",
                    (
                        SoundSession.EndReason.FADE_COMPLETE
                        if action == "complete"
                        else SoundSession.EndReason.USER_STOP
                    ),
                )
            )

            session.status = (
                SoundSession.Status.COMPLETED
                if action == "complete"
                else SoundSession.Status.STOPPED_EARLY
            )

        session.save()

        return Response(
            SoundSessionResultSerializer(
                session
            ).data
        )

# 볼륨 조절(사용자가 보낸 gain값에 서비스 상한 적용)
class SoundVolumeView(APIView):

    def patch(
        self,
        request,
        uuid,
        session_id,
    ):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            SoundSession,
            session_id=session_id,
            user=user,
        )

        body = SoundVolumeUpdateSerializer(
            data=request.data
        )
        body.is_valid(raise_exception=True)

        requested = (
            body.validated_data["volume"]
        )

        # 서비스 최대 gain 적용
        clamped = min(
            requested,
            services.SAFE_MAX_VOLUME,
        )

        session.max_volume_applied = clamped

        session.save(
            update_fields=[
                "max_volume_applied",
                "updated_at",
            ]
        )

        return Response(
            {
                "requested_volume": requested,
                "applied_volume": clamped,
                "capped": clamped < requested,
                "max_volume": (
                    services.SAFE_MAX_VOLUME
                ),
            }
        )
# 불편 신고
class SoundDiscomfortReportView(APIView):
    def post(
        self,
        request,
        uuid,
        session_id,
    ):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            SoundSession,
            session_id=session_id,
            user=user,
        )
        # 현재 사운드 즉시 중지
        session.status = (
            SoundSession.Status.DISCOMFORT_STOPPED
        )

        session.playback_ended_at = (
            timezone.now()
        )

        session.end_reason = (
            SoundSession.EndReason.DISCOMFORT
        )

        session.save(
            update_fields=[
                "status",
                "playback_ended_at",
                "end_reason",
                "updated_at",
            ]
        )

        # 불편 신고 저장
        body = SoundDiscomfortReportSerializer(
            data=request.data
        )

        body.is_valid(
            raise_exception=True
        )

        report = body.save(
            session=session
        )

        response_data = (
            SoundDiscomfortReportSerializer(
                report
            ).data
        )

        response_data["session_status"] = (
            session.status
        )

        # 이전에 편안했던 사운드로 전환
        if (
            report.follow_up_action
            == SoundDiscomfortReport
            .FollowUpAction
            .SWITCH_TO_PREVIOUS_COMFORTABLE
        ):
            comfortable_sessions = (
                services.list_comfortable_sessions(
                    user
                )
            )

            response_data[
                "comfortable_session_candidates"
            ] = (
                SoundSessionResultSerializer(
                    comfortable_sessions,
                    many=True,
                ).data
            )
        # 다른 사운드로 바꾸기
        elif (
            report.follow_up_action
            == SoundDiscomfortReport
            .FollowUpAction
            .REGENERATE
        ):
            response_data[
                "can_regenerate"
            ] = True

        # 오늘은 세션 마치기
        elif (
            report.follow_up_action
            == SoundDiscomfortReport
            .FollowUpAction
            .END_SESSION
        ):
            response_data[
                "session_ended"
            ] = True

        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )
# 혼합점 저장
class SoundMixingPointView(APIView):
    def patch(
        self,
        request,
        uuid,
        session_id,
    ):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = get_object_or_404(
            SoundSession,
            session_id=session_id,
            user=user,
        )

        body = (
            SoundMixingPointUpdateSerializer(
                data=request.data
            )
        )

        body.is_valid(
            raise_exception=True
        )

        session.mixing_point_gain = (
            body.validated_data[
                "mixing_point_gain"
            ]
        )

        session.save(
            update_fields=[
                "mixing_point_gain",
                "updated_at",
            ]
        )

        return Response(
            {
                "mixing_point_gain": (
                    session.mixing_point_gain
                )
            },
            status=status.HTTP_200_OK,
        )