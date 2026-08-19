from django.urls import path

from . import views

app_name = "soundfit"

urlpatterns = [
    # 최초 시작 + "다시 측정하기" 버튼 둘 다 이 엔드포인트 재사용
    path("start/<uuid:uuid>/", views.SoundFitStartView.as_view(), name="start"),
    path("select/<int:session_id>/", views.SoundFitSelectView.as_view(), name="select"),
    path("previous/<int:session_id>/", views.SoundFitPreviousView.as_view(), name="previous"),
    path("profile/<uuid:uuid>/", views.SoundFitProfileView.as_view(), name="profile"),
]