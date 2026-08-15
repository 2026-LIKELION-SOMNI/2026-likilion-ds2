from rest_framework import serializers

from .models import NightlyEvaluation


# 어젯밤 루틴 요약 박스 - relaxation 세션에서 가져오는 정보
class RelaxationRecapSerializer(serializers.Serializer):
    activity_type = serializers.CharField()
    activity_type_display = serializers.CharField()
    started_at = serializers.DateTimeField(allow_null=True)
    actual_duration_seconds = serializers.IntegerField(allow_null=True)
    status = serializers.CharField()


# 어젯밤 루틴 요약 박스 - sound 세션에서 가져오는 정보
class SoundRecapSerializer(serializers.Serializer):
    status = serializers.CharField()
    is_fallback = serializers.BooleanField()
    playback_started_at = serializers.DateTimeField(allow_null=True)
    total_played_seconds = serializers.IntegerField()


# NightlyEvaluation 조회 응답용 serializer
class NightlyEvaluationSerializer(serializers.ModelSerializer):
    relaxation_recap = serializers.SerializerMethodField()
    sound_recap = serializers.SerializerMethodField()

    class Meta:
        model = NightlyEvaluation

        # 프론트에 반환할 필드
        fields = [
            "id",
            "for_date",
            "status",
            "sleep_latency",
            "discomfort_after",
            "anxiety_after",
            "routine_helpfulness",
            "sound_reactions",
            "current_fatigue",
            "note",
            "relaxation_recap",
            "sound_recap",
            "created_at",
            "evaluated_at",
        ]

        read_only_fields = fields

    # 실제 relaxtion 세션을 조회해서 요약 정보 반환
    def get_relaxation_recap(self, obj):
        session = obj.get_relaxation_session()

        # 해당 밤에 이완 활동을 하지 않았다면 null 반환
        if session is None:
            return None

        return RelaxationRecapSerializer(
            {
                "activity_type": session.activity_type,
                "activity_type_display": session.get_activity_type_display(),
                "started_at": session.started_at,
                "actual_duration_seconds": session.actual_duration_seconds,
                "status": session.status,
            }
        ).data

    # 실제 사운드 세션을 조회해서 요약 정보 반환
    def get_sound_recap(self, obj):
        session = obj.get_sound_session()

        # 해당 밤에 사운드 세션이 없다면 null 반환
        if session is None:
            return None

        return SoundRecapSerializer(
            {
                "status": session.status,
                "is_fallback": session.is_fallback,
                "playback_started_at": session.playback_started_at,
                "total_played_seconds": session.total_played_seconds,
            }
        ).data


# 사용자가 다음날 평가 화면에서 입력한 값을 검증하는 serializer
class NightlyEvaluationSubmitRequestSerializer(serializers.Serializer):

    # 잠드는 데 걸린 시간
    sleep_latency = serializers.ChoiceField(
        choices=NightlyEvaluation.SleepLatency.choices,
        required=False,
        allow_null=True,
    )

    # 이명 불편도 1~5
    discomfort_after = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        allow_null=True,
    )

    # 불안 정도 1~5
    anxiety_after = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        allow_null=True,
    )

    # 추천된 수면 준비가 도움이 된 정도 1~5
    routine_helpfulness = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        allow_null=True,
    )

    # 사운드에 대한 복수 선택 반응
    sound_reactions = serializers.ListField(
        child=serializers.ChoiceField(
            choices=NightlyEvaluation.SoundReaction.choices,
        ),
        required=False,
        default=list,
    )

    # 현재 피로도 1~5
    current_fatigue = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        allow_null=True,
    )

    # 사용자가 자유롭게 입력하는 한 줄 메모
    note = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        default="",
    )