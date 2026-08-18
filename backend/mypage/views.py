from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser
from tinnitus.models import PitchMatchSession, TinnitusProfile
from soundfit.models import SoundFitProfile
from personalization.models import InterventionDecision, UserPersonalizationProfile

from .models import NotificationSettings
from .serializers import (
    NotificationSettingsSerializer,
    TinnitusProfileSummarySerializer,
)


# 마이페이지 "내 이명 프로필" 카드 - tinnitus 결과 + soundfit 결과 통합 조회
class TinnitusProfileSummaryView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)

        # [추가] tone_type("삐- 소리" 등 표시 문구용) - TinnitusProfile에서 가져옴
        # tinnitus_type("tonal"/"noise_like")과 별개 값이라 별도로 조회해야 함
        tinnitus_profile = TinnitusProfile.objects.filter(user=user).first()

        matching_session = (
            PitchMatchSession.objects
            .filter(user=user, done=True, abandoned=False)
            .order_by("-completed_at")
            .first()
        )

        # soundfit은 완성 안 했을 수도 있으니 없으면 None 처리 (에러 아님)
        soundfit_profile = SoundFitProfile.objects.filter(user=user).first()

        data = {
            "tone_type": tinnitus_profile.tone_type if tinnitus_profile else None,
            "tinnitus_type": matching_session.tinnitus_type if matching_session else None,
            "center_frequency": matching_session.center_frequency if matching_session else None,
            "lower_bound": matching_session.lower_bound if matching_session else None,
            "upper_bound": matching_session.upper_bound if matching_session else None,
            "texture": soundfit_profile.texture if soundfit_profile else None,
            "layer_mix": soundfit_profile.layer_mix if soundfit_profile else None,
        }

        return Response(TinnitusProfileSummarySerializer(data).data)


# F-1207~1208: 알림 설정 조회/저장
# 설정값 저장까지만 함 - 실제 발송(Web Push 등)은 이번 스코프에서 미구현, 로드맵으로 미룸
class NotificationSettingsView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        settings_obj, _ = NotificationSettings.objects.get_or_create(user=user)
        return Response(NotificationSettingsSerializer(settings_obj).data)

    def put(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        settings_obj, _ = NotificationSettings.objects.get_or_create(user=user)
        serializer = NotificationSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# F-1206: 개인화 기준 초기화
# personalization의 누적 학습 데이터(가중치, 결정 이력)만 초기화.
# checkin/tinnitus 등 다른 앱 기록은 안 건드림 (그건 F-1205 전체 삭제의 역할)
class ResetPersonalizationView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)

        deleted_counts = {}
        deleted_counts["intervention_decisions"], _ = InterventionDecision.objects.filter(user=user).delete()
        deleted_counts["personalization_profile"], _ = UserPersonalizationProfile.objects.filter(user=user).delete()

        return Response({
            "detail": "개인화 기준이 초기화되었습니다.",
            "deleted_records": deleted_counts,
        })