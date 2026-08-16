from django.urls import path

from .views import (
    InterventionDecisionView,
    LatestInterventionDecisionView,
    RefreshPersonalizationProfileView,
    UserPersonalizationProfileView,
)


urlpatterns = [
    path("<uuid:uuid>/decision/",InterventionDecisionView.as_view(),name="personalization-decision",),
    path("<uuid:uuid>/decision/latest/",LatestInterventionDecisionView.as_view(),name="personalization-decision-latest",),
    path("<uuid:uuid>/profile/",UserPersonalizationProfileView.as_view(),name="personalization-profile",),
    path("<uuid:uuid>/profile/refresh/",RefreshPersonalizationProfileView.as_view(),name="personalization-profile-refresh",),
]