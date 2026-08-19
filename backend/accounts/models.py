import uuid

from django.db import models

#익명 사용자 DB
class AnonymousUser(models.Model):
    uuid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="익명 사용자 식별값 (디바이스에 저장되어 재사용됨)",
    )
    nickname = models.CharField(max_length=50, blank=True, default="")
    health_data_connected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(auto_now=True)

    
    class Meta:
        verbose_name = "익명 사용자"
        verbose_name_plural = "익명 사용자 목록"
        ordering = ["-last_accessed_at"]

    def __str__(self):
        return f"AnonymousUser({self.uuid})"

#사용자 접속 기록 DB
class UsageRecord(models.Model):
    user = models.ForeignKey(AnonymousUser, on_delete=models.CASCADE, related_name="usage_records")
    accessed_at = models.DateTimeField(auto_now_add=True)
    device_info = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        verbose_name = "이용(재접속) 기록"
        verbose_name_plural = "이용(재접속) 기록 목록"
        ordering = ["-accessed_at"]

    def __str__(self):
        return f"UsageRecord({self.user_id} @ {self.accessed_at})"