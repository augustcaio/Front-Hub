#!/usr/bin/env python
"""Script para criar superusuário admin."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123'
    )
    print('✅ Usuário admin criado com sucesso!')
    print('   Username: admin')
    print('   Password: admin123')
else:
    print('ℹ️  Usuário admin já existe')
    user = User.objects.get(username='admin')
    user.set_password('admin123')
    user.save()
    print('✅ Senha do usuário admin atualizada para: admin123')

