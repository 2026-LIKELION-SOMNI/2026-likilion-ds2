from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import AnonymousUser


class DailyFactor(models.TextChoices):
    """F-405~409: '오늘 하루는 어땠나요?' 다중 선택 요인 (Figma 디자인 반영)"""
    CAFFEINE = "caffeine", "카페인"
    STRESS = "stress", "스트레스"
    FATIGUE = "fatigue", "피로"
    NOISE_EXPOSURE = "noise_exposure", "소음 노출"


class CheckinRecord(models.Model):
    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="checkins",
    )

    discomfort = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="이명 불편도 (1: 편안함 ~ 5: 매우 불편함)",
    )
    tension = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="불안 정도 (1: 안정됨 ~ 5: 매우 불안함)",
    )

    sleep_hours = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],  # 음수 수면시간 방지
        help_text="어젯밤 수면시간(시간)",
    )

    # [변경] fatigue/stress/caffeine 개별 필드 -> daily_factors 다중 선택 배열로 통합
    # Figma "오늘 하루는 어땠나요?" 화면: 카페인/스트레스/피로/소음노출을 칩으로 다중 선택
    # 아무것도 선택 안 하면(= "특별한 요인 없음") 빈 배열로 저장
    daily_factors = models.JSONField(
        default=list, blank=True,
        help_text="DailyFactor 값들의 리스트. 예: ['caffeine', 'stress']. 없으면 빈 배열",
    )

    note = models.CharField(max_length=255, blank=True, default="", help_text="한 줄 메모 (선택)")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "야간 체크인 기록"
        verbose_name_plural = "야간 체크인 기록 목록"
        ordering = ["-created_at"]

    def __str__(self):
        return f"CheckinRecord({self.user_id}, discomfort={self.discomfort}, {self.created_at:%Y-%m-%d})"