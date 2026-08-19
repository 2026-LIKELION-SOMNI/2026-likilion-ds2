from rest_framework import serializers


# 오늘의 루틴 요약 (personalization의 최근 InterventionDecision 기반)
class TodayRoutineSummarySerializer(serializers.Serializer):
    intervention_type = serializers.CharField(allow_null=True)
    relaxation_activity_type = serializers.CharField(allow_null=True)
    tinnitus_discomfort = serializers.IntegerField(allow_null=True)
    anxiety = serializers.IntegerField(allow_null=True)
    stress = serializers.BooleanField(allow_null=True)
    sound_summary = serializers.CharField(allow_null=True)  # "잔잔한 빗소리 + 핑크노이즈"


# 편안했던 사운드 카드 (sound의 HomeComfortableSoundView와 동일한 형태)
class ComfortableSoundSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(allow_null=True)
    sound_summary = serializers.CharField(allow_null=True)
    evaluated_at = serializers.DateTimeField(allow_null=True)


# 홈 화면 통합 조회 응답
class HomeSummarySerializer(serializers.Serializer):
    # 화면 상태 판단용 플래그
    is_new_user = serializers.BooleanField()          # checkin 이력 0건
    has_checked_in_today = serializers.BooleanField()  # 오늘 checkin 여부
    has_pending_evaluation = serializers.BooleanField()  # 어제 세션 미평가 여부

    # 체크인 후에만 값이 채워짐
    today_routine = TodayRoutineSummarySerializer(allow_null=True)

    # 항상 포함 (없으면 null)
    comfortable_sound = ComfortableSoundSerializer(allow_null=True)