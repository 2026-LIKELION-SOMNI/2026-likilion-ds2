from django.urls import path

from . import views

app_name = "data"

urlpatterns = [
    path("health-connection/<uuid:uuid>/", views.HealthConnectionView.as_view(), name="health-connection"),
    path("health-connection/<uuid:uuid>/disconnect/", views.HealthDisconnectView.as_view(), name="health-disconnect"),
    path("delete-all/<uuid:uuid>/", views.DeleteAllDataView.as_view(), name="delete-all"),
]