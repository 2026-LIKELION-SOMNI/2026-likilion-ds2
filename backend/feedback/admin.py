from django import forms
from django.contrib import admin

from .models import NightlyEvaluation


class NightlyEvaluationAdminForm(forms.ModelForm):
    sound_reactions = forms.MultipleChoiceField(
        choices=NightlyEvaluation.SoundReaction.choices,
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="사운드 반응",
    )

    class Meta:
        model = NightlyEvaluation
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.pk:
            self.fields["sound_reactions"].initial = (
                self.instance.sound_reactions or []
            )

    def clean_sound_reactions(self):
        return self.cleaned_data["sound_reactions"]


@admin.register(NightlyEvaluation)
class NightlyEvaluationAdmin(admin.ModelAdmin):
    form = NightlyEvaluationAdminForm

    list_display = (
        "id",
        "user",
        "for_date",
        "status",
        "sleep_latency",
        "discomfort_after",
        "anxiety_after",
        "routine_helpfulness",
        "current_fatigue",
        "evaluated_at",
    )

    list_filter = (
        "status",
        "for_date",
        "sleep_latency",
    )

    search_fields = (
        "user__uuid",
        "note",
    )

    readonly_fields = (
        "created_at",
        "evaluated_at",
    )

    ordering = (
        "-for_date",
    )