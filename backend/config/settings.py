"""
Django settings for config project.

Following Django & Python best practices with type hinting,
environment variables via python-decouple, and clean code principles.
"""

from pathlib import Path
from decouple import config, Csv
from typing import List

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# O decouple busca automaticamente o .env no diretório atual e nos pais
# Como estamos rodando via Docker, o .env é injetado via env_file no docker-compose.yml
# Em desenvolvimento local, o decouple encontrará o .env na raiz do projeto automaticamente


# SECURITY SETTINGS
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY: str = config('DJANGO_SECRET_KEY', default='django-insecure-change-me')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG: bool = config('DJANGO_DEBUG', default=False, cast=bool)

ALLOWED_HOSTS: List[str] = config(
    'DJANGO_ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=Csv()
)


# Application definition

INSTALLED_APPS: List[str] = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps (Channels deve vir antes das apps locais)
    'channels',
    
    # Local apps
    'accounts',
    'devices',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
]

MIDDLEWARE: List[str] = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS deve vir antes de CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF: str = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION: str = 'config.wsgi.application'
ASGI_APPLICATION: str = 'config.asgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='front_hub_db'),
        'USER': config('POSTGRES_USER', default='postgres'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='postgres'),
        'HOST': config('POSTGRES_HOST', default='db'),
        'PORT': config('POSTGRES_PORT', default='5432', cast=int),
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE: str = 'pt-br'

TIME_ZONE: str = 'America/Sao_Paulo'

USE_I18N: bool = True

USE_TZ: bool = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL: str = '/static/'
STATIC_ROOT: Path = BASE_DIR / 'staticfiles'

MEDIA_URL: str = '/media/'
MEDIA_ROOT: Path = BASE_DIR / 'media'


# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD: str = 'django.db.models.BigAutoField'


# Custom User Model
# https://docs.djangoproject.com/en/5.2/topics/auth/customizing/#substituting-a-custom-user-model

AUTH_USER_MODEL: str = 'accounts.User'


# Django REST Framework Configuration
# https://www.django-rest-framework.org/api-guide/settings/

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}


# Simple JWT Configuration
# https://django-rest-framework-simplejwt.readthedocs.io/en/latest/settings.html

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        seconds=config('JWT_ACCESS_TOKEN_LIFETIME', default=3600, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        seconds=config('JWT_REFRESH_TOKEN_LIFETIME', default=86400, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('JWT_SECRET_KEY', default=SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# CORS Configuration
# https://github.com/adamchainz/django-cors-headers

CORS_ALLOWED_ORIGINS: List[str] = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:4200',
    cast=Csv()
)

CORS_ALLOW_CREDENTIALS: bool = True

CORS_ALLOW_METHODS: List[str] = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS: List[str] = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


# Django Channels Configuration
# https://channels.readthedocs.io/en/stable/topics/channel_layers.html

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': config(
            'CHANNEL_LAYER_BACKEND',
            default='channels_redis.core.RedisChannelLayer'
        ),
        'CONFIG': {
            "hosts": [
                (
                    config('REDIS_HOST', default='localhost'),
                    config('REDIS_PORT', default=6379, cast=int)
                )
            ],
        },
    },
}
