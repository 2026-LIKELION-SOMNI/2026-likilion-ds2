from django.contrib import admin

from .models import InterventionDecision, UserPersonalizationProfile


@admin.register(InterventionDecision)
class InterventionDecisionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "intervention_type",
        "relaxation_activity_type",
        "has_sufficient_data",
        "sound_session_id",
        "relaxation_session_id",
        "decided_at",
    )

    list_filter = (
        "intervention_type",
        "has_sufficient_data",
    )

    search_fields = (
        "user__uuid",
    )


@admin.register(UserPersonalizationProfile)
class UserPersonalizationProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "evaluation_sample_count",
        "sound_sample_count",
        "relaxation_sample_count",
        "last_updated_at",
    )

    search_fields = (
        "user__uuid",
    )