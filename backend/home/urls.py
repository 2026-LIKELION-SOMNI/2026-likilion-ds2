from django.urls import path

from .views import HomeSummaryView

app_name = "home"

urlpatterns = [
    path("<uuid:uuid>/", HomeSummaryView.as_view(), name="summary"),
]