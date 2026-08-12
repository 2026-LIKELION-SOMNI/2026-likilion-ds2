from rest_framework import serializers

from .models import InterventionEvaluation


class InterventionEvaluationSerializer(serializers.ModelSerializer):

    class Meta:
        model = InterventionEvaluation
        fields = [
            "id",
            "intervention_type",
            "session_id",
            "discomfort_after",
            "tension_after",
            "helpfulness",
            "discomfort_feedback",
            "status",
            "created_at",
            "evaluated_at",
        ]
        read_only_fields = [
            "id", "intervention_type", "session_id",
            "status", "created_at", "evaluated_at",
        ]


# 다음 접속 시 전날 미평가(PENDING) 개입 보여줄 정보
class PendingEvaluationSerializer(serializers.ModelSerializer):

    class Meta:
        model = InterventionEvaluation
        fields = [
            "id",
            "intervention_type",
            "session_id",
            "created_at",
        ]