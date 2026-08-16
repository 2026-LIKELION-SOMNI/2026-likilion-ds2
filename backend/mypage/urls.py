from django.urls import path

from . import views

app_name = "mypage"

urlpatterns = [
    path("tinnitus-profile-summary/<uuid:uuid>/", views.TinnitusProfileSummaryView.as_view(), name="tinnitus-profile-summary"),
    path("notification-settings/<uuid:uuid>/", views.NotificationSettingsView.as_view(), name="notification-settings"),
]