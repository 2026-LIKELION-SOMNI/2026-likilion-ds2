from django.urls import path

from .views import (
    DisclaimerConfirmView,
    OnboardingCompleteView,
    OnboardingStatusView,
    SafetyCheckView,
    TestPageView,
)

app_name = "onboarding"

urlpatterns = [
    path("disclaimer/", DisclaimerConfirmView.as_view(), name="disclaimer"),
    path("safety-check/<uuid:uuid>/", SafetyCheckView.as_view(), name="safety-check"),
    path("complete/<uuid:uuid>/", OnboardingCompleteView.as_view(), name="complete"),
    path("status/<uuid:uuid>/", OnboardingStatusView.as_view(), name="status"),
    path("test/", TestPageView.as_view(), name="test"),  # 테스트용~

]