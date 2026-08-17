from __future__ import annotations

from django.utils import timezone

from .models import RelaxationSession, RelaxationType


class InvalidRelaxationStateError(Exception):
    """허용되지 않은 RelaxationSession 상태 전이."""


# personalization이 결정한 이완 개입으로 세션 생성
def create_recommended_session(
    *,
    user,
    activity_type: str | None,
    recommendation_source: str | None,
    tinnitus_discomfort: int,
    anxiety: int,
    stress: bool,
    fatigue=None,
    caffeine: bool = False,
) -> RelaxationSession:

    # personalization에서 이완 개입이 없는 경우
    # RelaxationSession에는 NONE으로 기록
    if activity_type is None:
        activity_type = RelaxationType.NONE
        recommendation_source = (
            RelaxationSession
            .RecommendationSource
            .RULE_BASED
        )

    # 실제 이완 개입이 있는데 추천 출처가 없는 경우
    elif recommendation_source is None:
        raise ValueError(
            "이완 활동이 선택된 경우 recommendation_source가 필요합니다."
        )

    return RelaxationSession.objects.create(
        user=user,
        activity_type=activity_type,
        recommendation_source=recommendation_source,
        tinnitus_discomfort=tinnitus_discomfort,
        anxiety=anxiety,
        stress=stress,
        fatigue=fatigue,
        caffeine=caffeine,
    )


# 개입 시작
def start_session(
    session: RelaxationSession,
) -> RelaxationSession:

    if session.activity_type == RelaxationType.NONE:
        raise InvalidRelaxationStateError(
            "개입 없음 세션은 시작할 수 없습니다."
        )

    if session.status != RelaxationSession.Status.RECOMMENDED:
        raise InvalidRelaxationStateError(
            f"{session.status} 상태에서는 시작할 수 없습니다."
        )

    session.status = RelaxationSession.Status.IN_PROGRESS
    session.started_at = timezone.now()

    session.save(
        update_fields=[
            "status",
            "started_at",
        ]
    )

    return session


# 건너뛰기(개입 전)
def skip_session(
    session: RelaxationSession,
) -> RelaxationSession:

    if session.activity_type == RelaxationType.NONE:
        raise InvalidRelaxationStateError(
            "개입 없음 세션은 건너뛰기 처리하지 않습니다."
        )

    if session.status != RelaxationSession.Status.RECOMMENDED:
        raise InvalidRelaxationStateError(
            f"{session.status} 상태에서는 건너뛸 수 없습니다."
        )

    session.status = RelaxationSession.Status.SKIPPED
    session.ended_at = timezone.now()

    session.save(
        update_fields=[
            "status",
            "ended_at",
        ]
    )

    return session


# 중단(개입 시작 후)
def cancel_session(
    session: RelaxationSession,
) -> RelaxationSession:

    if session.status != RelaxationSession.Status.IN_PROGRESS:
        raise InvalidRelaxationStateError(
            f"{session.status} 상태에서는 중단할 수 없습니다."
        )

    session.status = RelaxationSession.Status.CANCELLED
    session.ended_at = timezone.now()

    session.save(
        update_fields=[
            "status",
            "ended_at",
        ]
    )

    return session


# 개입 종료 기록
def complete_session(
    session: RelaxationSession,
) -> RelaxationSession:

    if session.activity_type == RelaxationType.NONE:
        if session.status != RelaxationSession.Status.RECOMMENDED:
            raise InvalidRelaxationStateError(
                f"{session.status} 상태의 개입 없음 세션은 "
                "완료할 수 없습니다."
            )

    elif session.status != RelaxationSession.Status.IN_PROGRESS:
        raise InvalidRelaxationStateError(
            f"{session.status} 상태에서는 완료할 수 없습니다."
        )

    session.status = RelaxationSession.Status.COMPLETED
    session.ended_at = timezone.now()

    session.save(
        update_fields=[
            "status",
            "ended_at",
        ]
    )

    return session