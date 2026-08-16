from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser
from tinnitus.models import PitchMatchSession
from soundfit.models import SoundFitProfile

from .serializers import TinnitusProfileSummarySerializer


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

        # soundfit 진행 안 한 경우 고려 -> 없으면 None 처리 (에러 아님)
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