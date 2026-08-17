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

# 재생 시간 0이나 음수같은 값 막기
SAFE_DURATION_TECHNICAL_MIN_MINUTES = 1 

MODULATION_LEVELS = (
    "low",
    "medium",
    "high",
)

BACKGROUND_CANDIDATES = (
    "rain",
    "stream",
    "ocean",
    "air",
)

# personalization/soundfit 둘 다 값을 못 준 예외 상황에서만 쓰는 고정 기본값.
# sound가 current_discomfort/current_tension/sleep_hours를 다시 판단하지 않도록 세분화된 규칙 대신 단순 고정값으로만 대비
DEFAULT_BACKGROUND = "rain"
DEFAULT_MASKING_RATIO = 0.60
DEFAULT_MODULATION_INTENSITY = "medium"
DEFAULT_DURATION_MINUTES = 45


# 노치 필터 설계 상수

HALF_OCTAVE_RATIO = 2 ** 0.25
NOTCH_STAGE_COUNT = 6
NOTCH_STAGE_Q = 1.4 * 4  # 5.6

# 혼합점(Mixing Point) 탐색 설정
MIXING_POINT_RAMP_SECONDS_DEFAULT = 20

MIXING_POINT_RAMP_RANGE_DB = 40

# feedback 연동
COMFORTABLE_REACTION_TAG = "comfortable"

# soundfit 연동 매핑 상수
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


# 예외
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

    # fallback sound 후보 선택용
    past_discomfort_reasons: list[str]

    # soundfit 결과
    # personalization 결과가 없을 때만 fallback으로 사용
    sound_fit_texture: Optional[str] = None
    sound_fit_layer_mix: Optional[str] = None

    # personalization이 결정한 고수준 사운드 전략
    personalization_background: Optional[str] = None
    personalization_masking_ratio: Optional[float] = None
    personalization_modulation_intensity: Optional[str] = None
    personalization_mixing_point_gain: Optional[float] = None
    personalization_duration_minutes: Optional[int] = None


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

# 노치 필터 전체 설계 정보 
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

    # 노치 필터 자체 계산은 sound가 담당
    frequency_bands = [
        build_notch_filter_spec(
            gi.tinnitus_center_hz
        )
    ]

    sources = [
        {
            "type": "synth",
            "waveform": "pink_noise",
            "role": "tinnitus_masking",
        }
    ]

    # 자연음 결정
    if (
        gi.personalization_background
        in BACKGROUND_CANDIDATES
    ):
        preferred_bg = (
            gi.personalization_background
        )

        sources.append(
            {
                "type": "background",
                "asset_tag": preferred_bg,
                "role": "ambient",
            }
        )

    #personalization 결과가 없는 예외 흐름
    else:
        sources.append(
            {
                "type": "background",
                "asset_tag": DEFAULT_BACKGROUND,
                "role": "ambient",
            }
        )

    # 혼합 비율
    # personalization이 결정한 masking_ratio가 있으면 그대로 사용 /없는 경우에만 soundfit -> 기존 sound 규칙 순으로 fallback.
    if (
        gi.personalization_masking_ratio
        is not None
    ):
        masking_ratio = (
            gi.personalization_masking_ratio
        )

    elif (
        gi.sound_fit_layer_mix
        and gi.sound_fit_layer_mix
        in LAYER_MIX_TO_MASKING_RATIO
    ):
        masking_ratio = (
            LAYER_MIX_TO_MASKING_RATIO[
                gi.sound_fit_layer_mix
            ]
        )

    else:
        # personalization 결과가 없는 예외 흐름(고정 기본값 사용)
        masking_ratio = DEFAULT_MASKING_RATIO

    # 비정상적인 값이 넘어오는 경우를 막는 기술적 제한
    masking_ratio = max(
        0.0,
        min(
            1.0,
            masking_ratio,
        ),
    )

    mix_ratio = {
        "tinnitus_masking": masking_ratio,
        "ambient": round(
            1 - masking_ratio,
            2,
        ),
    }

    # 변화 강도
    if (
        gi.personalization_modulation_intensity
        in MODULATION_LEVELS
    ):
        modulation_intensity = (
            gi.personalization_modulation_intensity
        )

    # personalization 결과가 없는 예외 흐름에서만 soundfit -> 고정 기본값 순
    elif (
        gi.sound_fit_texture
        and gi.sound_fit_texture
        in TEXTURE_TO_MODULATION
    ):
        modulation_intensity = (
            TEXTURE_TO_MODULATION[
                gi.sound_fit_texture
            ]
        )

    else:
        # 고정 기본값만 사용
        modulation_intensity = DEFAULT_MODULATION_INTENSITY

    # 권장 재생시간
    if (
        gi.personalization_duration_minutes
        is not None
    ):
        duration = (
            gi.personalization_duration_minutes
        )

    else:
        # personalization 결과가 없는 예외 흐름 - sleep_hours 재판단 없이 고정 기본값만 사용한다.
        duration = DEFAULT_DURATION_MINUTES

    # 0/음수 방지와 과도한 재생시간 방지
    duration = max(
        SAFE_DURATION_TECHNICAL_MIN_MINUTES,
        duration,
    )
    

    # 혼합점(Mixing Point)
    base_gain = (
        gi.personalization_mixing_point_gain
        if (
            gi.personalization_mixing_point_gain
            is not None
        )
        else gi.mixing_point_gain
    )

    target_volume = min(
        base_gain,
        SAFE_MAX_VOLUME,
    )

    # 프론트로 전달할 최종 사운드 설계 파라미터
    return {
        "frequency_bands": frequency_bands,
        "sources": sources,
        "mix_ratio": mix_ratio,
        "modulation_intensity": (
            modulation_intensity
        ),
        "duration_minutes": duration,
        "fade_out_seconds": 90,
        "initial_volume": SAFE_INITIAL_VOLUME,
        "max_volume": SAFE_MAX_VOLUME,

        # 혼합점 탐색용
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
            for source
            in session.generated_params.get(
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

    if background not in BACKGROUND_CANDIDATES:
        raise ValueError(
            "지원하지 않는 자연음입니다."
        )

    params = dict(
        session.final_params
        or session.generated_params
        or {}
    )

    sources = [
        dict(source)
        for source
        in params.get(
            "sources",
            [],
        )
    ]

    background_updated = False

    for source in sources:
        if (
            isinstance(source, dict)
            and source.get("type")
            == "background"
        ):
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

        # 3. 과거 불편 사유(personalization 결과 직접 사용 x , fallback sound 후보 선택에만 보조적으로 사용)
        has_avoided_tag = any(
            reason in fallback.tags
            for reason
            in gi.past_discomfort_reasons
        )

        avoided_penalty = (
            1000
            if has_avoided_tag
            else 0
        )

        return (
            freq_gap
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

    evaluations = (
        NightlyEvaluation.objects.filter(
            user=user,
            status=(
                NightlyEvaluation
                .Status
                .EVALUATED
            ),
            sound_session_id__isnull=False,
        )
    )

    comfortable_pks = [
        evaluation.sound_session_id
        for evaluation in evaluations
        if (
            COMFORTABLE_REACTION_TAG
            in (
                evaluation.sound_reactions
                or []
            )
        )
    ]

    return list(
        SoundSession.objects.filter(
            user=user,
            pk__in=comfortable_pks,
        ).order_by(
            "-created_at"
        )
    )