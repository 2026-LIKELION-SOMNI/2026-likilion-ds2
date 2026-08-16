from django.urls import path

from . import views

app_name = "mypage"

urlpatterns = [
    path("tinnitus-profile-summary/<uuid:uuid>/", views.TinnitusProfileSummaryView.as_view(), name="tinnitus-profile-summary"),
]