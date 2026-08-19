from django.urls import path

from . import views

app_name = "tinnitus"

urlpatterns = [
    path("profile/<uuid:uuid>/", views.TinnitusProfileView.as_view(), name="profile"),
    path("matching/start/<uuid:uuid>/", views.MatchingStartView.as_view(), name="matching-start"),
    path("matching/select/<int:session_id>/", views.MatchingSelectView.as_view(), name="matching-select"),
    path("matching/previous/<int:session_id>/", views.MatchingPreviousView.as_view(), name="matching-previous"),
    path("matching/octave-check/<int:session_id>/", views.OctaveCheckView.as_view(), name="matching-octave-check"),
    path("matching/result/<uuid:uuid>/", views.MatchingResultView.as_view(), name="matching-result"),
    path("matching/volume-config/", views.MatchingVolumeConfigView.as_view(), name="matching-volume-config"),
    path("matching/abandon/<int:session_id>/", views.MatchingAbandonView.as_view(), name="matching-abandon"),
    path("matching/<int:session_id>/mixing-point/", views.MatchingMixingPointView.as_view(), name="matching-mixing-point"),
]