from rest_framework import serializers

from .models import NightlyEvaluation


# 자연음 태그 -> 화면 표시용 라벨
BACKGROUND_LABELS = {
    "rain": "잔잔한 빗소리",
    "stream": "시냇물 소리",
    "ocean": "느린 파도",
    "air": "팬·공기음",
}


# 사운드 세션의 최종 설정을 이용해
# "잔잔한 빗소리 + 핑크노이즈" 형태의 요약 문구 생성
def _build_sound_summary_label(session):
    # fallback 사운드를 실제 사용한 경우
    if session.is_fallback and session.fallback_sound:
        return session.fallback_sound.name

    params = (
        session.final_params
        or session.generated_params
        or {}
    )

    sources = params.get(
        "sources",
        [],
    )

    background_tag = None
    has_pink_noise = False

    for source in sources:
        if not isinstance(source, dict):
            continue

        # 배경 자연음
        if source.get("type") == "background":
            background_tag = source.get(
                "asset_tag"
            )

        # 이명 마스킹용 핑크노이즈
        if (
            source.get("role")
            == "tinnitus_masking"
            and source.get("waveform")
            == "pink_noise"
        ):
            has_pink_noise = True

    # 자연음 정보가 없는 경우
    if background_tag is None:
        return None

    background_label = (
        BACKGROUND_LABELS.get(
            background_tag,
            background_tag,
        )
    )

    if has_pink_noise:
        return (
            f"{background_label} + 핑크노이즈"
        )

    return background_label


# 어젯밤 루틴 요약 박스 - relaxation 세션에서 가져오는 정보
class RelaxationRecapSerializer(serializers.Serializer):
    activity_type = serializers.CharField()
    activity_type_display = serializers.CharField()
    started_at = serializers.DateTimeField(
        allow_null=True
    )
    status = serializers.CharField()


# 어젯밤 루틴 요약 박스 - sound 세션에서 가져오는 정보
class SoundRecapSerializer(serializers.Serializer):
    status = serializers.CharField()
    is_fallback = serializers.BooleanField()
    playback_started_at = serializers.DateTimeField(
        allow_null=True
    )
    total_played_seconds = serializers.IntegerField()

    # 화면 상단에 표시할 사운드 조합
    sound_summary = serializers.CharField(
        allow_null=True
    )


# NightlyEvaluation 조회 응답용 serializer
class NightlyEvaluationSerializer(
    serializers.ModelSerializer
):
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
        session = obj.relaxation_session

        # 해당 밤에 이완 활동을 하지 않았다면 null 반환
        if session is None:
            return None

        return RelaxationRecapSerializer(
            {
                "activity_type": (
                    session.activity_type
                ),
                "activity_type_display": (
                    session
                    .get_activity_type_display()
                ),
                "started_at": (
                    session.started_at
                ),
                "status": session.status,
            }
        ).data

    # 실제 사운드 세션을 조회해서 요약 정보 반환
    def get_sound_recap(self, obj):
        session = obj.sound_session

        # 해당 밤에 사운드 세션이 없다면 null 반환
        if session is None:
            return None

        return SoundRecapSerializer(
            {
                "status": session.status,
                "is_fallback": (
                    session.is_fallback
                ),
                "playback_started_at": (
                    session.playback_started_at
                ),
                "total_played_seconds": (
                    session.total_played_seconds
                ),
                "sound_summary": (
                    _build_sound_summary_label(
                        session
                    )
                ),
            }
        ).data


# 사용자가 다음날 평가 화면에서 입력한 값을 검증하는 serializer
class NightlyEvaluationSubmitRequestSerializer(
    serializers.Serializer
):

    # 잠드는 데 걸린 시간
    sleep_latency = serializers.ChoiceField(
        choices=(
            NightlyEvaluation
            .SleepLatency
            .choices
        ),
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
            choices=(
                NightlyEvaluation
                .SoundReaction
                .choices
            ),
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