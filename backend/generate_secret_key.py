#!/usr/bin/env python
"""
Script para gerar SECRET_KEYs seguras para Django e JWT.
Execute: python generate_secret_key.py
"""
import secrets
from django.core.management.utils import get_random_secret_key

if __name__ == '__main__':
    django_secret_key = get_random_secret_key()
    jwt_secret_key = secrets.token_urlsafe(64)
    
    print('=' * 70)
    print('SECRET KEYS GERADAS')
    print('=' * 70)
    
    print('\n1. DJANGO_SECRET_KEY:')
    print('-' * 70)
    print(django_secret_key)
    
    print('\n2. JWT_SECRET_KEY:')
    print('-' * 70)
    print(jwt_secret_key)
    
    print('\n' + '=' * 70)
    print('Adicione estas chaves ao arquivo .env:')
    print('=' * 70)
    print(f'\nDJANGO_SECRET_KEY={django_secret_key}')
    print(f'JWT_SECRET_KEY={jwt_secret_key}\n')

