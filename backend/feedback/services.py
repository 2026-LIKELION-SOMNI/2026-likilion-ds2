from __future__ import annotations

from datetime import timedelta
from typing import Optional

from django.core.exceptions import ValidationError
from django.utils import timezone

from personalization.models import InterventionDecision
from relaxtion.models import RelaxationSession
from sound.models import SoundSession

from .models import NightlyEvaluation


# 평가가능 제한 시간 (= 24시간)
EVALUATION_WINDOW = timedelta(hours=24)


# 이미 평가 row에 연결된 sound 세션인지 확인
def _sound_evaluation_exists(
    *,
    user,
    sound_session_id: int,
) -> bool:

    return (
        NightlyEvaluation.objects
        .filter(
            user=user,
            sound_session_id=sound_session_id,
        )
        .exists()
    )

# 해당 sound와 같은 personalization 결정에 연결된 relaxation 세션 조회
def _get_relaxation_for_sound(
    *,
    user,
    sound_session,
):

    decision = (
        InterventionDecision.objects
        .filter(
            user=user,
            sound_session_id=sound_session.pk,
            relaxation_session_id__isnull=False,
        )
        .order_by("-decided_at")
        .first()
    )

    if decision is None:
        return None

    return (
        RelaxationSession.objects
        .filter(
            pk=decision.relaxation_session_id,
            user=user,
        )
        .first()
    )


# 아직 평가 row가 생성되지 않은 최근 세션에 대해 평가 row 생성
def ensure_pending_evaluations(
    *,
    user,
) -> list[NightlyEvaluation]:

    now = timezone.now()
    window_start = (
        now
        - EVALUATION_WINDOW
    )

    # 아직 평가와 연결되지 않은 sound 세션 처리
    sound_sessions = (
        SoundSession.objects
        .filter(
            user=user,
            playback_ended_at__isnull=False,
            playback_ended_at__gte=window_start,
            playback_ended_at__lte=now,
        )
        .order_by(
            "playback_ended_at"
        )
    )

    for sound_session in sound_sessions:

        if _sound_evaluation_exists(
            user=user,
            sound_session_id=sound_session.pk,
        ):
            continue

        relaxation_session = (
            _get_relaxation_for_sound(
                user=user,
                sound_session=sound_session,
            )
        )

        for_date = (
            sound_session.playback_started_at.date()
            if sound_session.playback_started_at
            else sound_session.playback_ended_at.date()
        )

        NightlyEvaluation.objects.create(
            user=user,
            for_date=for_date,
            sound_session=sound_session,
            relaxation_session=relaxation_session,
        )

    # 기존 pending 평가 중 24시간 초과된 평가를 expired 상태로 전환
    pending_evaluations = (
        NightlyEvaluation.objects
        .filter(
            user=user,
            status=NightlyEvaluation.Status.PENDING,
        )
    )

    for evaluation in pending_evaluations:
        expire_evaluation_if_needed(
            evaluation
        )

    # 현재 평가 가능한 pending 목록 반환
    return list(
        NightlyEvaluation.objects
        .filter(
            user=user,
            status=NightlyEvaluation.Status.PENDING,
        )
        .select_related(
            "sound_session",
            "relaxation_session",
        )
        .order_by(
            "-created_at"
        )
    )


# 평가 가능 종료 시각 계산
# 해당 루틴의 마지막 개입 종료 시각 + 24시간
def _get_evaluation_deadline(
    evaluation: NightlyEvaluation,
):

    ended_times = []

    sound_session = (
        evaluation.sound_session
    )

    if (
        sound_session is not None
        and sound_session.playback_ended_at is not None
    ):
        ended_times.append(
            sound_session.playback_ended_at
        )

    relaxation_session = (
        evaluation.relaxation_session
    )

    if (
        relaxation_session is not None
        and relaxation_session.ended_at is not None
    ):
        ended_times.append(
            relaxation_session.ended_at
        )

    if not ended_times:
        return None

    last_ended_at = max(
        ended_times
    )

    return (
        last_ended_at
        + EVALUATION_WINDOW
    )


# 세션 종료 시각을 알 수 없을 경우 평가 불가
def is_evaluation_expired(
    evaluation: NightlyEvaluation,
) -> bool:

    deadline = (
        _get_evaluation_deadline(
            evaluation
        )
    )

    if deadline is None:
        raise ValidationError(
            "세션 종료 시각을 확인할 수 없습니다."
        )

    return (
        timezone.now()
        > deadline
    )


# pending 평가가 24시간 초과 시 expired 상태로 전환
def expire_evaluation_if_needed(
    evaluation: NightlyEvaluation,
) -> NightlyEvaluation:

    if (
        evaluation.status
        == NightlyEvaluation.Status.PENDING
        and is_evaluation_expired(
            evaluation
        )
    ):
        evaluation.status = (
            NightlyEvaluation.Status.EXPIRED
        )

        evaluation.save(
            update_fields=[
                "status",
            ]
        )

    return evaluation


# 평가 제출
def submit_evaluation(
    evaluation: NightlyEvaluation,
    *,
    sleep_latency: Optional[str] = None,
    discomfort_after: Optional[int] = None,
    anxiety_after: Optional[int] = None,
    routine_helpfulness: Optional[int] = None,
    sound_reactions: Optional[list] = None,
    current_fatigue: Optional[int] = None,
    note: str = "",
) -> NightlyEvaluation:

    # 이미 완료된 평가는 다시 제출할 수 없음
    if (
        evaluation.status
        == NightlyEvaluation.Status.EVALUATED
    ):
        raise ValidationError(
            "이미 완료된 평가입니다."
        )

    # 기존에 만료 처리된 평가
    if (
        evaluation.status
        == NightlyEvaluation.Status.EXPIRED
    ):
        raise ValidationError(
            "평가 가능 시간이 지났습니다."
        )

    # 아직 PENDING이더라도 현재 시점 기준 24시간 초과 여부 확인
    if is_evaluation_expired(
        evaluation
    ):
        evaluation.status = (
            NightlyEvaluation.Status.EXPIRED
        )

        evaluation.save(
            update_fields=[
                "status",
            ]
        )

        raise ValidationError(
            "세션 종료 후 24시간이 지나 평가할 수 없습니다."
        )

    # relaxation 세션이 없는데 routine_helpfulness가 들어온 경우
    if (
        evaluation.relaxation_session is None
        and routine_helpfulness is not None
    ):
        raise ValidationError(
            "이완 세션이 없는 평가에는 "
            "routine_helpfulness를 입력할 수 없습니다."
        )

    # sound 세션이 없는데 sound_reactions가 들어온 경우
    if (
        evaluation.sound_session is None
        and sound_reactions
    ):
        raise ValidationError(
            "사운드 세션이 없는 평가에는 "
            "sound_reactions를 입력할 수 없습니다."
        )

    evaluation.sleep_latency = (
        sleep_latency
    )

    evaluation.discomfort_after = (
        discomfort_after
    )

    evaluation.anxiety_after = (
        anxiety_after
    )

    evaluation.routine_helpfulness = (
        routine_helpfulness
    )

    evaluation.sound_reactions = (
        sound_reactions
        if sound_reactions is not None
        else []
    )

    evaluation.current_fatigue = (
        current_fatigue
    )

    evaluation.note = (
        note
    )

    evaluation.status = (
        NightlyEvaluation.Status.EVALUATED
    )

    evaluation.evaluated_at = (
        timezone.now()
    )

    evaluation.save(
        update_fields=[
            "sleep_latency",
            "discomfort_after",
            "anxiety_after",
            "routine_helpfulness",
            "sound_reactions",
            "current_fatigue",
            "note",
            "status",
            "evaluated_at",
        ]
    )

    return evaluation