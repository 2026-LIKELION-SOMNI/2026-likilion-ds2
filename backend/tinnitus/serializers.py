from rest_framework import serializers

from .models import OccurrenceTime, PitchMatchSession, ToneType, TinnitusProfile


class TinnitusProfileSerializer(serializers.ModelSerializer):
    occurrence_times = serializers.ListField(
        child=serializers.ChoiceField(choices=OccurrenceTime.choices),
        required=False,
        default=list,
        help_text="OccurrenceTime 값들의 리스트 (다중 선택)",
    )

    class Meta:
        model = TinnitusProfile
        fields = [
            "tone_type",
            "primary_tone_type",
            "location",
            "occurrence_times",
            "existing_coping",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        tone_type = attrs.get("tone_type", getattr(self.instance, "tone_type", None))
        primary = attrs.get("primary_tone_type", getattr(self.instance, "primary_tone_type", None))

        if tone_type == ToneType.MULTIPLE:
            if primary and primary not in (ToneType.BEEP, ToneType.HUM, ToneType.HISS):
                raise serializers.ValidationError(
                    {"primary_tone_type": "복합형의 대표 소리는 high/low/wide 중 하나여야 합니다."}
                )
        elif primary:
            raise serializers.ValidationError(
                {"primary_tone_type": "tone_type이 multiple이 아니면 설정할 수 없습니다."}
            )
        return attrs


class MatchingSelectSerializer(serializers.Serializer):
    selected = serializers.ChoiceField(choices=["A", "B"])


class OctaveCheckSerializer(serializers.Serializer):
    selected = serializers.ChoiceField(choices=["half", "same", "double"])


class PitchMatchSessionSerializer(serializers.ModelSerializer):
    octave_test = serializers.SerializerMethodField()
    bandwidth_octave = serializers.ReadOnlyField()

    class Meta:
        model = PitchMatchSession
        fields = [
            "id",
            "tinnitus_type",
            "bandwidth_octave",
            "round_number",
            "range_min",
            "range_max",
            "freq_a",
            "freq_b",
            "done",
            "octave_test_started",
            "octave_test",
            "center_frequency",
            "lower_bound",
            "upper_bound",
            "octave_corrected",
            "octave_check_limited",
            "created_at",
            "completed_at",
        ]

    def get_octave_test(self, obj):
        # 7라운드 완료 직후, 아직 octave 선택 전 상태에서만 후보 노출
        if obj.octave_test_started and obj.octave_selection is None and obj.provisional_center:
            from .services.pitch_matching import octave_test_candidates
            return octave_test_candidates(obj.provisional_center)
        return None