from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/onboarding/", include("onboarding.urls")),
    path("api/checkin/", include("checkin.urls")),
    path("api/feedback/", include("feedback.urls")),
    path("api/tinnitus/", include("tinnitus.urls")),
    path("api/sound/", include("sound.urls")),
    path("api/data/", include("data.urls")),
    path("api/relaxtion/", include("relaxtion.urls")),
    path("api/soundfit/", include("soundfit.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)