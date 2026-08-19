from django.urls import path

from .views import (
    NightlyEvaluationDetailView,
    NightlyEvaluationPendingListView,
    NightlyEvaluationSubmitView,
    NightlyEvaluationTodayView,
)

urlpatterns = [
    path("<uuid:uuid>/today/", NightlyEvaluationTodayView.as_view(), name="nightly-evaluation-today"),
    path("<uuid:uuid>/pending/", NightlyEvaluationPendingListView.as_view(), name="nightly-evaluation-pending"),
    path("<uuid:uuid>/<int:pk>/", NightlyEvaluationDetailView.as_view(), name="nightly-evaluation-detail"),
    path("<uuid:uuid>/<int:pk>/submit/", NightlyEvaluationSubmitView.as_view(), name="nightly-evaluation-submit"),
]