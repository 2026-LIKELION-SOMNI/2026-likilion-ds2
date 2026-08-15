import uuid

from django.db import models

from accounts.models import AnonymousUser


# 사운드 : REQ-F-16 ~ REQ-F-21
class SoundSession(models.Model):

    class Status(models.TextChoices):
        GENERATING = "generating", "생성 중"
        READY = "ready", "재생 준비 완료"
        GENERATION_FAILED = "generation_failed", "사운드 생성 실패"

        PLAYING = "playing", "재생 중"
        PAUSED = "paused", "일시정지"
        COMPLETED = "completed", "정상 종료"
        STOPPED_EARLY = "stopped_early", "중도 종료"
        DISCOMFORT_STOPPED = "discomfort_stopped", "불편 신고로 중단"

    class EndReason(models.TextChoices):
        TIMER = "timer", "종료 타이머"
        FADE_COMPLETE = "fade_complete", "페이드아웃 완료"
        USER_STOP = "user_stop", "사용자 즉시 종료"
        DISCOMFORT = "discomfort", "불편 신고"
        SLEEP_ONSET = "sleep_onset", "추정 입면 시각 도달"

    session_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )

    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="sound_sessions",
    )

    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.GENERATING,
    )

    # REQ-F-16
    # 사운드 생성 당시 사용된 사용자 상태를 그대로 보관
    input_snapshot = models.JSONField(
        help_text=(
            "이명 음역, 사운드 선호, 현재 불편도/긴장도, "
            "최근 수면·스트레스, 과거 도움/불편 평가 등"
        )
    )

    # 개인화 사운드 생성 결과
    # !!프론트 Web Audio API가 그대로 사용하는 파라미터
    generated_params = models.JSONField(
        null=True,
        blank=True,
        help_text=(
            "frequency_bands, sources, mix_ratio, "
            "modulation_intensity, duration_minutes, "
            "fade_out_seconds 등"
        ),
    )

    # 사용자가 변경한 내용을 포함해 실제 최종 재생된 사운드 설정
    final_params = models.JSONField(
        null=True,
        blank=True,
        help_text="사용자가 최종적으로 재생한 사운드 설정",
    )

    # 권장 재생시간
    recommended_duration_minutes = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    # False:개인화 사운드 사용 또는 생성 실패 후 아직 fallback을 선택하지 않은 상태
    # True: 사용자가 '예비 사운드로 시작하기'를 선택한 상태
    is_fallback = models.BooleanField(default=False)

    # 생성 실패 시 사용자에게 제시할 예비 사운드 후보
    fallback_sound = models.ForeignKey(
        "FallbackSound",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text=(
            "사용자 음역·선호와 가장 가까운 예비 사운드 후보. "
            "is_fallback=True인 경우 실제 재생에 사용되는 예비 사운드."
        ),
    )

    generation_error_code = models.CharField(
        max_length=64,
        blank=True,
    )

    # REQ-F-19 / F-20: 재생 이력
    playback_started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    playback_ended_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    total_played_seconds = models.PositiveIntegerField(
        default=0,
    )

    end_reason = models.CharField(
        max_length=32,
        choices=EndReason.choices,
        blank=True,
    )

    # 서비스에서 최초 재생 시 적용하는 gain
    initial_volume = models.FloatField(
        default=0.2,
        help_text="0.0~1.0, 최초 재생 시 적용하는 초기 gain 값",
    )

    # 사용자가 실제로 요청한 값 중 서비스 상한을 적용한 최댓값
    max_volume_applied = models.FloatField(
        null=True,
        blank=True,
    )

    # 불편 신고 후 다시 생성한 경우 새 SoundSession이 어떤 기존 세션에서 재생성되었는지 기록
    regenerated_from = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="regenerations",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "사운드 세션"
        verbose_name_plural = "사운드 세션 목록"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"],),
            models.Index(
                fields=["session_id"],
            ),
        ]

    def __str__(self):
        return f"SoundSession({self.session_id}, {self.status})"


# 실시간 개인화 사운드 생성 실패 시 즉시 재생할 수 있도록 미리 준비된 완성 오디오 파일
class FallbackSound(models.Model):

    name = models.CharField(
        max_length=100,
    )

    file_url = models.URLField(
        help_text="CDN/스토리지 상의 완성 오디오 파일 경로",
    )

    duration_seconds = models.PositiveIntegerField()

    loopable = models.BooleanField(
        default=True,
    )

    # 예비 사운드 선택 시 사용자의 이명 음역과 비교하기 위한 메타데이터
    matched_freq_min_hz = models.PositiveIntegerField(
        help_text="이 예비 사운드가 대응하는 이명 음역의 하한 Hz",
    )

    matched_freq_max_hz = models.PositiveIntegerField(
        help_text="이 예비 사운드가 대응하는 이명 음역의 상한 Hz",
    )

    # 주파수 외의 사운드 특성 비교용
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "예비 사운드의 특징 태그. "
            "예: ['pink_noise', 'rain', 'low_variation']"
        ),
    )

    # 운영 중인 fallback만 선택
    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "예비 사운드"
        verbose_name_plural = "예비 사운드 목록"

    def __str__(self):
        return self.name


# REQ-F-21
# 재생 중 사용자가 불편함을 신고한 기록
class SoundDiscomfortReport(models.Model):
    # 이유 선택
    class Reason(models.TextChoices):
        TOO_SIMILAR_TO_TINNITUS = (
            "too_similar",
            "이명과 너무 비슷함",
        )

        SHARP = (
            "sharp",
            "날카로움",
        )

        TOO_MUCH_VARIATION = (
            "too_much_variation",
            "변화가 많음",
        )

        DISLIKE_BACKGROUND = (
            "dislike_background",
            "배경음 불호",
        )
    # 후속 행동 선택
    class FollowUpAction(models.TextChoices):
        REGENERATE = (
            "regenerate",
            "다른 사운드로 바꾸기",
        )

        SWITCH_TO_PREVIOUS_COMFORTABLE = (
            "switch_previous",
            "이전에 편안했던 사운드로 전환",
        )

        END_SESSION = (
            "end_session",
            "오늘은 세션 마치기",
        )

    session = models.ForeignKey(
        SoundSession,
        on_delete=models.CASCADE,
        related_name="discomfort_reports",
    )

    # 복수 선택 가능
    reasons = models.JSONField(
        default=list,
        help_text="Reason 값의 리스트",
    )

    note = models.CharField(
        max_length=200,
        blank=True,
    )

    follow_up_action = models.CharField(
        max_length=32,
        choices=FollowUpAction.choices,
        null=True,
        blank=True,
    )

    reported_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "사운드 불편 신고"
        verbose_name_plural = "사운드 불편 신고 목록"
        ordering = ["-reported_at"]

    def __str__(self):
        return (
            f"DiscomfortReport("
            f"session={self.session_id}, "
            f"reasons={self.reasons})"
        )