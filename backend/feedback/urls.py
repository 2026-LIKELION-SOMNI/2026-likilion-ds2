from django.urls import path

from .views import NightlyEvaluationDetailView, NightlyEvaluationSubmitView, NightlyEvaluationTodayView

urlpatterns = [
    path("<uuid:uuid>/today/", NightlyEvaluationTodayView.as_view(), name="nightly-evaluation-today"),
    path("<uuid:uuid>/<int:pk>/", NightlyEvaluationDetailView.as_view(), name="nightly-evaluation-detail"),
    path("<uuid:uuid>/<int:pk>/submit/", NightlyEvaluationSubmitView.as_view(), name="nightly-evaluation-submit"),
]