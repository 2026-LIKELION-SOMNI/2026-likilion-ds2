from rest_framework import serializers

from .models import SoundFitProfile, SoundFitSession


class SoundFitSessionSerializer(serializers.ModelSerializer):
    option_a = serializers.SerializerMethodField()
    option_b = serializers.SerializerMethodField()

    class Meta:
        model = SoundFitSession
        fields = [
            "id",
            "round_number",
            "current_axis",
            "option_a",
            "option_b",
            "texture",
            "layer_mix",
            "confirm_started",
            "done",
            "created_at",
            "completed_at",
        ]

    def get_option_a(self, obj):
        if obj.done:
            return None
        from .services import _current_round_options
        a, _ = _current_round_options(obj)
        return a

    def get_option_b(self, obj):
        if obj.done:
            return None
        from .services import _current_round_options
        _, b = _current_round_options(obj)
        return b


class SoundFitSelectSerializer(serializers.Serializer):
    selected = serializers.ChoiceField(choices=["A", "B"])


class SoundFitProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoundFitProfile
        fields = ["texture", "layer_mix", "created_at", "updated_at"]