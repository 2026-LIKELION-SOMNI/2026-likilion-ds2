from django.contrib import admin

from .models import AnonymousUser, UsageRecord

#해당 코드는 관리자가 편하기 위해 작성

#익명 사용자 관리자 설정
@admin.register(AnonymousUser)
class AnonymousUserAdmin(admin.ModelAdmin):
    list_display = ["uuid", "nickname", "health_data_connected", "created_at", "last_accessed_at"]
    search_fields = ["uuid", "nickname"]
    list_filter = ["health_data_connected"]

#이용 기록 관리자 설정
@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "accessed_at", "device_info"]
    list_filter = ["accessed_at"]