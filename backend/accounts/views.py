from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AnonymousUser, UsageRecord
from .serializers import AnonymousUserSerializer, ReconnectRequestSerializer, UsageRecordSerializer

#새로운 익명 사용자 생성 view
class RegisterView(APIView):
    def post(self, request):
        serializer = AnonymousUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        UsageRecord.objects.create(user=user, device_info=request.data.get("device_info", ""))
        return Response(AnonymousUserSerializer(user).data, status=status.HTTP_201_CREATED) #생성된 사용자 json 반환

#익명 사용자 프로필 view(조회, 수정)
class ProfileView(APIView):
    def get(self, request, user_uuid):
        user = get_object_or_404(AnonymousUser, uuid=user_uuid)
        return Response(AnonymousUserSerializer(user).data)

    def put(self, request, user_uuid):
        user = get_object_or_404(AnonymousUser, uuid=user_uuid)
        serializer = AnonymousUserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

#앱 재접속 시 기존 사용자 복구
class ReconnectView(APIView):
    def post(self, request):
        req = ReconnectRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        user = get_object_or_404(AnonymousUser, uuid=req.validated_data["uuid"])
        record = UsageRecord.objects.create(user=user, device_info=req.validated_data.get("device_info", "")) #이용 기록
        user.save(update_fields=["last_accessed_at"])
        return Response(
            {
                "profile": AnonymousUserSerializer(user).data,
                "usage_record": UsageRecordSerializer(record).data,
            },
            status=status.HTTP_200_OK,
        )