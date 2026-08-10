from django.contrib import admin

from .models import PitchMatchSession, TinnitusProfile


@admin.register(TinnitusProfile)
class TinnitusProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "tone_type",
        "primary_tone_type",
        "tinnitus_type",
        "location",
        "updated_at",
    )
    list_filter = ("tone_type",)
    search_fields = ("user__uuid", "location", "note")
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description="내부 분류")
    def tinnitus_type(self, obj):
        return obj.tinnitus_type


@admin.register(PitchMatchSession)
class PitchMatchSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "tinnitus_type",
        "round_number",
        "range_min",
        "range_max",
        "octave_test_started",
        "done",
        "abandoned",
        "center_frequency",
        "created_at",
    )
    list_filter = ("tinnitus_type", "done", "abandoned", "octave_test_started")
    search_fields = ("user__uuid",)
    readonly_fields = ("created_at", "completed_at", "abandoned_at", "rounds_display")
    fields = (
        "user",
        "tinnitus_type",
        ("range_min", "range_max"),
        "round_number",
        ("freq_a", "freq_b"),
        "rounds_display",
        "provisional_center",
        "octave_test_started",
        "octave_selection",
        "octave_check_limited",
        "done",
        ("center_frequency", "lower_bound", "upper_bound"),
        "octave_corrected",
        ("abandoned", "abandoned_at"),
        ("created_at", "completed_at"),
    )

    @admin.display(description="라운드별 선택 기록")
    def rounds_display(self, obj):
        if not obj.rounds:
            return "-"
        lines = [
            f"{r['round']}회차: {r['selected']} 선택 (A={r['freq_a']:.1f}Hz, B={r['freq_b']:.1f}Hz)"
            for r in obj.rounds
        ]
        return "\n".join(lines)