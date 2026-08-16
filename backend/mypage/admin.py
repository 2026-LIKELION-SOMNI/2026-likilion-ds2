from django.contrib import admin
from django.utils.html import format_html

from .models import NotificationSettings


@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "checkin_status",
        "result_status",
        "updated_at",
    )
    list_filter = ("checkin_reminder_enabled", "result_reminder_enabled")
    search_fields = ("user__uuid",)
    readonly_fields = ("updated_at",)
    ordering = ("-updated_at",)

    fieldsets = (
        ("사용자", {
            "fields": ("user",),
        }),
        ("취침 전 체크인 알림", {
            "fields": ("checkin_reminder_enabled", "checkin_reminder_time"),
            "description": "F-1207~1208 - 실제 발송은 안 함, 설정값만 저장 (로드맵)",
        }),
        ("다음날 결과 기록 알림", {
            "fields": ("result_reminder_enabled", "result_reminder_time"),
        }),
        ("기록 시각", {
            "fields": ("updated_at",),
        }),
    )

    @admin.display(description="체크인 알림", ordering="checkin_reminder_enabled")
    def checkin_status(self, obj):
        if not obj.checkin_reminder_enabled:
            return format_html('<span style="color: #999;">꺼짐</span>')
        time_str = obj.checkin_reminder_time.strftime("%H:%M") if obj.checkin_reminder_time else "시간 미설정"
        return format_html(
            '<span style="color: #2e7d32; font-weight: bold;">켜짐</span> · {}',
            time_str,
        )

    @admin.display(description="결과기록 알림", ordering="result_reminder_enabled")
    def result_status(self, obj):
        if not obj.result_reminder_enabled:
            return format_html('<span style="color: #999;">꺼짐</span>')
        time_str = obj.result_reminder_time.strftime("%H:%M") if obj.result_reminder_time else "시간 미설정"
        return format_html(
            '<span style="color: #2e7d32; font-weight: bold;">켜짐</span> · {}',
            time_str,
        )