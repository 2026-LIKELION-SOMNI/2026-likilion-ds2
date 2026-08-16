from rest_framework import serializers


class TinnitusProfileSummarySerializer(serializers.Serializer):
    # 마이페이지 '내 이명 프로필' 카드용 - tinnitus + soundfit 결과 합쳐서

    # tinnitus 결과 (PitchMatchSession)
    tinnitus_type = serializers.CharField(allow_null=True)
    center_frequency = serializers.FloatField(allow_null=True)
    lower_bound = serializers.FloatField(allow_null=True)
    upper_bound = serializers.FloatField(allow_null=True)

    # soundfit 결과 (SoundFitProfile)
    texture = serializers.CharField(allow_null=True)
    layer_mix = serializers.CharField(allow_null=True)