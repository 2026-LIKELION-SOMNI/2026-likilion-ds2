from datetime import datetime

from django.shortcuts import get_object_or_404, render
from django.views import View
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser

from .models import CheckinRecord
from .serializers import CheckinRecordSerializer


# 야간 체크인 제출
class CheckinCreateView(APIView):
    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        serializer = CheckinRecordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# 가장 최근 체크인 조회
class CheckinLatestView(APIView):
    def get(self, request, uuid):
        get_object_or_404(AnonymousUser, uuid=uuid)
        record = CheckinRecord.objects.filter(user__uuid=uuid).first()
        if record is None:
            return Response({"detail": "체크인 기록이 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CheckinRecordSerializer(record).data)


class CheckinListView(APIView):
    def get(self, request, uuid):
        get_object_or_404(AnonymousUser, uuid=uuid)
        records = CheckinRecord.objects.filter(user__uuid=uuid)

        date_param = request.query_params.get("date")
        if date_param:
            try:
                target_date = datetime.strptime(date_param, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"detail": "date는 YYYY-MM-DD 형식이어야 합니다."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            records = records.filter(created_at__date=target_date)

        return Response(CheckinRecordSerializer(records, many=True).data)


# 테스트용!!
class TestPageView(View):
    def get(self, request):
        return render(request, "checkin/checkin_test.html")