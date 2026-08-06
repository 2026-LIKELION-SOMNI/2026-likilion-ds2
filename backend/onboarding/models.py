from django.db import models

from accounts.models import AnonymousUser


# 의료적 한계 고지 확인 + 온보딩 완료 여부 관리
class OnboardingStatus(models.Model):
    user = models.OneToOneField(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="onboarding_status",
    )
    # F-103: 의료적 한계 고지 확인
    confirmed = models.BooleanField(default=False, help_text="진단·치료 서비스가 아님을 확인했는지 여부")
    confirmed_at = models.DateTimeField(null=True, blank=True)

    # 온보딩 전체 완료 여부 (소개 → 고지 → 안전문항까지 끝났는지 확인!!)
    done = models.BooleanField(default=False)
    done_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "온보딩 진행 상태"
        verbose_name_plural = "온보딩 진행 상태 목록"

    def __str__(self):
        return f"OnboardingStatus({self.user_id})"


# F-104~105: 안전 확인 문항 응답 저장
class SafetyCheckResponse(models.Model):
    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="safety_checks",
    )
    hearing_loss = models.BooleanField(default=False, help_text="갑작스러운 청력 저하")
    one_sided = models.BooleanField(default=False, help_text="한쪽에서만 지속되는 이명")
    pulse_sound = models.BooleanField(default=False, help_text="맥박에 맞춰 들리는 소리")
    dizziness = models.BooleanField(default=False, help_text="심한 어지럼증 동반")

    # 하나라도 True면 의료기관 병원 확인 안내 이동 (F-107)
    need_doctor = models.BooleanField(default=False, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "안전 확인 응답"
        verbose_name_plural = "안전 확인 응답 목록"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.need_doctor = any([
            self.hearing_loss,
            self.one_sided,
            self.pulse_sound,
            self.dizziness,
        ])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"SafetyCheckResponse({self.user_id}, need_doctor={self.need_doctor})"