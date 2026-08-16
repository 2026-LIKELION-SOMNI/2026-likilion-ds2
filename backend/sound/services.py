from __future__ import annotations

import dataclasses
import math
from typing import Optional

from .models import FallbackSound, SoundSession

# 실제 오디오 파일을 생성하는 것이 아니라,
# 프론트(Web Audio API)가 사용할 사운드 파라미터를 계산한다.


# 서비스 운영용 기본 제한값(변경 가능)

SAFE_INITIAL_VOLUME = 0.2
SAFE_MAX_VOLUME = 0.6

# 분 단위 최소 / 최대 권장 재생시간
SAFE_DURATION_RANGE_MIN = (20, 90)

MODULATION_LEVELS = (
    "low",
    "medium",
    "high",
)


# 노치 필터 설계 상수

HALF_OCTAVE_RATIO = 2 ** 0.25
NOTCH_STAGE_COUNT = 6
NOTCH_STAGE_Q = 1.4 * 4  # 5.6

# 혼합점(Mixing Point) 탐색 설정
MIXING_POINT_RAMP_SECONDS_DEFAULT = 20

MIXING_POINT_RAMP_RANGE_DB = 40

# feedback 연동
COMFORTABLE_REACTION_TAG = "comfortable"

# [추가] soundfit 연동 매핑 상수
# layer_mix(자연음:보조레이어 비율) -> masking_ratio(0~1, 이명 마스킹 노이즈 비중)
# low(자연음 위주) -> 마스킹 비중 낮게, high(노이즈 위주) -> 마스킹 비중 높게
LAYER_MIX_TO_MASKING_RATIO = {
    "low": 0.45,
    "medium": 0.60,
    "high": 0.75,
}

# texture(질감) -> modulation_intensity(변화 강도)
# soft(부드럽게) -> 변화 적게(low), clear(선명하게) -> 변화 크게(high)
TEXTURE_TO_MODULATION = {
    "soft": "low",
    "balanced": "medium",
    "clear": "high",
}


# Exception
class MatchingNotCompletedError(Exception):
    """음역 매칭이 완료되지 않아 사운드를 생성할 수 없을 때."""


# 사운드 생성 입력값
@dataclasses.dataclass
class GenerationInput:
    # tinnitus
    tinnitus_center_hz: float
    tinnitus_freq_min_hz: float
    tinnitus_freq_max_hz: float
    mixing_point_gain: float

    # 사용자 사운드 선호
    sound_preferences: list[str]

    # 현재 상태
    current_discomfort: int
    current_tension: int

    # 최근 상태
    sleep_hours: Optional[float]
    daily_factors: list[str]

    # 과거 결과
    past_helpful_tags: list[str]
    past_discomfort_reasons: list[str]

    # [추가] soundfit 결과 (없으면 None -> 기존 임시 규칙으로 폴백)
    sound_fit_texture: Optional[str] = None
    sound_fit_layer_mix: Optional[str] = None


def build_input_snapshot(gi: GenerationInput) -> dict:
    return dataclasses.asdict(gi)


# 1. 노치 대역 계산
def compute_notch_band(
    center_hz: float,
) -> tuple[float, float]:

    lower = center_hz / HALF_OCTAVE_RATIO
    upper = center_hz * HALF_OCTAVE_RATIO

    return lower, upper


# 2. 노치 필터 6단 배치
def compute_notch_stages(
    lower_hz: float,
    upper_hz: float,
    stages: int = NOTCH_STAGE_COUNT,
) -> list[dict]:

    log_lower = math.log(lower_hz)
    log_upper = math.log(upper_hz)

    result = []

    for i in range(stages):
        t = i / (stages - 1)

        frequency = math.exp(
            log_lower
            + (log_upper - log_lower) * t
        )

        result.append(
            {
                "center_hz": round(frequency, 1),
                "q": NOTCH_STAGE_Q,
            }
        )

    return result


def build_notch_filter_spec(
    center_hz: float,
) -> dict:

    lower, upper = compute_notch_band(
        center_hz
    )

    return {
        "type": "notch_matched_noise",

        "center_hz": round(
            center_hz,
            1,
        ),

        "band_lower_hz": round(
            lower,
            1,
        ),

        "band_upper_hz": round(
            upper,
            1,
        ),

        "band_width_octaves": 0.5,

        "stages": compute_notch_stages(
            lower,
            upper,
        ),
    }


# 4. 혼합점(Mixing Point) 볼륨 램프
def build_mixing_point_ramp_spec(
    target_volume: float,
    duration_seconds: int = MIXING_POINT_RAMP_SECONDS_DEFAULT,
    range_db: float = MIXING_POINT_RAMP_RANGE_DB,
) -> dict:

    return {
        "curve": "log_db",
        "duration_seconds": duration_seconds,
        "range_db": range_db,
        "target_volume": target_volume,
        "formula": (
            "gain(t) = target_volume * "
            "10 ** (((t / duration_seconds) - 1) * range_db / 20)"
        ),
    }


# 사운드 파라미터 결정
def decide_parameters(
    gi: GenerationInput,
) -> dict:

    frequency_bands = [
        build_notch_filter_spec(
            gi.tinnitus_center_hz
        )
    ]

    avoided = set()

    if "too_similar" in gi.past_discomfort_reasons:
        avoided.add("tone_based")

    if "sharp" in gi.past_discomfort_reasons:
        avoided.add(
            "high_frequency_texture"
        )

    if "dislike_background" in gi.past_discomfort_reasons:
        avoided.add(
            "background_layer"
        )

    sources = [
        {
            "type": "synth",
            "waveform": "pink_noise",
            "role": "tinnitus_masking",
        }
    ]

    # 사용자가 배경음 불편 신고를 하지 않았다면 배경음 추가
    if "background_layer" not in avoided:

        preferred_bg = next(
            (
                preference
                for preference in gi.sound_preferences
                if preference
                in (
                    "rain",
                    "white_noise",
                    "ocean",
                    "wind",
                )
            ),
            "white_noise",
        )

        sources.append(
            {
                "type": "background",
                "asset_tag": preferred_bg,
                "role": "ambient",
            }
        )

    # 혼합 비율
    # [수정] soundfit(layer_mix) 결과가 있으면 그걸로 결정, 없으면 기존 임시 규칙으로 폴백
    if gi.sound_fit_layer_mix and gi.sound_fit_layer_mix in LAYER_MIX_TO_MASKING_RATIO:
        masking_ratio = LAYER_MIX_TO_MASKING_RATIO[gi.sound_fit_layer_mix]
    elif gi.current_discomfort >= 4:
        masking_ratio = 0.75
    else:
        masking_ratio = 0.60

    mix_ratio = {
        "tinnitus_masking": masking_ratio,
        "ambient": round(
            1 - masking_ratio,
            2,
        ),
    }

    # 변화 강도
    # [수정] soundfit(texture) 결과가 있으면 그걸로 결정, 없으면 기존 임시 규칙으로 폴백
    # 단, 긴장도가 높거나 "변화가 많음" 불편 신고 이력이 있으면 soundfit 결과보다 안전(low)을 우선함
    if (
        gi.current_tension >= 4
        or "too_much_variation" in gi.past_discomfort_reasons
    ):
        modulation_intensity = "low"

    elif gi.sound_fit_texture and gi.sound_fit_texture in TEXTURE_TO_MODULATION:
        modulation_intensity = TEXTURE_TO_MODULATION[gi.sound_fit_texture]

    elif gi.current_tension >= 3:
        modulation_intensity = "medium"

    else:
        modulation_intensity = "low"

    #권장 재생시간_현재는 임시 규칙이며 personalization 구현 후 arm 선택 결과로 대체 예정.
    duration = 45

    if gi.sleep_hours is not None:

        if gi.sleep_hours < 5:
            duration = SAFE_DURATION_RANGE_MIN[0]

        elif gi.sleep_hours >= 7:
            duration = 60

    # 최소 / 최대 범위 제한
    duration = max(
        SAFE_DURATION_RANGE_MIN[0],
        min(
            SAFE_DURATION_RANGE_MIN[1],
            duration,
        ),
    )

    target_volume = min(
        gi.mixing_point_gain,
        SAFE_MAX_VOLUME,
    )

    # 프론트로 전달할 최종 사운드 설계 파라미터

    return {
        "frequency_bands": frequency_bands,
        "sources": sources,
        "mix_ratio": mix_ratio,
        "modulation_intensity": modulation_intensity,
        "duration_minutes": duration,
        "fade_out_seconds": 90,
        "initial_volume": SAFE_INITIAL_VOLUME,
        "max_volume": SAFE_MAX_VOLUME,

        # 혼합점 탐색용(사용자가 저장한 gain까지만 증가)
        "mixing_point_ramp": (
            build_mixing_point_ramp_spec(
                target_volume=target_volume
            )
        ),
    }


# 최초 생성된 사운드 설정을 실제 재생 설정의 초기값으로 저장
def initialize_final_params(
    session: SoundSession,
) -> SoundSession:

    if session.generated_params is None:
        return session

    session.final_params = {
        **session.generated_params,
        "sources": [
            dict(source)
            for source in session.generated_params.get(
                "sources",
                [],
            )
        ],
    }

    session.save(
        update_fields=[
            "final_params",
            "updated_at",
        ]
    )

    return session


# 사용자가 배경 자연음을 변경했을 때 최종 사운드 설정에 반영
# 실제 오디오 변경은 프론트(Web Audio API)에서 수행하고,
# 백엔드는 사용자가 최종적으로 선택한 설정만 기록한다.
def update_background_sound(
    session: SoundSession,
    background: str,
) -> SoundSession:

    params = dict(
        session.final_params
        or session.generated_params
        or {}
    )

    sources = [
        dict(source)
        for source in params.get(
            "sources",
            [],
        )
    ]

    background_updated = False

    for source in sources:
        if source.get("type") == "background":
            source["asset_tag"] = background
            background_updated = True
            break

    # 기존에 background 레이어가 없었던 경우 새로 추가
    if not background_updated:
        sources.append(
            {
                "type": "background",
                "asset_tag": background,
                "role": "ambient",
            }
        )

    params["sources"] = sources

    session.final_params = params

    session.save(
        update_fields=[
            "final_params",
            "updated_at",
        ]
    )

    return session


# 생성 실패 시 사용할 예비 사운드 "후보" 선택
def select_fallback_sound(
    gi: GenerationInput,
) -> Optional[FallbackSound]:

    candidates = FallbackSound.objects.filter(
        is_active=True
    )

    def distance(
        fallback: FallbackSound,
    ) -> float:
        # 1. 이명 음역 거리

        if (
            fallback.matched_freq_max_hz
            < gi.tinnitus_freq_min_hz
        ):
            freq_gap = (
                gi.tinnitus_freq_min_hz
                - fallback.matched_freq_max_hz
            )

        elif (
            gi.tinnitus_freq_max_hz
            < fallback.matched_freq_min_hz
        ):
            freq_gap = (
                fallback.matched_freq_min_hz
                - gi.tinnitus_freq_max_hz
            )

        else:
            # 두 음역이 겹치면 거리 0
            freq_gap = 0

        # 2. 선호 태그
        has_preferred_tag = any(
            tag in fallback.tags
            for tag in gi.sound_preferences
        )

        tag_penalty = (
            0
            if has_preferred_tag
            else 500
        )

        # 3. 과거 불편 사유
        # 현재는 단순 태그 비교 방식 추후 personalization 구현 시 학습 결과로 대체 가능.

        has_avoided_tag = any(
            reason in fallback.tags
            for reason in gi.past_discomfort_reasons
        )

        avoided_penalty = (
            1000
            if has_avoided_tag
            else 0
        )

        return (
            freq_gap
            + tag_penalty
            + avoided_penalty
        )

    return min(
        candidates,
        key=distance,
        default=None,
    )


# 이전에 '편안했어요' 평가를 받은 사운드 조회
def list_comfortable_sessions(
    user,
) -> list["SoundSession"]:

    from feedback.models import NightlyEvaluation

    evaluations = NightlyEvaluation.objects.filter(
        user=user,
        status=NightlyEvaluation.Status.EVALUATED,
        sound_session_id__isnull=False,
    )

    comfortable_pks = [
        evaluation.sound_session_id
        for evaluation in evaluations
        if COMFORTABLE_REACTION_TAG
        in (evaluation.sound_reactions or [])
    ]

    # 명시적인 "편안했어요" 평가가 존재하는 경우
    if comfortable_pks:
        return list(
            SoundSession.objects.filter(
                user=user,
                pk__in=comfortable_pks,
            ).order_by(
                "-created_at"
            )
        )

    # 명시적인 '편안했어요' 평가가 없는 경우의 임시 대체 기준
    # 정상적으로 끝까지 재생되었으며 불편 신고가 없었던 사운드 세션을 후보로 사용한다.
    return list(
        SoundSession.objects.filter(
            user=user,
            status=SoundSession.Status.COMPLETED,
        )
        .exclude(
            discomfort_reports__isnull=False
        )
        .order_by(
            "-created_at"
        )
    )


# 과거 "편안했어요" 평가를 받은 세션들의 배경음 태그 수집
# GenerationInput.past_helpful_tags를 채우는 데 사용 (현재 decide_parameters는
# 아직 이 값을 직접 소비하지 않음 - personalization 구현 후 반영 예정)
def collect_past_helpful_background_tags(user, limit: int = 20) -> list[str]:

    from feedback.models import NightlyEvaluation

    evaluations = (
        NightlyEvaluation.objects.filter(
            user=user,
            status=NightlyEvaluation.Status.EVALUATED,
            sound_session_id__isnull=False,
        )
        .exclude(sound_reactions=[])
        .order_by("-evaluated_at")
        .values_list("sound_session_id", "sound_reactions")
    )

    session_ids = [
        session_id
        for session_id, reactions in evaluations
        if COMFORTABLE_REACTION_TAG in (reactions or [])
    ][:limit]

    if not session_ids:
        return []

    tags: list[str] = []

    sessions = SoundSession.objects.filter(
        pk__in=session_ids
    )

    for session in sessions:

        # 사용자가 변경한 최종 설정이 있으면 최종 설정을 우선 사용
        params = (
            session.final_params
            or session.generated_params
            or {}
        )

        sources = params.get(
            "sources",
            []
        )

        for source in sources:

            # 현재 구조의 dict 형식
            if isinstance(source, dict):
                if source.get("type") == "background":
                    tag = source.get("asset_tag")

                    if tag:
                        tags.append(tag)

            # 이전 데이터가 문자열로 저장된 경우도 대응
            elif isinstance(source, str):
                tags.append(source)

    return tags