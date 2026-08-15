from django.contrib import admin

from .models import RelaxationSession


@admin.register(RelaxationSession)
class RelaxationSessionAdmin(admin.ModelAdmin):
    list_display = (
        "session_id",
        "user",
        "activity_type",
        "recommendation_source",
        "status",
        "tinnitus_discomfort",
        "anxiety",
        "stress",
        "recommended_at",
    )
    list_filter = ("activity_type", "recommendation_source", "status", "stress", "caffeine")
    search_fields = ("session_id", "user__uuid")
    readonly_fields = ("session_id", "recommended_at")
    date_hierarchy = "recommended_at"