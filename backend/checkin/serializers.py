from rest_framework import serializers

from .models import CheckinRecord, DailyFactor


class CheckinRecordSerializer(serializers.ModelSerializer):
    daily_factors = serializers.ListField(
        child=serializers.ChoiceField(choices=DailyFactor.choices),
        required=False,
        default=list,
        help_text="DailyFactor 값들의 리스트 (다중 선택). 선택 안 하면 빈 배열",
    )

    class Meta:
        model = CheckinRecord
        fields = [
            "id",
            "user",
            "discomfort",
            "tension",
            "sleep_hours",
            "daily_factors",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]