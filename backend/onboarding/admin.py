from django.contrib import admin

from .models import OnboardingStatus, SafetyCheckResponse


@admin.register(OnboardingStatus)
class OnboardingStatusAdmin(admin.ModelAdmin):
    list_display = ["user", "confirmed", "confirmed_at", "done", "done_at"]
    list_filter = ["confirmed", "done"]
    search_fields = ["user__uuid", "user__nickname"]
    readonly_fields = ["confirmed_at", "done_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("사용자", {"fields": ("user",)}),
        ("의료적 한계 고지", {"fields": ("confirmed", "confirmed_at")}),
        ("온보딩 완료", {"fields": ("done", "done_at")}),
    )


@admin.register(SafetyCheckResponse)
class SafetyCheckResponseAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "hearing_loss", "one_sided", "pulse_sound", "dizziness", "need_doctor", "created_at"]
    list_filter = ["need_doctor", "hearing_loss", "one_sided", "pulse_sound", "dizziness"]
    search_fields = ["user__uuid", "user__nickname"]
    readonly_fields = ["need_doctor", "created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("사용자", {"fields": ("user",)}),
        ("안전 문항 응답", {"fields": ("hearing_loss", "one_sided", "pulse_sound", "dizziness")}),
        ("결과", {"fields": ("need_doctor", "created_at")}),
    )