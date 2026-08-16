from rest_framework import serializers

from .models import NotificationSettings


class TinnitusProfileSummarySerializer(serializers.Serializer):
    # 마이페이지 '내 이명 프로필' 카드용 - tinnitus + soundfit 결과 합침

    # tinnitus 결과 
    tinnitus_type = serializers.CharField(allow_null=True)
    center_frequency = serializers.FloatField(allow_null=True)
    lower_bound = serializers.FloatField(allow_null=True)
    upper_bound = serializers.FloatField(allow_null=True)

    # soundfit 결과 
    texture = serializers.CharField(allow_null=True)
    layer_mix = serializers.CharField(allow_null=True)


class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = [
            "checkin_reminder_enabled",
            "checkin_reminder_time",
            "result_reminder_enabled",
            "result_reminder_time",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]