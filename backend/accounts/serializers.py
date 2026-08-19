from rest_framework import serializers

from .models import AnonymousUser, UsageRecord

#익명 사용자 데이터 JOSN 변환
class AnonymousUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnonymousUser
        fields = ["uuid", "nickname", "health_data_connected", "created_at", "last_accessed_at"]
        read_only_fields = ["uuid", "created_at", "last_accessed_at"] #프론트가 수정 불가능하도록 막음

#접속 기록 JSON 변환
class UsageRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageRecord
        fields = ["id", "user", "accessed_at", "device_info"]
        read_only_fields = ["id", "accessed_at"]

#재접속 요청이 실제 UUID 형식인지 검사
class ReconnectRequestSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()
    device_info = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")