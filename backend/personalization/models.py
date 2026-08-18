from django.db import models

from accounts.models import AnonymousUser


# 오늘 사용자에게 '어떤' 개입을 '왜' 추천했는지 기록하는 모델
class InterventionDecision(models.Model):

    class InterventionType(models.TextChoices):
        SOUND_ONLY = (
            "sound_only",
            "사운드만",
        )
        SOUND_WITH_RELAXATION = (
            "sound_with_relaxation",
            "사운드 + 이완 병행",
        )
        NONE = (
            "none",
            "개입 없음",
        )
    # 선택된 개입이 규칙기반인지 개인화인지 구분
    class RelaxationRecommendationSource(models.TextChoices):
        RULE_BASED = (
            "rule_based",
            "규칙 기반",
        )
        PERSONALIZED = (
            "personalized",
            "개인화",
        )

    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="intervention_decisions",
    )

    # F-501~504 : 현재 상태 통합
    state_snapshot = models.JSONField(
        help_text=(
            "이명 프로필, 음역 범위, 오늘 체크인, 최근 건강 데이터, "
            "과거 개입 결과 등을 하나로 통합한 현재 상태 스냅샷"
        ),
    )

    # F-505 : 개인화 데이터 부족 여부
    has_sufficient_data = models.BooleanField(
        default=False,
        help_text=(
            "개인화 판단에 충분한 데이터가 확보되었는지 여부. "
            "부족하면 개인 학습보다 초기 규칙을 우선한다."
        ),
    )

    missing_data_sources = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "현재 상태 객체를 생성할 때 값이 없어 "
            "사용하지 못한 데이터 출처 목록"
        ),
    )

    # F-506 : 오늘의 개입 유형
    intervention_type = models.CharField(
        max_length=32,
        choices=InterventionType.choices,
        db_index=True,
    )

    # F-507 : 개인화 사운드 전략
    sound_strategy = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "personalization이 선택한 고수준 사운드 전략. "
            "실제 frequency_bands, notch filter, mixing ramp 등의 "
            "DSP 파라미터는 sound 앱에서 계산한다."
        ),
    )

    # F-508 : 이완 활동 병행 여부 및 종류
    relaxation_activity_type = models.CharField(
        max_length=32,
        null=True,
        blank=True,
        help_text=(
            "사운드와 병행하도록 선택한 이완 활동 종류. "
            "relaxtion 앱의 RelaxationType 값을 문자열로 저장한다."
        ),
    )

    # F-508 : 이완 활동 추천 출처
    relaxation_recommendation_source = models.CharField(
        max_length=16,
        choices=RelaxationRecommendationSource.choices,
        null=True,
        blank=True,
        help_text=(
            "이완 활동이 현재 상태 규칙 그대로 선택되었는지, "
            "과거 개인화 결과에 의해 보정되었는지 기록한다."
        ),
    )

    # F-509 : 개인화 결정 근거
    reason = models.TextField(
        blank=True,
        help_text=(
            "개인화 결정 근거를 내부 분석용으로 저장. "
            "사용자에게 그대로 노출하는 설명문은 아님."
        ),
    )

    # 실제 실행된 사운드 세션 연결
    sound_session = models.ForeignKey(
        "sound.SoundSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="intervention_decisions",
    )

    # 실제 실행된 이완 세션 연결
    relaxation_session = models.ForeignKey(
        "relaxtion.RelaxationSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="intervention_decisions",
    )

    decided_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "개입 결정"
        verbose_name_plural = "개입 결정 목록"

        ordering = [
            "-decided_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "-decided_at",
                ]
            ),
            models.Index(
                fields=[
                    "user",
                    "intervention_type",
                ]
            ),
        ]

    def __str__(self):
        return (
            f"InterventionDecision("
            f"{self.user_id}, "
            f"{self.intervention_type}, "
            f"{self.decided_at:%Y-%m-%d}"
            f")"
        )


# 사용자별 누적 개인화 학습 결과
# 사운드와 이완 활동에 대한 사용자 반응을 저장
class UserPersonalizationProfile(models.Model):

    user = models.OneToOneField(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="personalization_profile",
    )

    # 사운드 학습. 도움 평가가 높았던 사운드 특성
    sound_tag_weights = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "사용자의 평가 결과를 기반으로 계산된 "
            "사운드 태그별 개인화 가중치"
        ),
    )

    # 반복적으로 불편했던 사운드 요소
    excluded_sound_tags = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "반복적으로 불편 평가된 사운드 특성. "
            "다음 사운드 후보 생성 시 제외 또는 감점한다."
        ),
    )

    # 이완 활동 학습
    relaxation_type_weights = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "사용자의 평가 및 완료/중단 결과를 기반으로 계산한 "
            "이완 활동 종류별 개인화 가중치"
        ),
    )

    # 반복적으로 낮은 평가나 불편 반응이 있었던 이완 유형
    discouraged_relaxation_types = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "반복적으로 낮은 도움 평가 또는 불편 반응이 있었던 "
            "이완 활동 유형. 다음 후보 선택 시 감점 대상으로 사용한다."
        ),
    )

    # 학습에 사용된 데이터 양
    evaluation_sample_count = models.PositiveIntegerField(
        default=0,
        help_text="전체 개인화 학습에 반영된 평가 개수",
    )

    sound_sample_count = models.PositiveIntegerField(
        default=0,
        help_text="사운드 선호 학습에 반영된 평가 개수",
    )

    relaxation_sample_count = models.PositiveIntegerField(
        default=0,
        help_text="이완 활동 선호 학습에 반영된 평가 개수",
    )

    # 마지막 학습 시점
    last_updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "사용자 개인화 프로필"
        verbose_name_plural = "사용자 개인화 프로필 목록"

    def __str__(self):
        return (
            f"UserPersonalizationProfile("
            f"{self.user_id}, "
            f"samples={self.evaluation_sample_count}"
            f")"
        )