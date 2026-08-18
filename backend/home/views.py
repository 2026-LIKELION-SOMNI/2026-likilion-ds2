from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser

from . import services
from .serializers import HomeSummarySerializer


# 홈 화면 상태 통합 조회
class HomeSummaryView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        summary = services.build_home_summary(user)
        return Response(HomeSummarySerializer(summary).data)