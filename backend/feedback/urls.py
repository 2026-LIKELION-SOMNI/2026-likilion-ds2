from django.urls import path

from . import views

app_name = "feedback"

urlpatterns = [
    # F-901~F-904: 개입 종료 직후 평가 화면 제출
    path(
        "feedback/<str:intervention_type>/<int:session_id>/",
        views.InterventionEvaluationCreateView.as_view(),
        name="evaluation-create",
    ),
    # F-905: 다음 접속 시 보여줄 미평가(지연) 목록
    path(
        "feedback/pending/",
        views.PendingEvaluationListView.as_view(),
        name="evaluation-pending-list",
    ),
    # F-905: 지연 평가 제출
    path(
        "feedback/<int:pk>/",
        views.DelayedEvaluationSubmitView.as_view(),
        name="evaluation-update",
    ),
    # 명시적 건너뛰기
    path(
        "feedback/<int:pk>/skip/",
        views.SkipEvaluationView.as_view(),
        name="evaluation-skip",
    ),


]