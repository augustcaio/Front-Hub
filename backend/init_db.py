"""
Script de inicialização do banco de dados.
Cria o superusuário se não existir.
"""
import os
import sys
import django

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User


def create_superuser_if_not_exists():
    """Cria o superusuário admin se não existir."""
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'
    
    print(f'🔍 Verificando usuário {username}...')
    
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name='Admin',
            last_name='User'
        )
        print(f'✅ Usuário {username} criado com sucesso!')
        print(f'   Username: {username}')
        print(f'   Password: {password}')
    else:
        # Garantir que a senha está correta
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_active = True
        user.save()
        print(f'ℹ️  Usuário {username} já existe. Senha atualizada.')


if __name__ == '__main__':
    try:
        create_superuser_if_not_exists()
    except Exception as e:
        print(f'❌ Erro ao criar usuário: {e}', file=sys.stderr)
        sys.exit(1)

