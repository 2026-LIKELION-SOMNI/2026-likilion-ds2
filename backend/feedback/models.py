from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import AnonymousUser


class NightlyEvaluation(models.Model):

    class SleepLatency(models.TextChoices):
        UNDER_15 = "under_15min", "15분 이내"
        MIN_15_30 = "15_30min", "15-30분"
        MIN_30_60 = "30_60min", "30-60분"
        OVER_60 = "over_60min", "60분 초과"
        UNKNOWN = "unknown", "잘 모르겠어요"

    class SoundReaction(models.TextChoices):
        COMFORTABLE = "comfortable", "편안했어요"
        NOISE_WEAK = "noise_weak", "노이즈가 약했어요"
        SHARP = "sharp", "날카로웠어요"
        VOLUME_TOO_LOUD = "volume_too_loud", "볼륨이 컸어요"
        NATURAL_SOUND_UNCOMFORTABLE = (
            "natural_sound_uncomfortable",
            "자연음이 불편했어요",
        )

    class Status(models.TextChoices):
        PENDING = "pending", "평가 대기"
        EVALUATED = "evaluated", "평가 완료"
        EXPIRED = "expired", "미응답(24시간 경과)"

    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="nightly_evaluations",
    )

    for_date = models.DateField(
        help_text="평가 대상 세션이 실행된 날짜",
    )

    sound_session = models.ForeignKey(
        "sound.SoundSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nightly_evaluations",
    )

    relaxation_session = models.ForeignKey(
        "relaxtion.RelaxationSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nightly_evaluations",
    )

    sleep_latency = models.CharField(
        max_length=20,
        choices=SleepLatency.choices,
        null=True,
        blank=True,
        help_text="잠드는 데 걸린 시간",
    )

    discomfort_after = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
        help_text="다음날 회상한 이명 불편도 (1~5)",
    )

    anxiety_after = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
        help_text="다음날 회상한 불안 정도 (1~5)",
    )

    current_fatigue = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
        help_text="현재 피로도 (1~5)",
    )

    note = models.CharField(
        max_length=200,
        blank=True,
        help_text="한 줄 메모 (선택)",
    )

    routine_helpfulness = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
        help_text="이완 활동이 수면 준비에 도움이 된 정도 (1~5)",
    )

    sound_reactions = models.JSONField(
        default=list,
        blank=True,
        help_text="SoundReaction 값의 리스트 (복수 선택 가능)",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    evaluated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        indexes = [
            models.Index(
                fields=[
                    "user",
                    "status",
                ]
            ),
            models.Index(
                fields=[
                    "user",
                    "-for_date",
                ]
            ),
            models.Index(
                fields=[
                    "sound_session",
                ]
            ),
            models.Index(
                fields=[
                    "relaxation_session",
                ]
            ),
        ]

        ordering = [
            "-created_at",
        ]

        verbose_name = "세션 결과 평가"
        verbose_name_plural = "세션 결과 평가 목록"

    def __str__(self):
        return (
            f"NightlyEvaluation("
            f"{self.for_date}, "
            f"status={self.status})"
        )