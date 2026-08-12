from django.contrib import admin

from .models import InterventionEvaluation


@admin.register(InterventionEvaluation)
class InterventionEvaluationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "intervention_type",
        "session_id",
        "discomfort_after",
        "tension_after",
        "helpfulness",
        "status",
        "created_at",
        "evaluated_at",
    ]

    list_filter = [
        "intervention_type",
        "helpfulness",
        "status",
    ]

    search_fields = [
        "user__id",
    ]

    ordering = ["-created_at"]