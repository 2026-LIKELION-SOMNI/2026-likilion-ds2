from django.urls import path

from . import views

app_name = "sound"

urlpatterns = [
    path(
        "<uuid:uuid>/generate-today/",
        views.GenerateTodaySoundView.as_view(),
        name="generate-today",
    ),
    path(
        "<uuid:uuid>/sessions/<uuid:session_id>/",
        views.SoundSessionDetailView.as_view(),
        name="session-detail",
    ),
    path(
        "<uuid:uuid>/sessions/<uuid:session_id>/regenerate/",
        views.RegenerateSoundView.as_view(),
        name="session-regenerate",
    ),
    path(
        "<uuid:uuid>/sessions/<uuid:session_id>/use-fallback/",
        views.UseFallbackSoundView.as_view(),
        name="session-use-fallback",
    ),
    path(
        "<uuid:uuid>/sessions/<uuid:session_id>/playback/",
        views.SoundPlaybackView.as_view(),
        name="session-playback",
    ),
    path(
        "<uuid:uuid>/sessions/<uuid:session_id>/volume/",
        views.SoundVolumeView.as_view(),
        name="session-volume",
    ),
    path(
        "<uuid:uuid>/sessions/<uuid:session_id>/discomfort-reports/",
        views.SoundDiscomfortReportView.as_view(),
        name="session-discomfort-report",
    ),
    path(
        "<uuid:uuid>/sessions/<uuid:session_id>/mixing-point/",
        views.SoundMixingPointView.as_view(),
        name="session-mixing-point",
    ),
]