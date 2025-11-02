# Guia de Teste dos Endpoints JWT

## Pré-requisitos

1. **Iniciar os containers Docker:**
```bash
docker-compose up -d
```

2. **Aguardar os containers iniciarem (30-60 segundos)**

3. **Criar um superusuário para teste:**
```bash
docker-compose exec backend python manage.py createsuperuser
```

Informações sugeridas:
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin123` (ou sua escolha)

## Testar Endpoints JWT

### 1. Obter Token (Login)

**Endpoint:** `POST http://localhost:8000/api/token/`

**Com cURL:**
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Com PowerShell (Invoke-RestMethod):**
```powershell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/token/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Resposta esperada (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### 2. Verificar Token

**Endpoint:** `POST http://localhost:8000/api/token/verify/`

**Com cURL:**
```bash
curl -X POST http://localhost:8000/api/token/verify/ \
  -H "Content-Type: application/json" \
  -d '{"token": "SEU_ACCESS_TOKEN_AQUI"}'
```

**Com PowerShell:**
```powershell
$body = @{
    token = "SEU_ACCESS_TOKEN_AQUI"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/token/verify/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Resposta esperada (200 OK):**
```json
{}
```

---

### 3. Atualizar Token (Refresh)

**Endpoint:** `POST http://localhost:8000/api/token/refresh/`

**Com cURL:**
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "SEU_REFRESH_TOKEN_AQUI"}'
```

**Com PowerShell:**
```powershell
$body = @{
    refresh = "SEU_REFRESH_TOKEN_AQUI"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/token/refresh/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Resposta esperada (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### 4. Testar Requisição Autenticada

**Endpoint de exemplo:** `GET http://localhost:8000/admin/` (ou qualquer endpoint protegido)

**Com cURL:**
```bash
curl -X GET http://localhost:8000/api/protected-endpoint/ \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

**Com PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer SEU_ACCESS_TOKEN_AQUI"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/protected-endpoint/" `
  -Method GET `
  -Headers $headers
```

---

## Script PowerShell Completo para Teste

```powershell
# 1. Obter token
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/token/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody

$accessToken = $response.access
$refreshToken = $response.refresh

Write-Host "Access Token: $accessToken"
Write-Host "Refresh Token: $refreshToken"

# 2. Verificar token
$verifyBody = @{
    token = $accessToken
} | ConvertTo-Json

$verifyResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/token/verify/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $verifyBody

Write-Host "Token verificado com sucesso!" -ForegroundColor Green

# 3. Refresh token
$refreshBody = @{
    refresh = $refreshToken
} | ConvertTo-Json

$refreshResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/token/refresh/" `
  -Method POST `
  -ContentType "application/json" `
  -Body $refreshBody

Write-Host "Novo Access Token: $($refreshResponse.access)" -ForegroundColor Green
```

---

## Erros Comuns

### 401 Unauthorized - Credenciais Inválidas
```json
{
  "detail": "No active account found with the given credentials"
}
```
**Solução:** Verifique username e password corretos.

### 401 Unauthorized - Token Inválido
```json
{
  "detail": "Token is invalid or expired"
}
```
**Solução:** Obtenha um novo token fazendo login novamente.

### 500 Internal Server Error
**Solução:** Verifique os logs do container:
```bash
docker-compose logs backend
```

---

## Verificar Logs

```bash
# Ver logs do backend
docker-compose logs backend

# Ver logs em tempo real
docker-compose logs -f backend

# Ver logs do banco de dados
docker-compose logs db
```

