import concurrent.futures
import logging

from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from personalization.models import InterventionDecision
from personalization import services as personalization_services

from accounts.models import AnonymousUser
from tinnitus.models import PitchMatchSession

from . import services
from .models import SoundDiscomfortReport, SoundSession
from .serializers import *


logger = logging.getLogger(__name__)

# 사운드 파라미터 결정 제한시간
GENERATION_TIMEOUT_SECONDS = 8


# 사운드 생성에 필요한 사용자 데이터 수집
def _gather_generation_input(
    user,
    regenerate_avoid_reasons=None,
    decision=None,
    selected_background=None,
) -> tuple[
    services.GenerationInput,
    InterventionDecision | None,
]:
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
            "완료된 음역 매칭 결과가 없어 사운드를 생성할 수 없습니다."
        )

    if matching_session.mixing_point_gain is None:
        raise services.MatchingNotCompletedError(
            "혼합점 측정이 완료되지 않아 사운드를 생성할 수 없습니다."
        )

# 별도로 전달받은 personalization 결정이 없으면 가장 최근 결정 사용
    if decision is None:
        decision = (
            InterventionDecision.objects
            .filter(user=user)
            .order_by("-decided_at")
            .first()
        )

    sound_strategy = (
        decision.sound_strategy
        if decision is not None
        else {}
    ) or {}

    # soundfit 결과
    # 이후 personalization이 SoundFitProfile까지 직접 반영하도록 구조를 변경하면 sound에서 직접 읽는 부분은 제거할 예정
    sound_fit_profile = getattr(
        user,
        "soundfit_profile",
        None,
    )

    # 최근 사운드 불편 신고(고수준 결정에는 사용 x, 생성 실패 시 fallback sound 후보 선택에만 사용)
    past_discomfort_reasons = []

    recent_reports = (
        SoundDiscomfortReport.objects
        .filter(session__user=user)
        .order_by("-reported_at")[:10]
    )

    for report in recent_reports:
        past_discomfort_reasons.extend(
            report.reasons
            or []
        )

    # 재생성 시 바로 직전 불편 사유도 추가
    if regenerate_avoid_reasons:
        past_discomfort_reasons.extend(
            regenerate_avoid_reasons
        )

    gi = services.GenerationInput(
        tinnitus_center_hz=(
            matching_session.center_frequency
        ),

        tinnitus_freq_min_hz=(
            matching_session.lower_bound
        ),

        tinnitus_freq_max_hz=(
            matching_session.upper_bound
        ),

        mixing_point_gain=(
            matching_session.mixing_point_gain
        ),

        past_discomfort_reasons=(
            past_discomfort_reasons
        ),
        selected_background=selected_background,

        # soundfit 결과
        sound_fit_texture=getattr(
            sound_fit_profile,
            "texture",
            None,
        ),

        sound_fit_layer_mix=getattr(
            sound_fit_profile,
            "layer_mix",
            None,
        ),

        # personalization이 결정한 오늘의 사운드 전략
        personalization_background=(
            sound_strategy.get(
                "background"
            )
        ),

        personalization_masking_ratio=(
            sound_strategy.get(
                "masking_ratio"
            )
        ),

        personalization_modulation_intensity=(
            sound_strategy.get(
                "modulation_intensity"
            )
        ),

        personalization_mixing_point_gain=(
            sound_strategy.get(
                "mixing_point_gain"
            )
        ),

        personalization_duration_minutes=(
            sound_strategy.get(
                "duration_minutes"
            )
        ),
    )

    return gi, decision


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

        req.is_valid(
            raise_exception=True
        )

        selected_background = (
            req.validated_data.get(
                "background"
            )
        )

        try:
            gi, decision = (
                _gather_generation_input(
                    user,
                    selected_background=selected_background,
                )
            )

        except services.MatchingNotCompletedError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if decision is None:
            from checkin.models import CheckinRecord

            latest_checkin = (
                CheckinRecord.objects
                .filter(user=user)
                .order_by("-created_at")
                .first()
            )

            state = (
                personalization_services
                .build_current_state(
                    user=user,
                    tinnitus_discomfort=(
                        latest_checkin.discomfort
                        if latest_checkin
                        else 3
                    ),
                    anxiety=(
                        latest_checkin.tension
                        if latest_checkin
                        else 3
                    ),
                    stress=(
                        "stress"
                        in (
                            latest_checkin.daily_factors
                            if latest_checkin
                            else []
                        )
                    ),
                    fatigue=None,
                    caffeine=(
                        "caffeine"
                        in (
                            latest_checkin.daily_factors
                            if latest_checkin
                            else []
                        )
                    ),
                )
            )

            decision_data = (
                personalization_services
                .decide_intervention(
                    user=user,
                    state=state,
                )
            )

            decision = (
                personalization_services
                .record_decision(
                    user=user,
                    state=state,
                    decision=decision_data,
                )
            )

            gi, decision = (
                _gather_generation_input(
                    user,
                    decision=decision,
                    selected_background=selected_background,
                )
            )
        input_snapshot = (
            services.build_input_snapshot(
                gi
            )
        )

        # 생성 시도 기록을 먼저 생성
        session = SoundSession.objects.create(
            user=user,
            input_snapshot=input_snapshot,
            status=SoundSession.Status.GENERATING,
        )

        # personalization 결정과 실제 sound session 연결
        if decision is not None:
            personalization_services.attach_sessions(
                decision,
                sound_session_id=session.pk,
            )

        try:
            params = self._decide_with_timeout(
                gi
            )

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

            # 실시간 생성 실패에 대비한 fallback 후보
            session.fallback_sound = (
                services.select_fallback_sound(
                    gi
                )
            )

            session.save()

            # 최초 생성된 사운드 설정을 실제 재생 설정의 초기값으로 저장
            services.initialize_final_params(
                session
            )

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
            services.select_fallback_sound(
                gi
            )
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
                or []
            )

        # 직전 사운드를 만든 personalization 결정 조회
        previous_decision = (
            InterventionDecision.objects
            .filter(
                user=user,
                sound_session_id=prev.pk,
            )
            .order_by("-decided_at")
            .first()
        )

        # 과거 데이터 등으로 연결된 decision을 찾지 못한 경우
        # 가장 최근 personalization 결정을 사용
        if previous_decision is None:
            previous_decision = (
                InterventionDecision.objects
                .filter(user=user)
                .order_by("-decided_at")
                .first()
            )

        if previous_decision is None:
            return Response(
                {
                    "detail": (
                        "재생성에 사용할 personalization "
                        "결정을 찾을 수 없습니다."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 기존 decision 당시의 현재 상태 복원
        state = personalization_services.CurrentState(
            **(
                previous_decision.state_snapshot
                or {}
            )
        )

        # 사용자가 실제로 마지막에 들었던 자연음 확인
        previous_params = (
            prev.final_params
            or prev.generated_params
            or {}
        )

        previous_background = None

        for source in previous_params.get(
            "sources",
            [],
        ):
            if (
                isinstance(source, dict)
                and source.get("type")
                == "background"
            ):
                previous_background = (
                    source.get("asset_tag")
                )
                break

            # 이전 데이터 형식 대응
            if (
                isinstance(source, str)
                and source
                in personalization_services.BACKGROUND_CANDIDATES
            ):
                previous_background = source
                break

        # 기존 personalization 규칙을 그대로 사용하되
        # 방금 불편했던 이유와 직전 자연음을 즉시 반영
        regenerated_decision_data = (
            personalization_services
            .decide_intervention(
                user=user,
                state=state,
                immediate_discomfort_reasons=(
                    avoid_reasons
                ),
                previous_background=(
                    previous_background
                ),
            )
        )

        # 재생성 결과도 별도 personalization 결정으로 기록
        decision = (
            personalization_services
            .record_decision(
                user=user,
                state=state,
                decision=(
                    regenerated_decision_data
                ),
            )
        )

        try:
            gi, decision = (
                _gather_generation_input(
                    user,
                    regenerate_avoid_reasons=(
                        avoid_reasons
                    ),
                    decision=decision,
                )
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
                services.build_input_snapshot(
                    gi
                )
            ),
            status=SoundSession.Status.GENERATING,
            regenerated_from=prev,
        )

        # 새 personalization 결정과 새 sound session 연결
        personalization_services.attach_sessions(
            decision,
            sound_session_id=new_session.pk,
        )

        try:
            params = (
                GenerateTodaySoundView
                ._decide_with_timeout(
                    gi
                )
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
                services.select_fallback_sound(
                    gi
                )
            )

            new_session.save()

            # 재생성된 사운드도 실제 재생 설정의 초기값 저장
            services.initialize_final_params(
                new_session
            )

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


# 가장 최근 SoundSession 조회
# 프론트가 저장해둔 session_id를 잃어버렸을 때, uuid만으로 최신 세션을 다시 불러오기 위함
class LatestSoundSessionView(APIView):

    def get(
        self,
        request,
        uuid,
    ):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        session = (
            SoundSession.objects
            .filter(user=user)
            .order_by("-created_at")
            .first()
        )

        if session is None:
            return Response(
                {
                    "detail": (
                        "생성된 사운드 세션이 없습니다."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            SoundSessionResultSerializer(
                session
            ).data
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


# 배경 자연음 변경
# 실제 오디오 변경은 프론트(Web Audio API)에서 수행하고
# 백엔드는 사용자가 최종적으로 선택한 배경음만 저장
class SoundBackgroundView(APIView):

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

        body = SoundBackgroundUpdateSerializer(
            data=request.data
        )

        body.is_valid(
            raise_exception=True
        )

        session = services.update_background_sound(
            session,
            body.validated_data["background"],
        )

        return Response(
            SoundSessionResultSerializer(
                session
            ).data,
            status=status.HTTP_200_OK,
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

        body.is_valid(
            raise_exception=True
        )

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


# 볼륨 조절
# 사용자가 보낸 gain값에 서비스 상한 적용
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

        body.is_valid(
            raise_exception=True
        )

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

#이전에 편안했던 사운드 듣기
class SwitchToComfortableSoundView(APIView):
    def post(self, request, uuid, session_id):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        source_session = get_object_or_404(
            SoundSession, session_id=session_id, user=user
        )
        new_session = services.switch_to_comfortable_session(user, source_session)
        return Response(
            SoundSessionResultSerializer(new_session).data,
            status=status.HTTP_201_CREATED,
        )


class HomeComfortableSoundView(APIView):
    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        result = services.get_latest_comfortable_session(user)

        if result is None:
            return Response(status=status.HTTP_204_NO_CONTENT)

        data = {
            "session_id": result["session"].session_id,
            "sound_summary": services.build_sound_summary_label(result["session"]),
            "evaluated_at": result["evaluated_at"],
        }
        return Response(ComfortableSoundItemSerializer(data).data)


# 마이페이지 "나의 사운드" 목록
class MySoundListView(APIView):
    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        items = services.list_comfortable_sessions_with_meta(user)

        data = [
            {
                "session_id": item["session"].session_id,
                "sound_summary": services.build_sound_summary_label(item["session"]),
                "evaluated_at": item["evaluated_at"],
            }
            for item in items
        ]

        return Response(
            ComfortableSoundItemSerializer(data, many=True).data
        )