from django.contrib import admin

from .models import FallbackSound, SoundDiscomfortReport, SoundSession


class SoundDiscomfortReportInline(admin.TabularInline):
    model = SoundDiscomfortReport
    extra = 0
    readonly_fields = ["reasons", "note", "follow_up_action", "reported_at"]
    can_delete = False


@admin.register(SoundSession)
class SoundSessionAdmin(admin.ModelAdmin):
    list_display = [
        "session_id",
        "user",
        "status",
        "is_fallback",
        "recommended_duration_minutes",
        "total_played_seconds",
        "created_at",
    ]
    list_filter = ["status", "is_fallback", "end_reason"]
    search_fields = ["session_id", "user__uuid"]
    readonly_fields = [
        "session_id",
        "input_snapshot",
        "generated_params",
        "generation_error_code",
        "created_at",
        "updated_at",
    ]
    autocomplete_fields = ["user", "fallback_sound", "regenerated_from"]
    date_hierarchy = "created_at"
    inlines = [SoundDiscomfortReportInline]

    fieldsets = (
        (None, {"fields": ("session_id", "user", "status")}),
        (
            "생성 입력/결과 (REQ-F-16)",
            {"fields": ("input_snapshot", "generated_params", "recommended_duration_minutes")},
        ),
        (
            "생성 실패/예비 사운드 (REQ-F-18/F-612/F-613)",
            {"fields": ("is_fallback", "fallback_sound", "generation_error_code")},
        ),
        (
            "재생 이력 (REQ-F-19)",
            {
                "fields": (
                    "playback_started_at",
                    "playback_ended_at",
                    "total_played_seconds",
                    "end_reason",
                )
            },
        ),
        (
            "안전 음량 / 혼합점 (REQ-F-20)",
            {"fields": ("initial_volume", "max_volume_applied", "mixing_point_gain")},
        ),
        ("재생성 이력", {"fields": ("regenerated_from",)}),
        ("타임스탬프", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(FallbackSound)
class FallbackSoundAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "matched_freq_min_hz",
        "matched_freq_max_hz",
        "duration_seconds",
        "loopable",
        "is_active",
    ]
    list_filter = ["is_active", "loopable"]
    search_fields = ["name", "tags"]


@admin.register(SoundDiscomfortReport)
class SoundDiscomfortReportAdmin(admin.ModelAdmin):
    list_display = ["session", "reasons", "follow_up_action", "reported_at"]
    list_filter = ["follow_up_action", "reported_at"]
    readonly_fields = ["session", "reasons", "note", "follow_up_action", "reported_at"]
    search_fields = ["session__session_id"]