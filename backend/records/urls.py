from django.urls import path

from .views import (
    DailyRecordListView,
    InterventionRecordDetailView,
    PeriodTrendView,
    RecordInsightStatusView,
)

urlpatterns = [
    path("", DailyRecordListView.as_view(), name="record-list"),
    path("trends/", PeriodTrendView.as_view(), name="record-trends"),
    path("insight-status/", RecordInsightStatusView.as_view(), name="record-insight-status"),
    path("<int:pk>/", InterventionRecordDetailView.as_view(), name="record-detail"),
]