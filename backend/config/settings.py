import os
import sys
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# .env 파일 로드
load_dotenv(BASE_DIR / '.env')

# 🚨 apps 폴더를 파이썬 검색 경로에 추가
sys.path.insert(0, str(BASE_DIR / 'apps'))


# Quick-start development settings - unsuitable for production
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-)ou!!lg)fr(_9t&$nklpaenq#$um2qv87c^9$ml*rid9+*e-@s')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')  # 개발 편의를 위해 전체 허용


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'corsheaders',

    # 🚨 여기에 생성할 앱 이름을 추가해 주시면 됩니다! (예: 'users', 'posts')
    'accounts',
    'onboarding',
    'checkin',
    'feedback',
    'tinnitus',
    'sound',
    'data',
    'relaxtion',
    'soundfit',
    'mypage',
    'personalization',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',

    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # MTV 구조에서 CSRF 보완용 필수!
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 🚨 익명 이용 서비스라 로그인 세션이 없음 -> DRF 기본 인증(SessionAuthentication)을 끄고
#    CSRF 체크 없이 API 호출 가능하게 설정 (accounts/onboarding csrf_exempt 데코레이터와 함께 적용)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}

# 로컬 프론트엔드 CORS 허용
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5273',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# 🗄️ Database - DATABASE_URL 환경변수로 SQLite/PostgreSQL 분기
# .env의 DATABASE_URL이 postgres://... 면 PostgreSQL, sqlite:///./test.db 면 SQLite로 자동 연결
DATABASES = {
    'default': dj_database_url.parse(
        os.getenv('DATABASE_URL', f'sqlite:///{BASE_DIR / "db.sqlite3"}')
    )
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization (한국어 및 한국 시간)
LANGUAGE_CODE = 'ko-kr'

TIME_ZONE = 'Asia/Seoul'

USE_I18N = True

USE_TZ = False


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']  # 공통 CSS/JS/이미지 파일 경로
STATIC_ROOT = BASE_DIR / 'staticfiles'  # 배포 시 collectstatic이 모아줄 경로

# Media files (사용자가 업로드하는 사진/파일)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'