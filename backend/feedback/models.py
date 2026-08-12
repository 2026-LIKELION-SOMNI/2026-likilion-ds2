from django.apps import apps
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


# sound/relaxation 앱 미확정으로 인해 우선 소프트 참조로 개입. 추후 FK 구조로 개선 필요
class InterventionType(models.TextChoices):
    SOUND = "sound", "사운드"
    RELAXATION = "relaxation", "이완 활동"


# 사운드 도움 여부 평가
class SoundHelpfulness(models.TextChoices):
    HELPFUL = "helpful", "도움됨"
    NO_CHANGE = "no_change", "변화 없음"
    UNCOMFORTABLE = "uncomfortable", "불편함"


# 평가 진행 상태.
class EvaluationStatus(models.TextChoices):
    PENDING = "pending", "대기 중"                # 아직 평가/스킵 안 됨, 24시간 이내
    EVALUATED = "evaluated", "평가 완료"
    SKIPPED = "skipped", "건너뜀"                  # 사용자가 명시적으로 "평가 안 하기"
    EXPIRED = "expired", "미응답(24시간 경과)"       # 24시간 지나도록 응답 없음


# 개입 후 효과 평가(평가 강제하지 않음)
class InterventionEvaluation(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="intervention_evaluations",
    )

    # 소프트 참조: sound.SoundSession 또는 relaxation.RelaxationSession의 PK
    intervention_type = models.CharField(max_length=20, choices=InterventionType.choices)
    session_id = models.PositiveIntegerField(
        help_text="intervention_type에 해당하는 세션 모델의 PK (아직 실제 FK 아님)"
    )

    # 개입 후 이명 불편도 (1~5 척도)
    discomfort_after = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="개입 후 이명 불편도 (1~5)",
    )

    # 개입 후 긴장도 (1~5 척도)
    tension_after = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="개입 후 긴장도 (1~5)",
    )

    # 사운드/활동 도움 여부
    helpfulness = models.CharField(
        max_length=20, choices=SoundHelpfulness.choices, null=True, blank=True,
    )

    # 불편 요소 추가 피드백 (자유 텍스트, 선택 입력)
    discomfort_feedback = models.TextField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=EvaluationStatus.choices,
        default=EvaluationStatus.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)  # 평가 대상(=개입) row 생성 시각
    evaluated_at = models.DateTimeField(null=True, blank=True) #실제로 사용자가 입력(스킵 포함) 완료한 시각 

    class Meta:
        # 하나의 개입에 하나의 평가만 가능
        constraints = [
            models.UniqueConstraint(
                fields=["user", "intervention_type", "session_id"],
                name="feedback_one_evaluation_per_session",
            )
        ]
        indexes = [
            models.Index(fields=["user", "status"]),
        ]
        verbose_name = "개입 후 피드백"
        verbose_name_plural = "개입 후 피드백"

    def __str__(self):
        return (
            f"Evaluation({self.intervention_type}#{self.session_id}, "
            f"user={self.user_id}, status={self.status})"
        )

    # 소프트 참조 위해 작성_추후 삭제 예정
    def get_session(self):
        model_label = {
            InterventionType.SOUND: "sound.SoundSession",
            InterventionType.RELAXATION: "relaxation.RelaxationSession",
        }[self.intervention_type]
        Model = apps.get_model(model_label)
        return Model.objects.filter(pk=self.session_id).first()