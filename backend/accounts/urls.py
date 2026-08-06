from django.urls import path

from .views import ProfileView, ReconnectView, RegisterView

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/<uuid:user_uuid>/", ProfileView.as_view(), name="profile"),
    path("reconnect/", ReconnectView.as_view(), name="reconnect"),
]