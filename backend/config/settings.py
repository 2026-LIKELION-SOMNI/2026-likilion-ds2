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

# 📌 ALLOWED_HOSTS: 환경변수 설정이 없으면 백엔드 및 새 프론트 도메인 기본 허용
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'api.likelion-somni.site,likelion-somni.site,1.201.116.178,localhost,127.0.0.1,*').split(',')


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
    'home',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',

    'corsheaders.middleware.CorsMiddleware',  # CommonMiddleware보다 위에 있어야 함

    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}

# 📌 CORS 설정: 새 Vercel 도메인 및 로컬/기존 Vercel 주소 모두 허용
default_cors = [
    'https://likelion-somni.site',
    'https://www.likelion-somni.site',
    'http://localhost:5273',
    'http://localhost:3000',
    'http://localhost:5173',
]

if os.getenv('CORS_ALLOWED_ORIGINS'):
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS').split(',')
else:
    CORS_ALLOWED_ORIGINS = default_cors

# 쿠키/인증 헤더 전송 허용 (필요 시)
CORS_ALLOW_CREDENTIALS = True


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


DATABASES = {
    'default': dj_database_url.parse(
        os.getenv('DATABASE_URL', f'sqlite:///{BASE_DIR / "db.sqlite3"}')
    )
}


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


LANGUAGE_CODE = 'ko-kr'

TIME_ZONE = 'Asia/Seoul'

USE_I18N = True

USE_TZ = False


STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'