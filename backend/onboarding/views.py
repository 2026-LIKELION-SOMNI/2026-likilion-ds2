from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views import View
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AnonymousUser

from .models import OnboardingStatus, SafetyCheckResponse
from .serializers import (
    DisclaimerConfirmSerializer,
    OnboardingStatusSerializer,
    SafetyCheckResponseSerializer,
)


# F-103: 의료적 한계 고지 확인
class DisclaimerConfirmView(APIView):
    def post(self, request):
        serializer = DisclaimerConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 존재하지 않는 uuid면 500(IntegrityError) 대신 404를 반환하도록 먼저 유저 확인
        user = get_object_or_404(AnonymousUser, uuid=serializer.validated_data["uuid"])

        onboarding_status, _ = OnboardingStatus.objects.get_or_create(user=user)
        onboarding_status.confirmed = True
        onboarding_status.confirmed_at = timezone.now()
        onboarding_status.save(update_fields=["confirmed", "confirmed_at"])
        return Response(OnboardingStatusSerializer(onboarding_status).data, status=status.HTTP_200_OK)


# F-104~105 / F-107: 안전 확인 문항 응답 제출 + 분기 여부(need_doctor) 반환
class SafetyCheckView(APIView):
    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        serializer = SafetyCheckResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# 온보딩 완료 처리 (소개 → 고지 → 안전문항까지 끝났을 때 프론트에서 호출 가능하게 만들었어용)
class OnboardingCompleteView(APIView):
    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        onboarding_status, _ = OnboardingStatus.objects.get_or_create(user=user)
        onboarding_status.done = True
        onboarding_status.done_at = timezone.now()
        onboarding_status.save(update_fields=["done", "done_at"])
        return Response(OnboardingStatusSerializer(onboarding_status).data, status=status.HTTP_200_OK)


# 온보딩 진행 상태 조회 (재접속 시 어디까지 했는지 확인용)
class OnboardingStatusView(APIView):
    def get(self, request, uuid):
        onboarding_status = get_object_or_404(OnboardingStatus, user__uuid=uuid)
        return Response(OnboardingStatusSerializer(onboarding_status).data)


# 테스트용 화면 (프론트 연동 전 백엔드 단독 확인용)
class TestPageView(View):
    def get(self, request):
        return render(request, "onboarding/onboarding_test.html")