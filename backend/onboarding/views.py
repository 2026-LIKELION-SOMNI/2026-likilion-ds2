from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from accounts.models import AnonymousUser

from .models import OnboardingStatus, SafetyCheckResponse
from .serializers import (
    DisclaimerConfirmSerializer,
    OnboardingStatusSerializer,
    SafetyCheckResponseSerializer,
)


# F-103: 의료적 한계 고지 확인
@method_decorator(csrf_exempt, name="dispatch")
class DisclaimerConfirmView(APIView):
    def post(self, request):
        serializer = DisclaimerConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        onboarding_status = serializer.save()
        return Response(OnboardingStatusSerializer(onboarding_status).data, status=status.HTTP_200_OK)


# F-104~105 / F-107: 안전 확인 문항 응답 제출 + 분기 여부(need_doctor) 반환
@method_decorator(csrf_exempt, name="dispatch")
class SafetyCheckView(APIView):
    def post(self, request, uuid):
        user = get_object_or_404(AnonymousUser, uuid=uuid)
        serializer = SafetyCheckResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# 온보딩 완료 처리 (소개 → 고지 → 안전문항까지 끝났을 때 프론트에서 호출 가능하게 만들었어용)
@method_decorator(csrf_exempt, name="dispatch")
class OnboardingCompleteView(APIView):
    def post(self, request, uuid):
        get_object_or_404(AnonymousUser, uuid=uuid)
        onboarding_status, _ = OnboardingStatus.objects.get_or_create(user_id=uuid)
        onboarding_status.done = True
        onboarding_status.done_at = timezone.now()
        onboarding_status.save(update_fields=["done", "done_at"])
        return Response(OnboardingStatusSerializer(onboarding_status).data, status=status.HTTP_200_OK)


# 온보딩 진행 상태 조회 (재접속 시 어디까지 했는지 확인용)
class OnboardingStatusView(APIView):
    def get(self, request, uuid):
        onboarding_status = get_object_or_404(OnboardingStatus, user__uuid=uuid)
        return Response(OnboardingStatusSerializer(onboarding_status).data)

# 프론트 연동 전 백엔드 확인용 HTML
class TestPageView(View):
    def get(self, request):
        return render(request, "onboarding/onboarding_test.html")