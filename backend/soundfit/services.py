from .models import FitAxis, LayerMix, SoundFitProfile, SoundFitSession, Texture, TOTAL_ROUNDS

# 1/2 라운드 <- 실제 소리는 프론트가 자연음 원본을 이 값으로 가공해서 재생.
TEXTURE_OPTIONS = {
    "A": Texture.SOFT,
    "B": Texture.CLEAR,
}

# 2/2 라운드
LAYER_MIX_OPTIONS = {
    "A": LayerMix.LOW,
    "B": LayerMix.HIGH,
}


def start_session_options():
    """1/2 라운드(Texture) 시작 시 제시할 A/B."""
    return FitAxis.TEXTURE, TEXTURE_OPTIONS["A"], TEXTURE_OPTIONS["B"]


def next_round_options(round_number: int):
    if round_number == 2:
        return FitAxis.LAYER_MIX, LAYER_MIX_OPTIONS["A"], LAYER_MIX_OPTIONS["B"]
    return None, None, None


def is_fit_complete(round_number: int) -> bool:
    return round_number > TOTAL_ROUNDS


def apply_selection(session: SoundFitSession, selected: str) -> SoundFitSession:
    # A/B 선택을 세션에 반영하고 다음 라운드 상태로 갱신
    axis = session.current_axis
    option_a, option_b = _current_round_options(session)
    chosen_value = option_a if selected == "A" else option_b

    session.rounds.append({
        "round": session.round_number,
        "axis": axis,
        "selected": selected,
        "value": chosen_value,
    })

    if axis == FitAxis.TEXTURE:
        session.texture = chosen_value
    elif axis == FitAxis.LAYER_MIX:
        session.layer_mix = chosen_value

    session.round_number += 1
    return session


def _current_round_options(session: SoundFitSession):
    if session.current_axis == FitAxis.TEXTURE:
        return TEXTURE_OPTIONS["A"], TEXTURE_OPTIONS["B"]
    if session.current_axis == FitAxis.LAYER_MIX:
        return LAYER_MIX_OPTIONS["A"], LAYER_MIX_OPTIONS["B"]
    raise ValueError(f"알 수 없는 axis: {session.current_axis}")


def finalize_profile(session: SoundFitSession) -> SoundFitProfile:
    # 세션 완료 후 My Sound Profile 확정 저장 (기존 프로필 있으면 갱신)
    profile, _ = SoundFitProfile.objects.update_or_create(
        user=session.user,
        defaults={
            "texture": session.texture,
            "layer_mix": session.layer_mix,
            "source_session": session,
        },
    )
    return profile