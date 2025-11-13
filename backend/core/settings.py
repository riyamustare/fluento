import os
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

# -------------------------------------------------------------------
# BASE SETTINGS
# -------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY
SECRET_KEY = config('DJANGO_SECRET_KEY', default=os.environ.get('SECRET_KEY', 'dev-secret-key'))
DEBUG = config('DJANGO_DEBUG', default='False') == 'True'

# Allowed Hosts
_allowed = config('DJANGO_ALLOWED_HOSTS', default='')
if _allowed:
    ALLOWED_HOSTS = [h.strip() for h in _allowed.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = [
        'fluentoai.vercel.app',
        'fluento-fm9vy9bv6-riyas-projects-602fe862.vercel.app',
        'fluento-taupe.vercel.app',
        '.vercel.app',  # allow all Vercel preview domains
        'localhost',
        '127.0.0.1',
    ]

# -------------------------------------------------------------------
# APPLICATIONS
# -------------------------------------------------------------------

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party
    'rest_framework',
    'corsheaders',

    # Local apps
    'app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

# -------------------------------------------------------------------
# TEMPLATES
# -------------------------------------------------------------------

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

WSGI_APPLICATION = 'core.wsgi.application'

# -------------------------------------------------------------------
# DATABASE CONFIG
# -------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Override database if DATABASE_URL exists (Render / Postgres)
DATABASE_URL = os.environ.get('DATABASE_URL') or config('DATABASE_URL', default='')
if DATABASE_URL:
    DATABASES['default'] = dj_database_url.parse(
        DATABASE_URL, conn_max_age=600, ssl_require=True
    )

# Persistent DB connections
CONN_MAX_AGE = int(config('CONN_MAX_AGE', default='600'))
for db in DATABASES.values():
    db.setdefault('CONN_MAX_AGE', CONN_MAX_AGE)

# -------------------------------------------------------------------
# AUTH & USER MODEL
# -------------------------------------------------------------------

AUTH_USER_MODEL = 'app.CustomUser'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# -------------------------------------------------------------------
# INTERNATIONALIZATION
# -------------------------------------------------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# -------------------------------------------------------------------
# STATIC FILES (Whitenoise)
# -------------------------------------------------------------------

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# -------------------------------------------------------------------
# SECURITY HEADERS FOR RENDER
# -------------------------------------------------------------------

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# -------------------------------------------------------------------
# CORS CONFIGURATION
# -------------------------------------------------------------------

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        'https://fluentoai.vercel.app',
        'https://fluento-cgbbp9uvs-riyas-projects-602fe862.vercel.app',
        'https://fluento-taupe.vercel.app',
    ]

    # Allow ALL Vercel preview deployments
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https:\/\/.*\.vercel\.app$",
    ]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
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

CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
]

# -------------------------------------------------------------------
# REST FRAMEWORK / JWT
# -------------------------------------------------------------------

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
