from rest_framework import serializers

from .models import (
    FallbackSound,
    SoundDiscomfortReport,
    SoundSession,
)


class FallbackSoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = FallbackSound
        fields = [
            "id",
            "name",
            "file_url",
            "duration_seconds",
            "loopable",
            "tags",
        ]


# 사운드 세션 결과 응답
class SoundSessionResultSerializer(serializers.ModelSerializer):

    fallback_sound = FallbackSoundSerializer(
        read_only=True
    )

    class Meta:
        model = SoundSession
        fields = [
            "session_id",
            "status",

            # 개인화 사운드 생성 결과
            "generated_params",

            # 사용자가 변경한 내용을 포함한 실제 최종 재생 설정
            "final_params",

            "recommended_duration_minutes",

            # fallback
            "is_fallback",
            "fallback_sound",
            "generation_error_code",

            # 재생 / 볼륨
            "initial_volume",
            "max_volume_applied",

            "created_at",
        ]


# 오늘의 사운드 생성 요청
class GenerateTodaySoundRequestSerializer(serializers.Serializer):

    force_regenerate = serializers.BooleanField(
        default=False,
        required=False,
    )


# 사용자가 최종 선택한 배경 자연음
# 실제 오디오 변경은 프론트(Web Audio API)에서 수행
class SoundBackgroundUpdateSerializer(serializers.Serializer):

    background = serializers.ChoiceField(
        choices=[
            "rain",
            "stream",
            "ocean",
            "air",
        ]
    )


# 재생 시작 / 일시정지 / 재개 / 종료 상태 갱신.
class SoundPlaybackUpdateSerializer(serializers.Serializer):

    action = serializers.ChoiceField(
        choices=[
            "start",
            "pause",
            "resume",
            "stop",
            "complete",
        ]
    )

    played_seconds_delta = serializers.IntegerField(
        required=False,
        min_value=0,
        default=0,
    )

    end_reason = serializers.ChoiceField(
        choices=SoundSession.EndReason.choices,
        required=False,
        allow_blank=True,
    )


#사용자가 요청한 볼륨 값 검증 (상한 적용)
class SoundVolumeUpdateSerializer(serializers.Serializer):

    volume = serializers.FloatField(
        min_value=0.0,
        max_value=1.0,
    )


# 사운드 불편 이유와 사용자가 선택한 후속 행동
class SoundDiscomfortReportSerializer(serializers.ModelSerializer):
    # 후속 행동
    follow_up_action = serializers.ChoiceField(
        choices=SoundDiscomfortReport.FollowUpAction.choices,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = SoundDiscomfortReport
        fields = [
            "id",
            "reasons",
            "note",
            "follow_up_action",
            "reported_at",
        ]

        read_only_fields = [
            "id",
            "reported_at",
        ]
    # 불편 이유
    def validate_reasons(self, value):
        valid = {
            choice
            for choice, _ in SoundDiscomfortReport.Reason.choices
        }

        if not value:
            raise serializers.ValidationError(
                "불편 이유를 하나 이상 선택해야 합니다."
            )

        if not set(value).issubset(valid):
            raise serializers.ValidationError(
                f"reasons는 {sorted(valid)} 중에서 선택해야 합니다."
            )

        return value