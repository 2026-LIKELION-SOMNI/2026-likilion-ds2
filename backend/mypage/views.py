from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser
from tinnitus.models import PitchMatchSession
from soundfit.models import SoundFitProfile

from .models import NotificationSettings
from .serializers import (
    NotificationSettingsSerializer,
    TinnitusProfileSummarySerializer,
)


# 마이페이지 "내 이명 프로필" 카드 - tinnitus 결과 + soundfit 결과 통합 조회
class TinnitusProfileSummaryView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)

        matching_session = (
            PitchMatchSession.objects
            .filter(user=user, done=True, abandoned=False)
            .order_by("-completed_at")
            .first()
        )

        # soundfit은 완성 안 했을 수도 있으니 없으면 None 처리 (에러 아님)
        soundfit_profile = SoundFitProfile.objects.filter(user=user).first()

        data = {
            "tinnitus_type": matching_session.tinnitus_type if matching_session else None,
            "center_frequency": matching_session.center_frequency if matching_session else None,
            "lower_bound": matching_session.lower_bound if matching_session else None,
            "upper_bound": matching_session.upper_bound if matching_session else None,
            "texture": soundfit_profile.texture if soundfit_profile else None,
            "layer_mix": soundfit_profile.layer_mix if soundfit_profile else None,
        }

        return Response(TinnitusProfileSummarySerializer(data).data)


# F-1207~1208: 알림 설정 조회/저장
# 설정값 저장까지만 함 - 실제 알림 발송은 미구현
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