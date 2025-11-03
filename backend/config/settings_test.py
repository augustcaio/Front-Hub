"""
Test settings for running Django tests locally without external services.

Overrides database to SQLite and channel layer to in-memory.
"""

from .settings import *  # noqa: F401,F403

# Use SQLite for tests to avoid requiring Postgres service locally
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }
}

# Use in-memory channel layer for tests (no Redis required)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Speed up tests: simpler password hashing
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Ensure DRF default permission remains IsAuthenticated to match tests
# (inherits from base settings)


