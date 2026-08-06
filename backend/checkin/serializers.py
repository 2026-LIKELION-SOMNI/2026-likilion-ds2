from rest_framework import serializers

from .models import CheckinRecord


class CheckinRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckinRecord
        fields = [
            "id",
            "user",
            "discomfort",
            "tension",
            "sleep_hours",
            "fatigue",
            "stress",
            "caffeine",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]