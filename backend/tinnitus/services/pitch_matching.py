import math

from ..models import SUPPORTED_RANGE_MAX_HZ, SUPPORTED_RANGE_MIN_HZ, TOTAL_ROUNDS


def _geometric_mean(a, b):
    return math.sqrt(a * b)


def start_session_range():
    return SUPPORTED_RANGE_MIN_HZ, SUPPORTED_RANGE_MAX_HZ


def next_round_range(range_min, range_max, selected):
    # 로그 스케일 이분 탐색: 현재 범위의 기하평균을 기준으로 선택된 쪽 절반만 남긴다.
    mid = _geometric_mean(range_min, range_max)
    if selected == "A":
        return range_min, mid
    return mid, range_max


def is_matching_complete(round_number):
    return round_number > TOTAL_ROUNDS


def compute_provisional_center(range_min, range_max):
    return _geometric_mean(range_min, range_max)


def octave_test_candidates(provisional_center):
    half = provisional_center / 2
    double = provisional_center * 2
    limited = False

    if half < SUPPORTED_RANGE_MIN_HZ:
        half = None
        limited = True
    if double > SUPPORTED_RANGE_MAX_HZ:
        double = None
        limited = True

    return {"half": half, "same": provisional_center, "double": double, "limited": limited}


def apply_octave_correction(provisional_center, range_min, range_max, selected):
    factor = {"half": 0.5, "same": 1.0, "double": 2.0}[selected]
    return {
        "center_frequency": provisional_center * factor,
        "lower_bound": range_min * factor,
        "upper_bound": range_max * factor,
        "octave_corrected": factor != 1.0,
    }
