from django.contrib import admin

from .models import SoundFitProfile, SoundFitSession


@admin.register(SoundFitSession)
class SoundFitSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "round_number", "current_axis", "texture", "layer_mix", "done", "created_at")
    list_filter = ("done", "abandoned", "current_axis")
    search_fields = ("user__uuid",)
    readonly_fields = ("created_at", "completed_at")


@admin.register(SoundFitProfile)
class SoundFitProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "texture", "layer_mix", "updated_at")
    search_fields = ("user__uuid",)
    readonly_fields = ("created_at", "updated_at")