from datetime import timedelta

from django.apps import apps
from django.utils import timezone

from feedback.models import EvaluationStatus, InterventionEvaluation

# F-1106: 기록 최소 기준
INSIGHT_WINDOW_DAYS = 7
MIN_RECORDS_FOR_INSIGHT = 3

#sound/relaxtion 미구현으로 우선 소프트 참조로 feedback의 실제 세션 객체를 가져와 필요 필드만 뽑음
def get_intervention_detail(evaluation):
    session = evaluation.get_session()
    if session is None:
        return None

    return {
        "started_at": getattr(session, "started_at", None), #개입 시작 시간
        "routine_order": getattr(session, "routine_order", None), #루틴 순서
        "sounds": getattr(session, "sounds", None), #사운드 목록
    }

#최근 14일간 이명 불편도 추이 + 수면 변화
def get_period_trend(user, days=14):
    since = timezone.now() - timedelta(days=days)

    discomfort_trend = list(
        InterventionEvaluation.objects.filter(
            user=user,
            status=EvaluationStatus.EVALUATED,
            evaluated_at__gte=since,
            discomfort_after__isnull=False,
        )
        .order_by("evaluated_at")
        .values("evaluated_at", "discomfort_after")
    )

    return {
        "discomfort_trend": discomfort_trend,
        "sleep_trend": _get_sleep_trend(user, since),
    }

#사용자가 직접 입력한 수면 시간 가져오기
def _get_sleep_trend(user, since):
    try:
        CheckinRecord = apps.get_model("checkin", "CheckinRecord")
    except LookupError:
        return []

    return list(
        CheckinRecord.objects.filter(
            user=user,
            created_at__gte=since,
            sleep_hours__isnull=False,
        )
        .order_by("created_at")
        .values("created_at", "sleep_hours")
    )

#최소 기준(최근 7일간 3건 미만일 시 기록 부족)
def has_enough_records_for_insight(user):
    since = timezone.now() - timedelta(days=INSIGHT_WINDOW_DAYS)
    count = InterventionEvaluation.objects.filter(
        user=user,
        status=EvaluationStatus.EVALUATED,
        evaluated_at__gte=since,
    ).count()
    return count >= MIN_RECORDS_FOR_INSIGHT