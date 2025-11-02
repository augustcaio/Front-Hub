# Autenticação JWT

Documentação sobre a configuração e uso da autenticação JWT no projeto.

## Configuração

A autenticação JWT está configurada usando `djangorestframework-simplejwt`.

### Dependências
- ✅ `djangorestframework-simplejwt>=5.2.0` (já instalado em `requirements.txt`)

### Settings Configurados

**REST_FRAMEWORK:**
- `DEFAULT_AUTHENTICATION_CLASSES`: `JWTAuthentication`
- `DEFAULT_PERMISSION_CLASSES`: `IsAuthenticated`

**SIMPLE_JWT:**
- `ACCESS_TOKEN_LIFETIME`: 3600 segundos (1 hora) - configurável via env
- `REFRESH_TOKEN_LIFETIME`: 86400 segundos (24 horas) - configurável via env
- `ROTATE_REFRESH_TOKENS`: True
- `BLACKLIST_AFTER_ROTATION`: True (requer blacklist app, opcional)
- `ALGORITHM`: HS256
- `SIGNING_KEY`: Configurável via `JWT_SECRET_KEY` no `.env`
- `AUTH_HEADER_TYPES`: ('Bearer',)

## Endpoints Disponíveis

### 1. Obter Token (Login)
**Endpoint:** `POST /api/token/`

**Descrição:** Autentica um usuário e retorna access token e refresh token.

**Request Body:**
```json
{
  "username": "usuario",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

### 2. Atualizar Token (Refresh)
**Endpoint:** `POST /api/token/refresh/`

**Descrição:** Atualiza o access token usando o refresh token.

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Token is invalid or expired"
}
```

---

### 3. Verificar Token
**Endpoint:** `POST /api/token/verify/`

**Descrição:** Verifica se um token é válido.

**Request Body:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Token is invalid or expired"
}
```

---

## Uso em Requisições Autenticadas

Após obter o access token, inclua-o no header `Authorization`:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Exemplo com cURL:**
```bash
# 1. Obter token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "usuario", "password": "senha123"}'

# 2. Usar token em requisições autenticadas
curl -X GET http://localhost:8000/api/protected-endpoint/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Variáveis de Ambiente

Configure no arquivo `.env`:

```env
# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_LIFETIME=3600  # segundos (padrão: 1 hora)
JWT_REFRESH_TOKEN_LIFETIME=86400  # segundos (padrão: 24 horas)
```

---

## Notas Importantes

1. **Blacklist de Tokens:** A configuração `BLACKLIST_AFTER_ROTATION=True` requer instalação opcional de `django-rest-framework-simplejwt[blacklist]`. Para uso básico, esta configuração pode ser mantida mesmo sem o app blacklist.

2. **Segurança:** 
   - Use HTTPS em produção
   - Mantenha o `JWT_SECRET_KEY` seguro e não o compartilhe
   - Configure lifespans adequados para seu caso de uso

3. **Refresh Token Rotation:** Quando `ROTATE_REFRESH_TOKENS=True`, um novo refresh token é retornado a cada refresh, invalidando o token anterior. Isso aumenta a segurança.

---

## Próximos Passos

- Implementar serializers customizados para respostas de login
- Adicionar rate limiting nos endpoints de autenticação
- Implementar logout (requer blacklist app)
- Adicionar endpoints de registro de usuário

