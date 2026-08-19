from django.urls import path

from . import views

app_name = "relaxtion"

urlpatterns = [
    path("<uuid:uuid>/recommendation/", views.RelaxationRecommendationView.as_view(), name="recommendation"),
    path("<uuid:uuid>/sessions/<uuid:session_id>/start/", views.RelaxationSessionStartView.as_view(), name="session-start"),
    path("<uuid:uuid>/sessions/<uuid:session_id>/skip/", views.RelaxationSessionSkipView.as_view(), name="session-skip"),
    path("<uuid:uuid>/sessions/<uuid:session_id>/cancel/", views.RelaxationSessionCancelView.as_view(), name="session-cancel"),
    path("<uuid:uuid>/sessions/<uuid:session_id>/complete/", views.RelaxationSessionCompleteView.as_view(), name="session-complete"),
]