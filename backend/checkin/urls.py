from django.urls import path

from .views import *

app_name = "checkin"

urlpatterns = [
    path("<uuid:uuid>/", CheckinCreateView.as_view(), name="create"),
    path("<uuid:uuid>/latest/", CheckinLatestView.as_view(), name="latest"),
    path("<uuid:uuid>/list/", CheckinListView.as_view(), name="list"),
    path("test/", TestPageView.as_view(), name="test"),
]