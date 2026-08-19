import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import AnonymousUser


class RelaxationType(models.TextChoices):
    # 핵심 개입 3종
    THOUGHT_DISTANCING = "thought_distancing", "생각 거리두기"
    TENSION_RELEASE = "tension_release", "30초 긴장 해제"
    ATTENTION_SHIFT = "attention_shift", "1분 주의 옮기기"
    NONE = "none", "개입 없음"


# 이완/주의전환 : REQ-F-22 (F-801 ~ F-805)
class RelaxationSession(models.Model):

    class Status(models.TextChoices):
        RECOMMENDED = "recommended", "추천됨(시작 전)"
        IN_PROGRESS = "in_progress", "진행중"
        COMPLETED = "completed", "완료"
        SKIPPED = "skipped", "건너뜀" # 개입 시작 전 건너뛰기 기능
        CANCELLED = "cancelled", "중단" # 개입 시작 후 중단 기능

    class RecommendationSource(models.TextChoices):
        RULE_BASED = "rule_based", "규칙 기반"
        PERSONALIZED = "personalized", "개인화(과거 결과 반영)"

    # 외부 API에서 사용하는 세션 식별자
    session_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )

    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="relaxation_sessions",
    )

    # 오늘 추천된 수면 준비 종류 (NONE도 추천 결과 이력을 남기기 위해 저장)
    activity_type = models.CharField(
        max_length=32,
        choices=RelaxationType.choices,
        db_index=True,
    )

    # 어떤 방식으로 최종 추천되었는지 기록
    recommendation_source = models.CharField(
        max_length=16,
        choices=RecommendationSource.choices,
        default=RecommendationSource.RULE_BASED,
    )

    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.RECOMMENDED,
        db_index=True,
    )


    # 추천 시점 사용자 상태 스냅샷
    # checkin 값을 그대로 복제하여 저장

    tinnitus_discomfort = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )

    anxiety = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )

    stress = models.BooleanField(
        default=False,
    )

    fatigue = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )

    caffeine = models.BooleanField(
        default=False,
    )


    # 추천 레코드가 생성된 시각
    recommended_at = models.DateTimeField(
        auto_now_add=True,
    )

    # 실제 이완 개입을 시작한 시각
    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # 정상 완료 / 건너뜀 / 중단 등 해당 relaxation 흐름이 끝난 시각
    ended_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "이완 세션"
        verbose_name_plural = "이완 세션 목록"

        ordering = [
            "-recommended_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "-recommended_at",
                ]
            ),
            models.Index(
                fields=[
                    "user",
                    "activity_type",
                    "status",
                ]
            ),
        ]

    def __str__(self):
        return (
            f"RelaxationSession("
            f"{self.session_id}, "
            f"{self.activity_type}, "
            f"{self.status})"
        )