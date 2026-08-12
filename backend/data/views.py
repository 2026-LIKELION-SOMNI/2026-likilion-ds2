from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser
from checkin.models import CheckinRecord
from tinnitus.models import PitchMatchSession, TinnitusProfile


# F-1201: 연결된 데이터 상태 조회
class HealthConnectionView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        return Response({"health_data_connected": user.health_data_connected})


# F-1203: 건강 데이터 연결 해제
class HealthDisconnectView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        user.health_data_connected = False
        user.save(update_fields=["health_data_connected"])
        return Response({"health_data_connected": False})


# F-1205: 전체 데이터 삭제
# (uuid는 유지, 각 앱의 기록만 삭제 - REQ-F-26 기준)
class DeleteAllDataView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)

        deleted_counts = {}
        deleted_counts["checkin"], _ = CheckinRecord.objects.filter(user=user).delete()
        deleted_counts["tinnitus_profile"], _ = TinnitusProfile.objects.filter(user=user).delete()
        deleted_counts["pitch_match_sessions"], _ = PitchMatchSession.objects.filter(user=user).delete()
        # TODO: sound, feedback, personalization 앱 완성되면 여기에 삭제 로직 추가

        user.health_data_connected = False
        user.save(update_fields=["health_data_connected"])

        return Response({
            "deleted_records": deleted_counts,
            "health_data_connected": False,
        })