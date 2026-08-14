from django.apps import apps
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import AnonymousUser


# 사용자당 하루(밤) 1개의 결과 평가
# sound / relaxation 구조가 완전히 확정되기 전까지는 세션 PK를 소프트 참조로 저장
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
        # 세션 종료 후 24시간 이내이며 아직 결과 기록을 제출하지 않은 상태(나중에 버튼 포함)
        PENDING = "pending", "평가 대기"

        # 사용자가 결과 기록을 정상적으로 저장한 상태
        EVALUATED = "evaluated", "평가 완료"

        # 세션 종료 후 24시간이 지나 더 이상 입력할 수 없는 상태
        EXPIRED = "expired", "미응답(24시간 경과)"

    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="nightly_evaluations",
    )

    # 평가 대상이 되는 밤의 날짜
    # 사용자당 동일한 밤에 하나의 평가만 생성
    for_date = models.DateField(
        help_text="평가 대상이 되는 밤의 날짜",
    )

    # 해당 밤에 실행된 세션 PK, 해당 개입이 없었던 경우 null, sound / relaxation 구조 확정 후 실제 FK 전환 예정
    sound_session_id = models.PositiveIntegerField(null=True,blank=True,)
    relaxation_session_id = models.PositiveIntegerField(null=True,blank=True,)

    # 그날 밤 전체에 대한 결과
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

    # 이완 루틴 결과_이완 세션이 있었을 시에만 의미가 있다
    routine_helpfulness = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
        help_text="어젯밤 수면 준비가 도움이 된 정도 (1~5)",
    )

    # 사운드 결과_사운드가 있었을 시에만 의미가 있다
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

    # 평가 row가 생성된 시각
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    # 사용자가 실제로 결과 기록을 제출한 시각
    evaluated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "for_date",
                ],
                name="feedback_one_nightly_evaluation_per_night",
            )
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "-for_date",
                ]
            ),
        ]

        ordering = [
            "-for_date",
        ]

        verbose_name = "밤 단위 평가"
        verbose_name_plural = "밤 단위 평가 목록"

    def __str__(self):
        return (
            f"NightlyEvaluation("
            f"{self.for_date}, "
            f"status={self.status})"
        )

    # 소프트 참조 헬퍼
    # sound / relaxation을 실제 FK로 전환하면 삭제 예정
    def get_sound_session(self):
        if not self.sound_session_id:
            return None

        Model = apps.get_model(
            "sound",
            "SoundSession",
        )

        return Model.objects.filter(
            pk=self.sound_session_id
        ).first()

    def get_relaxation_session(self):
        if not self.relaxation_session_id:
            return None

        Model = apps.get_model(
            "relaxation",
            "RelaxationSession",
        )

        return Model.objects.filter(
            pk=self.relaxation_session_id
        ).first()