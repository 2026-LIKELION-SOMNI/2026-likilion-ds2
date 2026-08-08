from django.contrib import admin

from .models import CheckinRecord


@admin.register(CheckinRecord)
class CheckinRecordAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "discomfort", "tension", "sleep_hours", "fatigue", "stress", "caffeine", "created_at"]
    list_filter = ["discomfort", "tension", "caffeine"]
    search_fields = ["user__uuid"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("사용자", {"fields": ("user",)}),
        ("이명 상태 (필수)", {"fields": ("discomfort", "tension")}),
        ("건강 데이터 (선택, 미연동 시 직접 입력)", {"fields": ("sleep_hours", "fatigue", "stress", "caffeine", "note")}),
        ("기록 시각", {"fields": ("created_at",)}),
    )