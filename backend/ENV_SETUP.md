# Configuração de Variáveis de Ambiente

**IMPORTANTE:** Crie um arquivo `.env` na **raiz do projeto** (mesmo nível do `docker-compose.yml`), NÃO na pasta `backend`.

## Como gerar as SECRET KEYS

Você precisa gerar duas secret keys: uma para Django e outra para JWT.

### Opção Recomendada - Script Automatizado:

```bash
cd backend
python generate_secret_key.py
```

Este script gera **ambas** as secret keys de uma vez.

### Gerar Individualmente:

**DJANGO_SECRET_KEY:**

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**JWT_SECRET_KEY:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Com Docker (após criar o container):

```bash
# Django Secret Key
docker-compose exec backend python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# JWT Secret Key
docker-compose exec backend python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Estrutura esperada:

```
Front-Hub/
├── docker-compose.yml
├── .env              ← AQUI (raiz do projeto)
├── backend/
│   ├── Dockerfile
│   └── ...
└── frontend/
```

Variáveis de ambiente:

## PostgreSQL Configuration

```env
POSTGRES_DB=front_hub_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

## Django Configuration

```env
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DJANGO_PORT=8000
```

## Database Connection (usado pelo Django settings.py)

```env
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
```

## JWT Configuration (para uso futuro)

```env
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=86400
```

**Nota:** Altere os valores de senha e secret keys em produção!
