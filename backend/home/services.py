import datetime

from checkin.models import CheckinRecord
from feedback.models import NightlyEvaluation
from personalization.models import InterventionDecision
from sound.models import SoundSession
from sound import services as sound_services

# 신규 사용자 여부 (checkin 이력이 한 번도 없는 경우)
def is_new_user(user) -> bool:
    return not CheckinRecord.objects.filter(user=user).exists()


# 오늘 체크인 여부
def has_checked_in_today(user) -> bool:
    today = datetime.date.today()  # USE_TZ=False라 timezone.localdate() 대신 사용
    return CheckinRecord.objects.filter(user=user, created_at__date=today).exists()


# 어제 세션 등 미평가(PENDING) 기록이 있는지 여부
def has_pending_evaluation(user) -> bool:
    return NightlyEvaluation.objects.filter(
        user=user,
        status=NightlyEvaluation.Status.PENDING,
    ).exists()


# 오늘의 루틴 요약 (가장 최근 InterventionDecision 기반)
def get_today_routine_summary(user) -> dict | None:
    decision = (
        InterventionDecision.objects
        .filter(user=user)
        .order_by("-decided_at")
        .first()
    )

    if decision is None:
        return None

    state_snapshot = decision.state_snapshot or {}

    # 실제로 생성/변경된 최신 사운드 세션을 우선 사용
    latest_sound_session = (
        SoundSession.objects
        .filter(user=user)
        .order_by("-created_at")
        .first()
    )

    if latest_sound_session is not None:
        sound_summary = (
            sound_services.build_sound_summary_label(
                latest_sound_session
            )
        )
    else:
        # 아직 SoundSession이 없을 때만
        # personalization의 추천 전략 사용
        sound_summary = (
            sound_services.build_summary_label_from_strategy(
                decision.sound_strategy or {}
            )
        )

    return {
        "intervention_type": decision.intervention_type,
        "relaxation_activity_type": decision.relaxation_activity_type,
        "tinnitus_discomfort": state_snapshot.get("tinnitus_discomfort"),
        "anxiety": state_snapshot.get("anxiety"),
        "stress": state_snapshot.get("stress"),
        "sound_summary": sound_summary,
    }

# 편안했던 사운드 카드 (sound 앱 로직 재사용)
def get_comfortable_sound(user) -> dict | None:
    result = sound_services.get_latest_comfortable_session(user)

    if result is None:
        return None

    return {
        "session_id": result["session"].session_id,
        "sound_summary": sound_services.build_sound_summary_label(result["session"]),
        "evaluated_at": result["evaluated_at"],
    }


# 홈 화면 전체 요약 조합
def build_home_summary(user) -> dict:
    return {
        "is_new_user": is_new_user(user),
        "has_checked_in_today": has_checked_in_today(user),
        "has_pending_evaluation": has_pending_evaluation(user),
        "today_routine": get_today_routine_summary(user),
        "comfortable_sound": get_comfortable_sound(user),
    }