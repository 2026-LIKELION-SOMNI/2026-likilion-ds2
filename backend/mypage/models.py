from django.db import models

from accounts.models import AnonymousUser


# F-1207~1208: 알림 설정
# 설정값 저장까지만 함 - 실제 알림 발송은 미구현
class NotificationSettings(models.Model):

    user = models.OneToOneField(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="notification_settings",
    )

    checkin_reminder_enabled = models.BooleanField(
        default=False,
        help_text="취침 전 체크인 알림 사용 여부",
    )
    checkin_reminder_time = models.TimeField(
        null=True, blank=True,
        help_text="체크인 알림 시각",
    )

    result_reminder_enabled = models.BooleanField(
        default=False,
        help_text="다음날 결과 기록 알림 사용 여부",
    )
    result_reminder_time = models.TimeField(
        null=True, blank=True,
        help_text="결과 기록 알림 시각",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "알림 설정"
        verbose_name_plural = "알림 설정 목록"

    def __str__(self):
        return f"NotificationSettings(user={self.user_id})"