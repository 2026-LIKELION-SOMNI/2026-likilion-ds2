import uuid

from django.db import models

from accounts.models import AnonymousUser


class Texture(models.TextChoices):
    SOFT = "soft", "부드럽게"
    BALANCED = "balanced", "균형 있게"
    CLEAR = "clear", "선명하게"


class LayerMix(models.TextChoices):
    LOW = "low", "자연음 위주"
    MEDIUM = "medium", "균형"
    HIGH = "high", "노이즈 위주"


class FitAxis(models.TextChoices):
    TEXTURE = "texture", "Texture"
    LAYER_MIX = "layer_mix", "Layer Mix"


TOTAL_ROUNDS = 2 # 2/2 단계로 확정


class SoundFitSession(models.Model):
    # AI Sound Fit 진행 세션 (1/2, 2/2 A/B 비교)

    session_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )

    user = models.ForeignKey(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="soundfit_sessions",
    )

    round_number = models.PositiveSmallIntegerField(default=1)  # 1~2

    current_axis = models.CharField(
        max_length=20, choices=FitAxis.choices, default=FitAxis.TEXTURE
    )

    rounds = models.JSONField(default=list, blank=True)

    texture = models.CharField(max_length=20, choices=Texture.choices, null=True, blank=True)
    layer_mix = models.CharField(max_length=20, choices=LayerMix.choices, null=True, blank=True)

    # 이 필드 사용 안 하는데 마이그레이션 꼬일까 봐 남겨둠
    confirm_started = models.BooleanField(default=False)

    done = models.BooleanField(default=False)
    abandoned = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Sound Fit 세션"
        verbose_name_plural = "Sound Fit 세션 목록"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"SoundFitSession({self.session_id}, round={self.round_number}/{TOTAL_ROUNDS})"


class SoundFitProfile(models.Model):
    user = models.OneToOneField(
        AnonymousUser,
        on_delete=models.CASCADE,
        related_name="soundfit_profile",
    )

    texture = models.CharField(max_length=20, choices=Texture.choices)
    layer_mix = models.CharField(max_length=20, choices=LayerMix.choices)

    source_session = models.ForeignKey(
        SoundFitSession, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "My Sound Profile"
        verbose_name_plural = "My Sound Profile 목록"

    def __str__(self):
        return f"SoundFitProfile(user={self.user_id}, texture={self.texture}, layer_mix={self.layer_mix})"