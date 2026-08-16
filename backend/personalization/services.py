from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
from django.apps import apps
from .models import InterventionDecision, UserPersonalizationProfile

# 공통 상수

# 개인화 학습을 본격 반영하기 위한 최소 평가 수
MIN_SAMPLES_FOR_PERSONALIZATION = 3

# 반복 불편/중단으로 제외 또는 감점 대상으로 보기 위한 최소 횟수
MIN_DISCOMFORT_COUNT_FOR_EXCLUSION = 3

# 첫 사용자 기본 사운드 재생시간
DEFAULT_DURATION_MINUTES = 35

# 상태 기준
HIGH_ANXIETY_THRESHOLD = 4
HIGH_TINNITUS_THRESHOLD = 4

# 직전 평가에서 볼륨이 너무 컸을 때 다음 세션에서 혼합점을 일시적으로 낮추는 비율
MIXING_POINT_REDUCTION_RATIO = 0.9

# Feedback 사운드 반응
COMFORTABLE_REACTION = "comfortable"
SOUND_REACTION_NOISE_WEAK = "noise_weak"
SOUND_REACTION_SHARP = "sharp"
SOUND_REACTION_VOLUME_TOO_LOUD = "volume_too_loud"
SOUND_REACTION_BACKGROUND = "natural_sound_uncomfortable"

# 사운드 중단 시 불편 이유
DISCOMFORT_SHARP = "sharp"
DISCOMFORT_TOO_SIMILAR = "too_similar"
DISCOMFORT_TOO_MUCH_VARIATION = "too_much_variation"
DISCOMFORT_BACKGROUND = "dislike_background"

# 사운드 기본 설정
BACKGROUND_CANDIDATES = (
    "rain",
    "stream",
    "ocean",
    "air",
)
DEFAULT_BACKGROUND = "rain"

# 이완 활동 후보
RELAXATION_ACTIVITY_TYPES = (
    "thought_distancing",
    "tension_release",
    "attention_shift",
)

# 입면시간 대표값(평균값 계산 위해)
SLEEP_LATENCY_MINUTES = {
    "under_15min": 10,
    "15_30min": 22,
    "30_60min": 45,
    "over_60min": 75,
}

# 기록용(어떤 값이 부족했는지 알기 위해)
SOURCE_TINNITUS_PROFILE = "tinnitus_profile"
SOURCE_MIXING_POINT = "mixing_point"
SOURCE_HEALTH_SLEEP = "health_sleep"
SOURCE_PERSONALIZATION_PROFILE = "personalization_profile"


def _get_model(app_label: str, model_name: str):
    try:
        return apps.get_model(app_label, model_name)
    except LookupError:
        return None

# F-501~505 : 현재 상태 통합
@dataclass
class CurrentState:
    tinnitus_center_hz: Optional[float] = None
    tinnitus_freq_min_hz: Optional[float] = None
    tinnitus_freq_max_hz: Optional[float] = None

    # 사용자가 직접 측정한 원본 혼합점
    mixing_point_gain: Optional[float] = None

    tinnitus_discomfort: int = 3
    anxiety: int = 3
    stress: bool = False
    fatigue: Optional[int] = None
    caffeine: bool = False

    recent_sleep_hours: Optional[float] = None

    # 자연음 개인화
    sound_tag_weights: dict = field(default_factory=dict)
    excluded_sound_tags: list = field(default_factory=list)
    sound_sample_count: int = 0

    # 이완 활동 개인화
    relaxation_type_weights: dict = field(default_factory=dict)
    discouraged_relaxation_types: list = field(default_factory=list)
    relaxation_sample_count: int = 0

    # 전체 평가 개수
    evaluation_sample_count: int = 0

    missing_data_sources: list = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "tinnitus_center_hz": self.tinnitus_center_hz,
            "tinnitus_freq_min_hz": self.tinnitus_freq_min_hz,
            "tinnitus_freq_max_hz": self.tinnitus_freq_max_hz,
            "mixing_point_gain": self.mixing_point_gain,
            "tinnitus_discomfort": self.tinnitus_discomfort,
            "anxiety": self.anxiety,
            "stress": self.stress,
            "fatigue": self.fatigue,
            "caffeine": self.caffeine,
            "recent_sleep_hours": self.recent_sleep_hours,
            "sound_tag_weights": self.sound_tag_weights,
            "excluded_sound_tags": self.excluded_sound_tags,
            "sound_sample_count": self.sound_sample_count,
            "relaxation_type_weights": self.relaxation_type_weights,
            "discouraged_relaxation_types": self.discouraged_relaxation_types,
            "relaxation_sample_count": self.relaxation_sample_count,
            "evaluation_sample_count": self.evaluation_sample_count,
            "missing_data_sources": self.missing_data_sources,
        }

    @property
    def has_sufficient_data(self) -> bool:
        return self.evaluation_sample_count >= MIN_SAMPLES_FOR_PERSONALIZATION


def build_current_state(
    *,
    user,
    tinnitus_discomfort: int,
    anxiety: int,
    stress: bool,
    fatigue: Optional[int] = None,
    caffeine: bool = False,
) -> CurrentState:

    state = CurrentState(
        tinnitus_discomfort=tinnitus_discomfort,
        anxiety=anxiety,
        stress=stress,
        fatigue=fatigue,
        caffeine=caffeine,
    )

    # F-501 : 이명 음역 매칭 + 혼합점
    PitchMatchSession = _get_model(
        "tinnitus",
        "PitchMatchSession",
    )

    matching_session = None

    if PitchMatchSession is not None:
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

    if matching_session is not None:
        state.tinnitus_center_hz = matching_session.center_frequency
        state.tinnitus_freq_min_hz = matching_session.lower_bound
        state.tinnitus_freq_max_hz = matching_session.upper_bound

        state.mixing_point_gain = getattr(
            matching_session,
            "mixing_point_gain",
            None,
        )

        if state.mixing_point_gain is None:
            state.missing_data_sources.append(
                SOURCE_MIXING_POINT
            )

    else:
        state.missing_data_sources.append(
            SOURCE_TINNITUS_PROFILE
        )

        state.missing_data_sources.append(
            SOURCE_MIXING_POINT
        )

    # F-502 : 최근 수면 데이터
    SleepRecord = _get_model(
        "health",
        "SleepRecord",
    )

    recent_record = None

    if SleepRecord is not None:
        recent_record = (
            SleepRecord.objects
            .filter(user=user)
            .order_by("-recorded_at")
            .first()
        )

    if recent_record is not None:
        state.recent_sleep_hours = getattr(
            recent_record,
            "sleep_hours",
            None,
        )

    if state.recent_sleep_hours is None:
        state.missing_data_sources.append(
            SOURCE_HEALTH_SLEEP
        )

    # F-503 : 누적 개인화 프로필
    profile = (
        UserPersonalizationProfile.objects
        .filter(user=user)
        .first()
    )

    if profile is not None:
        state.sound_tag_weights = profile.sound_tag_weights
        state.excluded_sound_tags = profile.excluded_sound_tags
        state.sound_sample_count = profile.sound_sample_count

        state.relaxation_type_weights = (
            profile.relaxation_type_weights
        )

        state.discouraged_relaxation_types = (
            profile.discouraged_relaxation_types
        )

        state.relaxation_sample_count = (
            profile.relaxation_sample_count
        )

        state.evaluation_sample_count = (
            profile.evaluation_sample_count
        )

    else:
        state.missing_data_sources.append(
            SOURCE_PERSONALIZATION_PROFILE
        )

    return state

# Sound 불편 신고 조회
def _get_sound_discomfort_reasons(
    sound_session,
) -> list[str]:

    reports = getattr(
        sound_session,
        "discomfort_reports",
        None,
    )

    if reports is None:
        return []

    all_reasons: list[str] = []

    for reasons_list in reports.values_list(
        "reasons",
        flat=True,
    ):
        all_reasons.extend(
            reasons_list or []
        )

    return all_reasons

# 실제 재생된 자연음 태그 조회
def _extract_background_tag(
    sound_session,
) -> Optional[str]:

    params = (
        getattr(sound_session, "final_params", None)
        or getattr(sound_session, "generated_params", None)
        or {}
    )

    for source in params.get("sources", []):
        if (
            isinstance(source, dict)
            and source.get("type") == "background"
        ):
            return source.get("asset_tag")

        if (
            isinstance(source, str)
            and source in BACKGROUND_CANDIDATES
        ):
            return source

    return None

# 최근 사운드 반응과 즉시 불편 신고 수집
def _collect_sound_discomfort_context(
    user,
    limit: int = 50,
) -> dict:

    SoundSession = _get_model(
        "sound",
        "SoundSession",
    )

    NightlyEvaluation = _get_model(
        "feedback",
        "NightlyEvaluation",
    )

    if SoundSession is None:
        return {
            "reason_counts": {},
            "background_dislike_counts": {},
        }

    sessions = list(
        SoundSession.objects
        .filter(user=user)
        .order_by("-created_at")[:limit]
    )

    reason_counts = {}
    background_dislike_counts = {}

    # 즉시 사운드 불편 신고
    for session in sessions:
        reasons = _get_sound_discomfort_reasons(
            session
        )

        for reason in reasons:
            reason_counts[reason] = (
                reason_counts.get(reason, 0) + 1
            )

        if DISCOMFORT_BACKGROUND in reasons:
            tag = _extract_background_tag(
                session
            )

            if tag:
                background_dislike_counts[tag] = (
                    background_dislike_counts.get(
                        tag,
                        0,
                    ) + 1
                )

    # 다음 평가에서 받은 사운드 반응
    if NightlyEvaluation is not None:
        evaluations = (
            NightlyEvaluation.objects
            .filter(
                user=user,
                status=NightlyEvaluation.Status.EVALUATED,
                sound_session_id__isnull=False,
            )
            .order_by("-evaluated_at")[:limit]
        )

        for evaluation in evaluations:
            reactions = (
                evaluation.sound_reactions
                or []
            )

            for reaction in reactions:
                reason_counts[reaction] = (
                    reason_counts.get(
                        reaction,
                        0,
                    ) + 1
                )

            if (
                SOUND_REACTION_BACKGROUND
                in reactions
            ):
                session = (
                    SoundSession.objects
                    .filter(
                        pk=evaluation.sound_session_id
                    )
                    .first()
                )

                if session is not None:
                    tag = _extract_background_tag(
                        session
                    )

                    if tag:
                        background_dislike_counts[tag] = (
                            background_dislike_counts.get(
                                tag,
                                0,
                            ) + 1
                        )

    return {
        "reason_counts": reason_counts,
        "background_dislike_counts": background_dislike_counts,
    }

# F-506 : 개입 유형 결정
# 사운드는 모든 사용자에게 항상 제공. 체크인 상태에 따라 이완 개입 여부 확인. 과거 평가가 이완 개입 "여부" 자체를 뒤집지는 않음
def decide_intervention_type(
    state: CurrentState,
) -> str:

    if (
        state.anxiety >= HIGH_ANXIETY_THRESHOLD
        or state.stress
        or state.tinnitus_discomfort
        >= HIGH_TINNITUS_THRESHOLD
    ):
        return (
            InterventionDecision
            .InterventionType
            .SOUND_WITH_RELAXATION
        )

    return (
        InterventionDecision
        .InterventionType
        .SOUND_ONLY
    )

# F-508 : 이완 활동 결정
# 상태 규칙으로 결정. 충분한 평가 축적 뒤 해당 활동이 반복적으로 별로 였다면 다른 활동으로 보정
def decide_relaxation_activity_type(
    state: CurrentState,
) -> Optional[str]:

    # 기본 규칙
    if state.anxiety >= HIGH_ANXIETY_THRESHOLD:
        rule_based = "thought_distancing"

    elif state.stress:
        rule_based = "tension_release"

    elif (
        state.tinnitus_discomfort
        >= HIGH_TINNITUS_THRESHOLD
    ):
        rule_based = "attention_shift"

    else:
        return None

    # 데이터가 적으면 규칙 그대로 사용
    if (
        state.relaxation_sample_count
        < MIN_SAMPLES_FOR_PERSONALIZATION
    ):
        return rule_based

    # 해당 활동이 반복적으로 나쁘지 않았다면 유지
    if (
        rule_based
        not in state.discouraged_relaxation_types
    ):
        return rule_based

    # 다른 이완 활동 중 가중치가 높은 것 선택
    alternatives = {
        activity_type: (
            state.relaxation_type_weights
            .get(
                activity_type,
                0.0,
            )
        )
        for activity_type
        in RELAXATION_ACTIVITY_TYPES
        if (
            activity_type != rule_based
            and activity_type
            not in state.discouraged_relaxation_types
        )
    }

    if not alternatives:
        return rule_based

    return max(
        alternatives,
        key=alternatives.get,
    )

# F-507 : masking level 결정
# 현재 이명 불편도와 과거 사운드 반응을 이용해 masking 정도를 결정 
# 볼륨이 너무 컸어요는 여기에서는 사용하지 않음. mixing point에서 별도로 처리

def decide_masking_ratio(
    state: CurrentState,
    discomfort_context: dict,
) -> float:


    reason_counts = (
        discomfort_context.get(
            "reason_counts",
            {},
        )
    )

    sharp_count = reason_counts.get(
        SOUND_REACTION_SHARP,
        0,
    )

    too_similar_count = reason_counts.get(
        DISCOMFORT_TOO_SIMILAR,
        0,
    )

    noise_weak_count = reason_counts.get(
        SOUND_REACTION_NOISE_WEAK,
        0,
    )

    # 날카롭거나 이명과 너무 비슷하다는 불편이 반복됨 → 강한 마스킹 피하기
    if (
        sharp_count
        >= MIN_DISCOMFORT_COUNT_FOR_EXCLUSION
        or too_similar_count
        >= MIN_DISCOMFORT_COUNT_FOR_EXCLUSION
    ):
        return 0.60

    # 노이즈가 약하다는 반응이 반복됨 -> 마스킹 강화
    if (
        noise_weak_count
        >= MIN_DISCOMFORT_COUNT_FOR_EXCLUSION
    ):
        return 0.75

    # 현재 이명 불편도가 높음
    if (
        state.tinnitus_discomfort
        >= HIGH_TINNITUS_THRESHOLD
    ):
        return 0.75

    return 0.60

# variation level 결정(불안/스트레스, 과거 사운드 반응 이용해 정도 결정)
def decide_modulation_intensity(
    state: CurrentState,
    discomfort_context: dict,
) -> str:

    reason_counts = (
        discomfort_context.get(
            "reason_counts",
            {},
        )
    )

    variation_count = reason_counts.get(
        DISCOMFORT_TOO_MUCH_VARIATION,
        0,
    )

    # 변화가 너무 많았다는 불편이 반복됨
    if (
        variation_count
        >= MIN_DISCOMFORT_COUNT_FOR_EXCLUSION
    ):
        return "low"

    # 현재 불안/스트레스가 높으면 변화 적게
    if (
        state.anxiety >= HIGH_ANXIETY_THRESHOLD
        or state.stress
    ):
        return "low"

    return "medium"


# Mixing Point 개인화
# 사용자가 직접 측정한 혼합점이 기본값. 가장 최근 사운드 평가에서 볼륨이 너무 컸어요 를 선택한 경우에만 다음 세션에서 목표 gain을 일시적 낮춤
# 이후 평가에서 볼륨이 너무 컷어요가 선택되지 않으면 원래 사용자가 측정했던 기본 혼합점 값으로 복귀. (원본은 변경하지 않는다.)
def adjust_mixing_point_gain(
    *,
    user,
    base_gain: Optional[float],
) -> Optional[float]:

    if base_gain is None:
        return None

    NightlyEvaluation = _get_model(
        "feedback",
        "NightlyEvaluation",
    )

    if NightlyEvaluation is None:
        return base_gain

    # 가장 최근 완료 평가 1개만 확인
    latest_evaluation = (
        NightlyEvaluation.objects
        .filter(
            user=user,
            status=NightlyEvaluation.Status.EVALUATED,
            sound_session_id__isnull=False,
        )
        .order_by("-evaluated_at")
        .first()
    )

    if latest_evaluation is None:
        return base_gain

    reactions = set(
        latest_evaluation.sound_reactions
        or []
    )

    # 직전 평가에서 볼륨이 너무 컸다면 다음 세션만 일시적으로 감소
    if (
        SOUND_REACTION_VOLUME_TOO_LOUD
        in reactions
    ):
        return round(
            base_gain
            * MIXING_POINT_REDUCTION_RATIO,
            4,
        )

    # 직전 평가에서 볼륨이 크다는 반응이 없으면 원래 측정값으로 복귀
    return base_gain


# 자연음 선택(과거 자연음 평가가 쌓이면 가중치를 반영하고, 반복적으로 불편했던 자연음은 후보에서 제외)
def _select_background(
    *,
    state: CurrentState,
    discomfort_context: dict,
) -> tuple[str, list[dict]]:

    dislike_counts = (
        discomfort_context.get(
            "background_dislike_counts",
            {},
        )
    )

    candidates = [
        tag
        for tag in BACKGROUND_CANDIDATES
        if (
            tag
            not in state.excluded_sound_tags
        )
    ]

    # 모든 후보가 제외된 경우 복구
    if not candidates:
        candidates = list(
            BACKGROUND_CANDIDATES
        )

    confidence = min(
        state.sound_sample_count
        / MIN_SAMPLES_FOR_PERSONALIZATION,
        1.0,
    )

    scored = []

    for tag in candidates:
        score = (
            state.sound_tag_weights
            .get(
                tag,
                0.0,
            )
            * confidence
        )

        score -= (
            dislike_counts.get(
                tag,
                0,
            )
            * 0.3
        )

        # 최초 사용자 기본 자연음
        if (
            state.sound_sample_count == 0
            and tag == DEFAULT_BACKGROUND
        ):
            score += 0.01

        scored.append(
            {
                "background": tag,
                "score": round(
                    score,
                    4,
                ),
            }
        )

    scored.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return (
        scored[0]["background"],
        scored,
    )

# 재생시간 개인화(최초에는 35분, 평가 쌓이면 평균 입면시간 계산해서 재생시간으로 사용)
def _compute_recommended_duration(
    user,
) -> int:
    
    NightlyEvaluation = _get_model(
        "feedback",
        "NightlyEvaluation",
    )

    if NightlyEvaluation is None:
        return DEFAULT_DURATION_MINUTES

    latencies = (
        NightlyEvaluation.objects
        .filter(
            user=user,
            status=NightlyEvaluation.Status.EVALUATED,
            sleep_latency__in=list(
                SLEEP_LATENCY_MINUTES.keys()
            ),
        )
        .values_list(
            "sleep_latency",
            flat=True,
        )
    )

    minutes = [
        SLEEP_LATENCY_MINUTES[value]
        for value in latencies
        if value in SLEEP_LATENCY_MINUTES
    ]

    if not minutes:
        return DEFAULT_DURATION_MINUTES

    return round(
        sum(minutes)
        / len(minutes)
    )

# F-506~508 : 전체 개입 결정
#1. 사운드는 모든 사용자에게 항상 제공
#2. 노치 사운드 역시 기본 적용
#3. CBT/이완 여부는 현재 체크인 규칙으로 결정
#4. 자연음 / masking / variation / duration 개인화
#5. 직전 volume_too_loud 반응이 있으면 다음 세션 mixing point만 일시적으로 감소
def decide_intervention(
    *,
    user,
    state: CurrentState,
) -> dict:

    discomfort_context = (
        _collect_sound_discomfort_context(
            user
        )
    )
    # 1. sound only / sound + relaxation
    intervention_type = (
        decide_intervention_type(
            state
        )
    )
    # 2. 이완 활동
    relaxation_activity_type = None

    if (
        intervention_type
        == InterventionDecision
        .InterventionType
        .SOUND_WITH_RELAXATION
    ):
        relaxation_activity_type = (
            decide_relaxation_activity_type(
                state
            )
        )
    # 3. 자연음
    (
        selected_background,
        background_candidates,
    ) = _select_background(
        state=state,
        discomfort_context=discomfort_context,
    )

    # 4. masking
    masking_ratio = (
        decide_masking_ratio(
            state,
            discomfort_context,
        )
    )
    # 5. variation
    modulation_intensity = (
        decide_modulation_intensity(
            state,
            discomfort_context,
        )
    )
    # 6. mixing point
    mixing_point_gain = (
        adjust_mixing_point_gain(
            user=user,
            base_gain=state.mixing_point_gain,
        )
    )
    # 7. 재생시간
    duration_minutes = (
        _compute_recommended_duration(
            user
        )
    )

    sound_strategy = {
        "background": selected_background,
        "masking_ratio": masking_ratio,
        "modulation_intensity": modulation_intensity,
        "mixing_point_gain": mixing_point_gain,
        "duration_minutes": duration_minutes,
    }

    reason_parts = [
        f"intervention_type={intervention_type}",
        f"background={selected_background}",
        f"masking_ratio={masking_ratio}",
        f"modulation_intensity={modulation_intensity}",
        f"mixing_point_gain={mixing_point_gain}",
        f"duration_minutes={duration_minutes}",
    ]

    if relaxation_activity_type:
        reason_parts.append(
            "relaxation_activity_type="
            f"{relaxation_activity_type}"
        )

    if state.missing_data_sources:
        reason_parts.append(
            "missing_data_sources="
            f"{state.missing_data_sources}"
        )

    return {
        "intervention_type": intervention_type,
        "relaxation_activity_type": relaxation_activity_type,
        "sound_strategy": sound_strategy,
        "background_candidates": background_candidates,
        "reason": " / ".join(
            reason_parts
        ),
    }

# F-509 : Decision 저장
def record_decision(
    *,
    user,
    state: CurrentState,
    decision: dict,
) -> InterventionDecision:

    return (
        InterventionDecision.objects
        .create(
            user=user,
            state_snapshot=state.as_dict(),
            has_sufficient_data=(
                state.has_sufficient_data
            ),
            missing_data_sources=(
                state.missing_data_sources
            ),
            intervention_type=(
                decision["intervention_type"]
            ),
            relaxation_activity_type=(
                decision[
                    "relaxation_activity_type"
                ]
            ),
            sound_strategy=(
                decision["sound_strategy"]
            ),
            reason=decision["reason"],
        )
    )

# 현재 상태 통합 -> 개입 결정 -> 저장
def decide_and_record_intervention(
    *,
    user,
    tinnitus_discomfort: int,
    anxiety: int,
    stress: bool,
    fatigue: Optional[int] = None,
    caffeine: bool = False,
) -> InterventionDecision:

    state = build_current_state(
        user=user,
        tinnitus_discomfort=tinnitus_discomfort,
        anxiety=anxiety,
        stress=stress,
        fatigue=fatigue,
        caffeine=caffeine,
    )

    decision = decide_intervention(
        user=user,
        state=state,
    )

    return record_decision(
        user=user,
        state=state,
        decision=decision,
    )

# 실제 sound / relaxtion 세션 연결
def attach_sessions(
    decision: InterventionDecision,
    *,
    sound_session_id: Optional[int] = None,
    relaxation_session_id: Optional[int] = None,
) -> InterventionDecision:

    update_fields = []

    if sound_session_id is not None:
        decision.sound_session_id = (
            sound_session_id
        )

        update_fields.append(
            "sound_session_id"
        )

    if relaxation_session_id is not None:
        decision.relaxation_session_id = (
            relaxation_session_id
        )

        update_fields.append(
            "relaxation_session_id"
        )

    if update_fields:
        decision.save(
            update_fields=update_fields
        )

    return decision

# Sound 개인화 학습(자연음 자체의 선호도 학습)
# comfortable -> 가점 / natural_sound_uncomfortable, dislike_background ->감점 / noise_weak, volume_too_loud -> 반영 x
def _refresh_sound_learning(
    user,
    profile: UserPersonalizationProfile,
) -> None:

    NightlyEvaluation = _get_model(
        "feedback",
        "NightlyEvaluation",
    )

    SoundSession = _get_model(
        "sound",
        "SoundSession",
    )

    if SoundSession is None:
        return

    comfortable_counts = {}
    discomfort_counts = {}

    evidence_session_ids = set()

    # NightlyEvaluation 반영
    if NightlyEvaluation is not None:
        evaluations = (
            NightlyEvaluation.objects
            .filter(
                user=user,
                status=(
                    NightlyEvaluation
                    .Status
                    .EVALUATED
                ),
                sound_session_id__isnull=False,
            )
        )

        for evaluation in evaluations:
            session = (
                SoundSession.objects
                .filter(
                    pk=(
                        evaluation
                        .sound_session_id
                    )
                )
                .first()
            )

            if session is None:
                continue

            tag = _extract_background_tag(
                session
            )

            if tag is None:
                continue

            reactions = set(
                evaluation.sound_reactions
                or []
            )

            if (
                COMFORTABLE_REACTION
                in reactions
            ):
                comfortable_counts[tag] = (
                    comfortable_counts.get(
                        tag,
                        0,
                    ) + 1
                )

                evidence_session_ids.add(
                    session.pk
                )

            if (
                SOUND_REACTION_BACKGROUND
                in reactions
            ):
                discomfort_counts[tag] = (
                    discomfort_counts.get(
                        tag,
                        0,
                    ) + 1
                )

                evidence_session_ids.add(
                    session.pk
                )

    # 사운드 중단 불편 사유 반영
    sessions = (
        SoundSession.objects
        .filter(user=user)
    )

    for session in sessions:
        reasons = (
            _get_sound_discomfort_reasons(
                session
            )
        )

        # 자연음 자체가 싫었다는 신고만 감점
        if (
            DISCOMFORT_BACKGROUND
            not in reasons
        ):
            continue

        tag = _extract_background_tag(
            session
        )

        if tag is None:
            continue

        discomfort_counts[tag] = (
            discomfort_counts.get(
                tag,
                0,
            ) + 1
        )

        evidence_session_ids.add(
            session.pk
        )

    # 자연음별 가중치
    weights = {}

    for tag in (
        set(comfortable_counts)
        | set(discomfort_counts)
    ):
        positive = comfortable_counts.get(
            tag,
            0,
        )

        negative = discomfort_counts.get(
            tag,
            0,
        )

        total = positive + negative

        weights[tag] = (
            round(
                (
                    positive
                    - negative
                )
                / total,
                4,
            )
            if total
            else 0.0
        )

    # 반복적으로 불편했던 자연음 제외
    excluded_tags = [
        tag
        for tag, count
        in discomfort_counts.items()
        if (
            count
            >= MIN_DISCOMFORT_COUNT_FOR_EXCLUSION
        )
    ]

    profile.sound_tag_weights = weights

    profile.excluded_sound_tags = (
        excluded_tags
    )

    profile.sound_sample_count = len(
        evidence_session_ids
    )


# Relaxation 개인화 평가 점수
# 해당 이완 활동 결과는 -1.0 ~1.0 범위로 계산
def _get_relaxation_evaluation_score(
    *,
    evaluation,
    decision: Optional[
        InterventionDecision
    ],
) -> Optional[float]:


    parts = []

    # 수면 준비 도움 정도
    if (
        evaluation.routine_helpfulness
        is not None
    ):
        parts.append(
            (
                evaluation.routine_helpfulness
                - 3
            )
            / 2
        )

    # CBT 전후 불안 변화
    if decision is not None:
        state_snapshot = (
            decision.state_snapshot
            or {}
        )

        anxiety_before = (
            state_snapshot.get(
                "anxiety"
            )
        )

        anxiety_after = getattr(
            evaluation,
            "anxiety_after",
            None,
        )

        if (
            anxiety_before is not None
            and anxiety_after is not None
        ):
            # 1~5 범위이므로 최대 변화폭 4
            anxiety_change = (
                anxiety_before
                - anxiety_after
            ) / 4

            parts.append(
                anxiety_change
            )

    if not parts:
        return None

    return (
        sum(parts)
        / len(parts)
    )

# Relaxation 개인화 학습
# 이완활동 종류별 개인화 가중치 갱신
# 이완활동 제공 여부를 바꾸는 것 x / 이완활동이 있는 상황에서 어떤 활동이 사용자에게 더 잘 맞는지 학습
def _refresh_relaxation_learning(
    user,
    profile: UserPersonalizationProfile,
) -> None:

    RelaxationSession = _get_model(
        "relaxtion",
        "RelaxationSession",
    )

    NightlyEvaluation = _get_model(
        "feedback",
        "NightlyEvaluation",
    )

    if RelaxationSession is None:
        return

    sessions = (
        RelaxationSession.objects
        .filter(user=user)
        .exclude(
            activity_type="none"
        )
    )

    # 중단 횟수
    cancelled_counts = {}

    for session in sessions:
        if (
            session.status
            == "cancelled"
        ):
            cancelled_counts[
                session.activity_type
            ] = (
                cancelled_counts.get(
                    session.activity_type,
                    0,
                ) + 1
            )

    scores_by_type: dict[
        str,
        list[float],
    ] = {}

    sample_count = 0

    # 평가 결과
    if NightlyEvaluation is not None:
        evaluations = (
            NightlyEvaluation.objects
            .filter(
                user=user,
                status=(
                    NightlyEvaluation
                    .Status
                    .EVALUATED
                ),
                relaxation_session_id__isnull=False,
            )
        )

        for evaluation in evaluations:
            session = (
                RelaxationSession.objects
                .filter(
                    pk=(
                        evaluation
                        .relaxation_session_id
                    )
                )
                .first()
            )

            if (
                session is None
                or session.activity_type
                == "none"
            ):
                continue

            decision = (
                InterventionDecision.objects
                .filter(
                    user=user,
                    relaxation_session_id=(
                        evaluation
                        .relaxation_session_id
                    ),
                )
                .order_by(
                    "-decided_at"
                )
                .first()
            )

            score = (
                _get_relaxation_evaluation_score(
                    evaluation=evaluation,
                    decision=decision,
                )
            )

            if score is None:
                continue

            scores_by_type.setdefault(
                session.activity_type,
                [],
            ).append(
                score
            )

            sample_count += 1

    # 이완 활동별 평균 가중치
    weights = {
        activity_type: round(
            sum(scores)
            / len(scores),
            4,
        )
        for activity_type, scores
        in scores_by_type.items()
        if scores
    }

    # 반복적으로 좋지 않았던 활동
    discouraged = []

    for activity_type in (
        RELAXATION_ACTIVITY_TYPES
    ):
        cancelled = (
            cancelled_counts.get(
                activity_type,
                0,
            )
        )

        scores = scores_by_type.get(
            activity_type,
            [],
        )

        low_score = (
            len(scores)
            >= MIN_DISCOMFORT_COUNT_FOR_EXCLUSION
            and weights.get(
                activity_type,
                0,
            ) <= -0.5
        )

        if (
            cancelled
            >= MIN_DISCOMFORT_COUNT_FOR_EXCLUSION
            or low_score
        ):
            discouraged.append(
                activity_type
            )

    profile.relaxation_type_weights = (
        weights
    )

    profile.discouraged_relaxation_types = (
        discouraged
    )

    profile.relaxation_sample_count = (
        sample_count
    )

# REQ-F-24 : 전체 개인화 프로필 갱신
def refresh_user_personalization_profile(
    user,
) -> UserPersonalizationProfile:

    profile, _ = (
        UserPersonalizationProfile.objects
        .get_or_create(
            user=user
        )
    )

    # 자연음 개인화 학습
    _refresh_sound_learning(
        user,
        profile,
    )

    # CBT 종류 개인화 학습
    _refresh_relaxation_learning(
        user,
        profile,
    )

    # 전체 완료 평가 개수
    NightlyEvaluation = _get_model(
        "feedback",
        "NightlyEvaluation",
    )

    if NightlyEvaluation is not None:
        profile.evaluation_sample_count = (
            NightlyEvaluation.objects
            .filter(
                user=user,
                status=(
                    NightlyEvaluation
                    .Status
                    .EVALUATED
                ),
            )
            .count()
        )

    profile.save(
        update_fields=[
            "sound_tag_weights",
            "excluded_sound_tags",
            "sound_sample_count",
            "relaxation_type_weights",
            "discouraged_relaxation_types",
            "relaxation_sample_count",
            "evaluation_sample_count",
            "last_updated_at",
        ]
    )

    return profile