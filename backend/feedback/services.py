from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Optional

from django.apps import apps
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import NightlyEvaluation

# 평가가능 제한 시간(=24시간)
EVALUATION_WINDOW = timedelta(hours=24)

# 하루 동안 진행된 세션 중 가장 최근 세션을 찾고, sound/relaxtion이 없으면 None 반환
def _get_latest_session_for_date(
    app_label: str,
    model_name: str,
    *,
    user,
    for_date: date,
    datetime_field: str,
):
    try:
        Model = apps.get_model(app_label, model_name)
    except LookupError:
        return None

    day_start = datetime.combine(for_date, time.min)
    day_end = day_start + timedelta(days=1)

    return (
        Model.objects.filter(
            user=user,
            **{
                f"{datetime_field}__gte": day_start,
                f"{datetime_field}__lt": day_end,
            },
        )
        .order_by(f"-{datetime_field}")
        .first()
    )

# 해당 밤의 평가 결과가 없으면 생성, 이미 존재하면 기존 평가 반환.
def ensure_nightly_evaluation(
    *,
    user,
    for_date: Optional[date] = None,
) -> NightlyEvaluation:

    if for_date is None:
        for_date = date.today() - timedelta(days=1)

    existing = NightlyEvaluation.objects.filter(
        user=user,
        for_date=for_date,
    ).first()

    if existing is not None:
        return existing

    sound_session = _get_latest_session_for_date(
        "sound",
        "SoundSession",
        user=user,
        for_date=for_date,
        datetime_field="playback_started_at",
    )

    relaxation_session = _get_latest_session_for_date(
        "relaxation",
        "RelaxationSession",
        user=user,
        for_date=for_date,
        datetime_field="started_at",
    )

    return NightlyEvaluation.objects.create(
        user=user,
        for_date=for_date,
        sound_session_id=(
            sound_session.pk
            if sound_session
            else None
        ),
        relaxation_session_id=(
            relaxation_session.pk
            if relaxation_session
            else None
        ),
    )

# 평가 가능 종료 시각 계산(해당 밤 '마지막' 개입 종료 시각 기준)
def _get_evaluation_deadline(
    evaluation: NightlyEvaluation,
):
    ended_times = []

    sound_session = evaluation.get_sound_session()

    if sound_session is not None:
        sound_ended_at = getattr(
            sound_session,
            "playback_ended_at",
            None,
        )

        if sound_ended_at is not None:
            ended_times.append(sound_ended_at)

    relaxation_session = evaluation.get_relaxation_session()

    if relaxation_session is not None:
        relaxation_ended_at = getattr(
            relaxation_session,
            "ended_at",
            None,
        )

        if relaxation_ended_at is not None:
            ended_times.append(relaxation_ended_at)

    if ended_times:
        last_ended_at = max(ended_times)
        return last_ended_at + EVALUATION_WINDOW

    return None

# 세션 종료 시각을 알 수 없을 시 평가 불가
def is_evaluation_expired(
    evaluation: NightlyEvaluation,
) -> bool:

    deadline = _get_evaluation_deadline(evaluation)

    if deadline is None:
        raise ValidationError(
            "세션 종료 시각을 확인할 수 없습니다."
        )

    return timezone.now() > deadline

# pending 평가가 24시간 초과 시 expired 상태로 전환(= 24시간 지나면 평가 불가)
def expire_evaluation_if_needed(
    evaluation: NightlyEvaluation,
) -> NightlyEvaluation:

    if (
        evaluation.status
        == NightlyEvaluation.Status.PENDING
        and is_evaluation_expired(evaluation)
    ):
        evaluation.status = NightlyEvaluation.Status.EXPIRED

        evaluation.save(
            update_fields=[
                "status",
            ]
        )

    return evaluation


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
    if evaluation.status == NightlyEvaluation.Status.EVALUATED:
        raise ValidationError(
            "이미 완료된 평가입니다."
        )

    # 기존에 만료 처리된 평가
    if evaluation.status == NightlyEvaluation.Status.EXPIRED:
        raise ValidationError(
            "평가 가능 시간이 지났습니다."
        )

    # 아직 PENDING이더라도 현재 시점 기준 24시간 초과 여부 확인
    if is_evaluation_expired(evaluation):
        evaluation.status = NightlyEvaluation.Status.EXPIRED

        evaluation.save(
            update_fields=[
                "status",
            ]
        )

        raise ValidationError(
            "세션 종료 후 24시간이 지나 평가할 수 없습니다."
        )

    evaluation.sleep_latency = sleep_latency
    evaluation.discomfort_after = discomfort_after
    evaluation.anxiety_after = anxiety_after
    evaluation.routine_helpfulness = routine_helpfulness
    evaluation.sound_reactions = (
        sound_reactions
        if sound_reactions is not None
        else []
    )
    evaluation.current_fatigue = current_fatigue
    evaluation.note = note

    evaluation.status = NightlyEvaluation.Status.EVALUATED
    evaluation.evaluated_at = timezone.now()

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