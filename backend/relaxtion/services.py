from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from django.apps import apps
from django.utils import timezone

from .models import RelaxationSession, RelaxationType


# 개인화로 전환하기 위한 최소 유사 사례 수
MIN_SIMILAR_SESSIONS_FOR_HINT = 3

# 규칙 기반 추천 임계값
HIGH_ANXIETY_THRESHOLD = 4
HIGH_TINNITUS_THRESHOLD = 4


class InvalidRelaxationStateError(Exception):
    """허용되지 않은 RelaxationSession 상태 전이."""


@dataclass(frozen=True)
class RelaxationDecision:
    activity_type: str
    source: str
    reason: str

# 규칙 기반 기본 추천
def decide_relaxation_type(
    *,
    tinnitus_discomfort: int,
    anxiety: int,
    stress: bool,
) -> RelaxationDecision:

    # 1. 불안 >= 4-> 생각 거리두기
    if anxiety >= HIGH_ANXIETY_THRESHOLD:
        return RelaxationDecision(
            activity_type=RelaxationType.THOUGHT_DISTANCING,
            source=RelaxationSession.RecommendationSource.RULE_BASED,
            reason=f"anxiety({anxiety}) >= {HIGH_ANXIETY_THRESHOLD}",
        )
    
    # 2. 스트레스 선택 시 -> 30초 긴장해제
    if stress:
        return RelaxationDecision(
            activity_type=RelaxationType.TENSION_RELEASE,
            source=RelaxationSession.RecommendationSource.RULE_BASED,
            reason="stress == True",
        )
    
    #  3. 이명 불편도 >= 4-> 1분 주의 옮기기
    if tinnitus_discomfort >= HIGH_TINNITUS_THRESHOLD:
        return RelaxationDecision(
            activity_type=RelaxationType.ATTENTION_SHIFT,
            source=RelaxationSession.RecommendationSource.RULE_BASED,
            reason=(
                f"tinnitus_discomfort({tinnitus_discomfort}) "
                f">= {HIGH_TINNITUS_THRESHOLD}"
            ),
        )
    
    # 4. 개입 없음
    return RelaxationDecision(
        activity_type=RelaxationType.NONE,
        source=RelaxationSession.RecommendationSource.RULE_BASED,
        reason="개입 필요 낮음 - 바로 사운드",
    )

# 현재 상태를 간단한 유사 상태 버킷으로 변환
def _similar_state_bucket(
    *,
    tinnitus_discomfort: int,
    anxiety: int,
    stress: bool,
) -> tuple[bool, bool, bool]:

    return (
        anxiety >= HIGH_ANXIETY_THRESHOLD,
        bool(stress),
        tinnitus_discomfort >= HIGH_TINNITUS_THRESHOLD,
    )

# 직접 feedback 앱의 NightlyEvaluation 가져옴
def _get_evaluation_model():

    try:
        return apps.get_model(
            "feedback",
            "NightlyEvaluation",
        )
    except LookupError:
        return None

# personalization 구현 시 로직 수정
def _best_type_from_history(
    user,
    *,
    tinnitus_discomfort: int,
    anxiety: int,
    stress: bool,
) -> Optional[str]:

    Evaluation = _get_evaluation_model()

    if Evaluation is None:
        return None

    target_bucket = _similar_state_bucket(
        tinnitus_discomfort=tinnitus_discomfort,
        anxiety=anxiety,
        stress=stress,
    )

    candidate_sessions = (
        RelaxationSession.objects
        .filter(
            user=user,
            status=RelaxationSession.Status.COMPLETED,
        )
        .exclude(
            activity_type=RelaxationType.NONE,
        )
        .only(
            "id",
            "tinnitus_discomfort",
            "anxiety",
            "stress",
            "activity_type",
        )
    )

    similar_sessions = [
        session
        for session in candidate_sessions
        if _similar_state_bucket(
            tinnitus_discomfort=session.tinnitus_discomfort,
            anxiety=session.anxiety,
            stress=session.stress,
        )
        == target_bucket
    ]

    if not similar_sessions:
        return None

    type_by_pk = {
        session.id: session.activity_type
        for session in similar_sessions
    }

    evaluations = (
        Evaluation.objects
        .filter(
            relaxation_session_id__in=type_by_pk.keys(),
            status=Evaluation.Status.EVALUATED,
            routine_helpfulness__isnull=False,
        )
        .values(
            "relaxation_session_id",
            "routine_helpfulness",
        )
    )

    scores_by_type: dict[str, list[float]] = {}

    for evaluation in evaluations:
        activity_type = type_by_pk.get(
            evaluation["relaxation_session_id"]
        )

        score = evaluation["routine_helpfulness"]

        if activity_type is None or score is None:
            continue

        scores_by_type.setdefault(
            activity_type,
            [],
        ).append(score)

    eligible = {
        activity_type: sum(scores) / len(scores)
        for activity_type, scores in scores_by_type.items()
        if len(scores) >= MIN_SIMILAR_SESSIONS_FOR_HINT
    }

    if not eligible:
        return None

    return max(
        eligible,
        key=eligible.get,
    )

# 오늘 사용할 개입 결정(규칙 기반 추천 먼저 생성, 개입 필요한 경우에만 과거 데이터를 개인화 힌프로 사용)
# 피로(fatigue)와 카페인(caffeine)은 개입 추천 기준으로 사용하지 않음. 스냅샷으로만 저장
def recommend_relaxation(
    *,
    user,
    tinnitus_discomfort: int,
    anxiety: int,
    stress: bool,
    fatigue=None,
    caffeine: bool = False,
) -> RelaxationDecision:

    rule_decision = decide_relaxation_type(
        tinnitus_discomfort=tinnitus_discomfort,
        anxiety=anxiety,
        stress=stress,
    )

    if rule_decision.activity_type == RelaxationType.NONE:
        return rule_decision

    hinted_type = _best_type_from_history(
        user,
        tinnitus_discomfort=tinnitus_discomfort,
        anxiety=anxiety,
        stress=stress,
    )

    if hinted_type is None:
        return rule_decision

    if hinted_type == rule_decision.activity_type:
        return RelaxationDecision(
            activity_type=rule_decision.activity_type,
            source=RelaxationSession.RecommendationSource.PERSONALIZED,
            reason="규칙 기반 추천과 과거 결과 힌트가 동일",
        )

    return RelaxationDecision(
        activity_type=hinted_type,
        source=RelaxationSession.RecommendationSource.PERSONALIZED,
        reason=(
            "비슷한 상태의 과거 세션에서 "
            "평균 도움 정도가 더 높았던 개입으로 대체"
        ),
    )

# 현재 상태 바탕으로 추천 수행
def create_recommended_session(
    *,
    user,
    tinnitus_discomfort: int,
    anxiety: int,
    stress: bool,
    fatigue=None,
    caffeine: bool = False,
) -> RelaxationSession:


    decision = recommend_relaxation(
        user=user,
        tinnitus_discomfort=tinnitus_discomfort,
        anxiety=anxiety,
        stress=stress,
        fatigue=fatigue,
        caffeine=caffeine,
    )

    return RelaxationSession.objects.create(
        user=user,
        activity_type=decision.activity_type,
        recommendation_source=decision.source,
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


    if session.status not in {
        RelaxationSession.Status.IN_PROGRESS,
    }:
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