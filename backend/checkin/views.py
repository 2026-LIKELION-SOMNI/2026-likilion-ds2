from django.shortcuts import get_object_or_404, render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views import View  

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
        record = CheckinRecord.objects.filter(user__uuid=uuid).first()  # ordering이 -created_at이라 first()가 최신
        if record is None:
            return Response({"detail": "체크인 기록이 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CheckinRecordSerializer(record).data)


# 날짜별 체크인 기록 목록 조회
class CheckinListView(APIView):
    def get(self, request, uuid):
        get_object_or_404(AnonymousUser, uuid=uuid)
        records = CheckinRecord.objects.filter(user__uuid=uuid)
        return Response(CheckinRecordSerializer(records, many=True).data)

# 테스트용!!     
class TestPageView(View):
    def get(self, request):
        return render(request, "checkin/checkin_test.html")