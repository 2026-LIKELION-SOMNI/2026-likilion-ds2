from rest_framework import serializers
from .models import InterventionDecision, UserPersonalizationProfile

# 오늘 개인화 개입 결정을 생성할 때 받는 입력값
class InterventionDecisionCreateSerializer(serializers.Serializer):
    tinnitus_discomfort = serializers.IntegerField(
        min_value=1,
        max_value=5,
    )

    anxiety = serializers.IntegerField(
        min_value=1,
        max_value=5,
    )

    stress = serializers.BooleanField()

    fatigue = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        allow_null=True,
    )

    caffeine = serializers.BooleanField(
        required=False,
        default=False,
    )


# 오늘 생성된 개인화 결정 응답
class InterventionDecisionSerializer(serializers.ModelSerializer):

    class Meta:
        model = InterventionDecision
        fields = [
            "id",
            "intervention_type",
            "state_snapshot",
            "relaxation_activity_type",
            "sound_strategy",
            "has_sufficient_data",
            "missing_data_sources",
            "reason",
            "sound_session_id",
            "relaxation_session_id",
            "decided_at",
            "relaxation_recommendation_source",
        ]

        read_only_fields = fields


# 사용자별 누적 개인화 프로필 응답
class UserPersonalizationProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserPersonalizationProfile
        fields = [
            "sound_tag_weights",
            "excluded_sound_tags",
            "relaxation_type_weights",
            "discouraged_relaxation_types",
            "evaluation_sample_count",
            "sound_sample_count",
            "relaxation_sample_count",
            "last_updated_at",
        ]

        read_only_fields = fields