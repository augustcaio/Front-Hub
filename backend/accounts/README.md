# Accounts App

App Django para gerenciamento de usuários.

## Modelo User

O modelo `User` estende `AbstractUser` do Django e inclui:

### Campos Principais:
- **id**: Primary key auto-gerado (BigAutoField)
- **username**: Nome de usuário único (herdado de AbstractUser)
- **email**: Email único e obrigatório (sobrescrito para ser unique=True)
- **password**: Senha hashada (herdado de AbstractUser)
- **first_name**: Nome do usuário
- **last_name**: Sobrenome do usuário
- **date_joined**: Data de cadastro
- **is_active**: Status ativo/inativo
- **is_staff**: Permissão de staff
- **is_superuser**: Permissão de superusuário

### Recursos:
- ✅ Índices no banco de dados (email, username)
- ✅ Métodos auxiliares (`get_full_name()`, `get_short_name()`)
- ✅ Type hints aplicados
- ✅ Tradução (i18n) configurada

## Migrações

Para criar e aplicar as migrações:

```bash
# Via Docker (recomendado)
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Ou localmente (se tiver ambiente configurado)
python manage.py makemigrations
python manage.py migrate
```

## Admin

O modelo está registrado no Django Admin com todas as funcionalidades padrão do `UserAdmin`.

## Próximos Passos

- Implementar Serializers para a API REST
- Implementar ViewSets/Views para autenticação
- Configurar endpoints JWT

