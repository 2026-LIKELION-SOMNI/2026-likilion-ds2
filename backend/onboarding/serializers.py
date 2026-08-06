from django.utils import timezone
from rest_framework import serializers

from .models import OnboardingStatus, SafetyCheckResponse


class DisclaimerConfirmSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()


class OnboardingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingStatus
        fields = ["confirmed", "confirmed_at", "done", "done_at"]
        read_only_fields = ["confirmed_at", "done_at"]


class SafetyCheckResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyCheckResponse
        fields = ["hearing_loss", "one_sided", "pulse_sound", "dizziness", "need_doctor", "created_at"]
        read_only_fields = ["need_doctor", "created_at"]