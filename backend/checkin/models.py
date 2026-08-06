from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import AnonymousUser


# 야간 체크인 
class CheckinRecord(models.Model):
    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="checkins",
    )

    # 필수로 입력 받아야 하는 항목 
    discomfort = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="이명 불편도 (1: 편안함 ~ 5: 매우 불편함)",
    )
    tension = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="긴장도 (1: 안정됨 ~ 5: 매우 불안함)",
    )

    # 선택할 수 있는 항목
    sleep_hours = models.FloatField(null=True, blank=True, help_text="어젯밤 수면시간(시간)")
    fatigue = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="현재 피로도 (1~5, 선택)",
    )
    stress = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="현재 스트레스 (1~5, 선택)",
    )
    caffeine = models.BooleanField(default=False, help_text="늦은 카페인 섭취 여부")
    note = models.CharField(max_length=255, blank=True, default="", help_text="한 줄 메모 (선택)")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "야간 체크인 기록"
        verbose_name_plural = "야간 체크인 기록 목록"
        ordering = ["-created_at"]

    def __str__(self):
        return f"CheckinRecord({self.user_id}, discomfort={self.discomfort}, {self.created_at:%Y-%m-%d})"