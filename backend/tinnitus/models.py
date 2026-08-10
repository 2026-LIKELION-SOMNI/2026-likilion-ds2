from django.db import models


class ToneType(models.TextChoices):
    # F-301~303: 사용자에게 보이는 이명 소리 선택지 (4종)
    BEEP = "high", "삐— 한 음이 선명하게 들려요"
    HUM = "low", "윙— 중심이 되는 울림이 있어요"
    HISS = "wide", "쉬익— 소리가 넓게 퍼져 들려요"
    MULTIPLE = "multiple", "여러 소리가 함께 들려요"


class OccurrenceTime(models.TextChoices):
    # F-303: 이명이 주로 심해지는 시간대 (디자인 나오면 수정해야 할수도 잇음)
    MORNING = "morning", "아침"
    DAYTIME = "daytime", "낮"
    EVENING = "evening", "저녁"
    NIGHT = "night", "밤·잠들기 전"
    QUIET = "quiet", "조용한 환경에서 항상"
    NO_PATTERN = "no_pattern", "특별한 패턴 없음"


class TinnitusType(models.TextChoices):
    """내부 분류: tone_type → 이 값으로 매핑되어 매칭 방식·노치 여부를 결정"""
    TONAL = "tonal", "Tonal"
    NOISE_LIKE = "noise_like", "Noise-like"


# 비교음 생성 시 -> 프론트엔드에서 적용할 대역폭 (프론트 코드에서 하드 코딩 ㄴㄴ)
BANDWIDTH_OCTAVE_BY_TYPE = {
    TinnitusType.TONAL: 1 / 16,       # Narrow NBN
    TinnitusType.NOISE_LIKE: 1 / 3,   # Wide NBN
}


class OctaveSelection(models.TextChoices):
    """Octave Confusion Test 선택지"""
    HALF = "half", "f/2"
    SAME = "same", "f"
    DOUBLE = "double", "2f"


SUPPORTED_RANGE_MIN_HZ = 250.0
SUPPORTED_RANGE_MAX_HZ = 16000.0
TOTAL_ROUNDS = 7  # PDF "5. 전체 측정 횟수"


class TinnitusProfile(models.Model):
    """F-301~304: 이명 기본 정보"""

    user = models.OneToOneField(
        "accounts.AnonymousUser",
        on_delete=models.CASCADE,
        related_name="tinnitus_profile",
    )
    tone_type = models.CharField(max_length=20, choices=ToneType.choices)

    # tone_type == MULTIPLE(복합형)일 때, "가장 신경 쓰이는 소리"로 고른 실제 대표 소리
    primary_tone_type = models.CharField(
        max_length=20, choices=ToneType.choices, null=True, blank=True,
        help_text="tone_type이 multiple일 때만 사용. high/low/wide 중 하나",
    )

    location = models.CharField(max_length=100, null=True, blank=True)

    # F-303: 주요 발생 시간 (디자인 나오면 수정해야 할 수도 있음)
    occurrence_times = models.JSONField(
        default=list, blank=True,
        help_text="OccurrenceTime 값들의 리스트. 예: ['night', 'quiet']",
    )
    # F-303: 기존 대처 방법 (선택형 구조가 나을 것 같긴 한데 일단 자유 텍스트.. 이것도 수정 가능성 잇음)
    existing_coping = models.TextField(
        null=True, blank=True,
        help_text="기존에 시도해본 대처 방법 (자유 텍스트, 추후 선택형으로 전환 가능)",
    )

    note = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "이명 프로필"
        verbose_name_plural = "이명 프로필"

    def __str__(self):
        return f"TinnitusProfile(user={self.user_id}, tone={self.tone_type})"

    @property
    def effective_tone_type(self):
        """실제 매칭에 사용할 tone_type. 복합형이면 primary_tone_type을 사용."""
        if self.tone_type == ToneType.MULTIPLE:
            return self.primary_tone_type
        return self.tone_type

    @property
    def tinnitus_type(self):
        """effective_tone_type → TinnitusType 매핑 (PDF "19. Noise-like" 표 기준)"""
        effective = self.effective_tone_type
        if effective in (ToneType.BEEP, ToneType.HUM):
            return TinnitusType.TONAL
        if effective == ToneType.HISS:
            return TinnitusType.NOISE_LIKE
        return None 

class PitchMatchSession(models.Model):
    # F-305~314: 음역 매칭 세션 (이분탐색 7회 + Octave Confusion Test)

    user = models.ForeignKey(
        "accounts.AnonymousUser",
        on_delete=models.CASCADE,
        related_name="pitch_match_sessions",
    )
    tinnitus_type = models.CharField(max_length=20, choices=TinnitusType.choices)

    # 현재 탐색 범위 (L, H) — 매번 절반으로 축소됨
    range_min = models.FloatField(default=SUPPORTED_RANGE_MIN_HZ, help_text="Hz, 현재 범위 하한(L)")
    range_max = models.FloatField(default=SUPPORTED_RANGE_MAX_HZ, help_text="Hz, 현재 범위 상한(H)")

    round_number = models.PositiveSmallIntegerField(default=1)  # 1~7

    # 현재 라운드에 제시된 비교음 (매번 갱신됨)
    freq_a = models.FloatField(null=True, blank=True)
    freq_b = models.FloatField(null=True, blank=True)

    rounds = models.JSONField(default=list, blank=True)

    # 7회 완료 후 계산되는 임시 대표 주파수 
    provisional_center = models.FloatField(null=True, blank=True)

    # Octave Confusion Test 단계
    octave_test_started = models.BooleanField(default=False)
    octave_selection = models.CharField(
        max_length=10, choices=OctaveSelection.choices, null=True, blank=True
    )
    # f/2 또는 2f가 지원 범위(250~16000Hz)를 벗어나 3개 중 일부만 제시했는지
    octave_check_limited = models.BooleanField(default=False)

    # 최종 확정 결과
    done = models.BooleanField(default=False)
    center_frequency = models.FloatField(null=True, blank=True)
    lower_bound = models.FloatField(null=True, blank=True)
    upper_bound = models.FloatField(null=True, blank=True)
    octave_corrected = models.BooleanField(default=False)

    abandoned = models.BooleanField(default=False)
    abandoned_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "음역 매칭 세션"
        verbose_name_plural = "음역 매칭 세션"
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"PitchMatchSession(user={self.user_id}, round={self.round_number}/{TOTAL_ROUNDS})"

    @property
    def bandwidth_octave(self):
        # 프론트가 비교음(NBN)을 생성할 때 이 값을 그대로 사용하면 됨 (노션 PDF에 따름!!)
        # Tonal=1/16 octave, Noise-like=1/3 octave로 고정.
        return BANDWIDTH_OCTAVE_BY_TYPE.get(self.tinnitus_type)