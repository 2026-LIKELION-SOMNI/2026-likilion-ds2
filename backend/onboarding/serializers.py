from django.utils import timezone
from rest_framework import serializers

from .models import OnboardingStatus, SafetyCheckResponse

#재접속 요청이 실제 UUID 형식인지 검사 + 고지 확인 처리
class DisclaimerConfirmSerializer(serializers.Serializer):
    uuid = serializers.UUIDField()

    def save(self):
        status_obj, _ = OnboardingStatus.objects.get_or_create(user_id=self.validated_data["uuid"])
        status_obj.confirmed = True
        status_obj.confirmed_at = timezone.now()
        status_obj.save(update_fields=["confirmed", "confirmed_at"])
        return status_obj

#온보딩 진행 상태 JSON 변환
class OnboardingStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingStatus
        fields = ["confirmed", "confirmed_at", "done", "done_at"]
        read_only_fields = ["confirmed_at", "done_at"] 

#안전 문항 응답 JSON 변환
class SafetyCheckResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyCheckResponse
        fields = ["hearing_loss", "one_sided", "pulse_sound", "dizziness", "need_doctor", "created_at"]
        read_only_fields = ["need_doctor", "created_at"] 