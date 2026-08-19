from rest_framework import serializers

from .models import RelaxationSession


# activity_type을 기준으로 화면 문구와 음성 가이드 렌더링
class RelaxationSessionSerializer(serializers.ModelSerializer):

    id = serializers.UUIDField(
        source="session_id",
        read_only=True,
    )

    activity_type_display = serializers.CharField(
        source="get_activity_type_display",
        read_only=True,
    )

    class Meta:
        model = RelaxationSession

        fields = [
            "id",
            "activity_type",
            "activity_type_display",
            "recommendation_source",
            "status",
            "tinnitus_discomfort",
            "anxiety",
            "stress",
            "fatigue",
            "caffeine",
            "recommended_at",
            "started_at",
            "ended_at",
        ]

        read_only_fields = fields