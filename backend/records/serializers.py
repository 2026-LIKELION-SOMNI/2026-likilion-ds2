from django.utils import timezone
from rest_framework import serializers

from feedback.models import InterventionEvaluation


# F-1101: 일별 이용 기록 목록 - 개입 id와 날짜와 시간
class DailyRecordListSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()

    class Meta:
        model = InterventionEvaluation
        fields = ["id", "session_id", "date", "time"]

    def get_date(self, obj):
        return obj.created_at.date()
    def get_time(self, obj):
        return obj.created_at.strftime("%H:%M")


# 일별 기록 상세 - 개입 시작 시각 / 루틴 순서 / 그날 쓴 사운드
class InterventionRecordDetailSerializer(serializers.Serializer):
    intervention_type = serializers.CharField()
    session_id = serializers.IntegerField()
    started_at = serializers.DateTimeField(allow_null=True)
    routine_order = serializers.JSONField(allow_null=True)
    sounds = serializers.JSONField(allow_null=True)