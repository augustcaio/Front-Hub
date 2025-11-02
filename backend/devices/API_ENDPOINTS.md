# API Endpoints - Devices

Documentação dos endpoints REST para dispositivos.

## Endpoints Disponíveis

### 1. Listar Dispositivos
**Endpoint:** `GET /api/devices/`

**Descrição:** Lista todos os dispositivos (paginação: 20 por página).

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "count": 10,
  "next": "http://localhost:8000/api/devices/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "public_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sensor Temperatura 01",
      "status": "active",
      "description": "Sensor de temperatura ambiente",
      "created_at": "2025-11-02T00:00:00Z",
      "updated_at": "2025-11-02T00:00:00Z"
    },
    ...
  ]
}
```

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `page_size`: Itens por página (padrão: 20, configurável no settings)

---

### 2. Detalhar Dispositivo
**Endpoint:** `GET /api/devices/{id}/`

**Descrição:** Retorna os detalhes de um dispositivo específico.

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: ID do dispositivo (integer)

**Response (200 OK):**
```json
{
  "id": 1,
  "public_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Sensor Temperatura 01",
  "status": "active",
  "description": "Sensor de temperatura ambiente",
  "created_at": "2025-11-02T00:00:00Z",
  "updated_at": "2025-11-02T00:00:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

### 3. Dados Agregados do Dispositivo
**Endpoint:** `GET /api/devices/{device_id}/aggregated-data/`

**Descrição:** Retorna os últimos 100 pontos de medição de um dispositivo e dados agregados (Média/Máx/Mín).

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `device_id`: ID do dispositivo (integer)

**Response (200 OK):**
```json
{
  "measurements": [
    {
      "id": 100,
      "device": 1,
      "metric": "temperature",
      "value": "25.5000000000",
      "unit": "°C",
      "timestamp": "2025-11-02T10:30:00Z"
    },
    {
      "id": 99,
      "device": 1,
      "metric": "temperature",
      "value": "24.8000000000",
      "unit": "°C",
      "timestamp": "2025-11-02T10:29:00Z"
    }
    // ... até 100 medições (mais recentes primeiro)
  ],
  "statistics": {
    "mean": 25.15,
    "max": 26.80,
    "min": 23.50
  },
  "count": 100
}
```

**Response (200 OK - Sem medições):**
```json
{
  "measurements": [],
  "statistics": {
    "mean": null,
    "max": null,
    "min": null
  },
  "count": 0
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

**Notas:**
- Retorna até 100 medições, ordenadas por timestamp (mais recentes primeiro)
- Os dados agregados (mean, max, min) são calculados apenas sobre os últimos 100 pontos retornados
- Se não houver medições, as estatísticas retornarão `null`
- O campo `count` indica quantas medições foram retornadas (máximo 100)

---

### 4. Listar Alertas
**Endpoint:** `GET /api/alerts/`

**Descrição:** Lista todos os alertas (paginação: 20 por página).

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Query Parameters:**
- `device_id` (opcional): Filtrar alertas por dispositivo específico (integer)
- `status` (opcional): Filtrar por status (`pending` ou `resolved`)
- `unresolved_only` (opcional): Filtrar apenas alertas não resolvidos (`true`)

**Response (200 OK):**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "device": 1,
      "title": "Temperatura alta detectada",
      "message": "A temperatura do dispositivo excedeu 30°C",
      "severity": "high",
      "status": "pending",
      "created_at": "2025-11-02T10:30:00Z",
      "updated_at": "2025-11-02T10:30:00Z",
      "resolved_at": null
    },
    ...
  ]
}
```

**Exemplos de Uso:**
```
# Listar todos os alertas
GET /api/alerts/

# Filtrar alertas não resolvidos
GET /api/alerts/?unresolved_only=true

# Filtrar alertas de um dispositivo específico
GET /api/alerts/?device_id=1

# Filtrar alertas resolvidos
GET /api/alerts/?status=resolved
```

---

### 5. Criar Alerta
**Endpoint:** `POST /api/alerts/`

**Descrição:** Cria um novo alerta.

**Autenticação:** Requerida (JWT Bearer Token)

**Request Body:**
```json
{
  "device": 1,
  "title": "Temperatura alta detectada",
  "message": "A temperatura do dispositivo excedeu 30°C",
  "severity": "high",
  "status": "pending"
}
```

**Campos Obrigatórios:**
- `device` (integer): ID do dispositivo associado
- `title` (string, min 3 caracteres): Título do alerta
- `message` (string): Mensagem/descrição do alerta
- `severity` (string): Nível de severidade (`low`, `medium`, `high`, `critical`)
- `status` (string): Status do alerta (`pending`, `resolved`)

**Response (201 Created):**
```json
{
  "id": 1,
  "device": 1,
  "title": "Temperatura alta detectada",
  "message": "A temperatura do dispositivo excedeu 30°C",
  "severity": "high",
  "status": "pending",
  "created_at": "2025-11-02T10:30:00Z",
  "updated_at": "2025-11-02T10:30:00Z",
  "resolved_at": null
}
```

---

### 6. Detalhar Alerta
**Endpoint:** `GET /api/alerts/{id}/`

**Descrição:** Retorna os detalhes de um alerta específico.

**Autenticação:** Requerida (JWT Bearer Token)

**Response (200 OK):**
```json
{
  "id": 1,
  "device": 1,
  "title": "Temperatura alta detectada",
  "message": "A temperatura do dispositivo excedeu 30°C",
  "severity": "high",
  "status": "pending",
  "created_at": "2025-11-02T10:30:00Z",
  "updated_at": "2025-11-02T10:30:00Z",
  "resolved_at": null
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

### 7. Atualizar Alerta
**Endpoint:** `PUT /api/alerts/{id}/` ou `PATCH /api/alerts/{id}/`

**Descrição:** Atualiza um alerta existente. Ao marcar como `resolved`, o campo `resolved_at` é preenchido automaticamente.

**Autenticação:** Requerida (JWT Bearer Token)

**Request Body (PUT - todos os campos):**
```json
{
  "device": 1,
  "title": "Temperatura alta detectada",
  "message": "A temperatura do dispositivo excedeu 30°C e foi corrigida",
  "severity": "high",
  "status": "resolved"
}
```

**Request Body (PATCH - campos parciais):**
```json
{
  "status": "resolved"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "device": 1,
  "title": "Temperatura alta detectada",
  "message": "A temperatura do dispositivo excedeu 30°C e foi corrigida",
  "severity": "high",
  "status": "resolved",
  "created_at": "2025-11-02T10:30:00Z",
  "updated_at": "2025-11-02T10:35:00Z",
  "resolved_at": "2025-11-02T10:35:00Z"
}
```

**Nota:** Quando o status muda de `pending` para `resolved`, o campo `resolved_at` é automaticamente preenchido com a data/hora atual.

---

### 8. Deletar Alerta
**Endpoint:** `DELETE /api/alerts/{id}/`

**Descrição:** Remove um alerta do sistema.

**Autenticação:** Requerida (JWT Bearer Token)

**Response (204 No Content):**
(Sem corpo de resposta)

**Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

## Validações

### Device Name
- Não pode ser vazio
- Mínimo de 3 caracteres
- Espaços no início/fim são removidos automaticamente

### Device Status
- Deve ser um dos valores válidos:
  - `active`
  - `inactive`
  - `maintenance`
  - `error`

### Alert Title
- Não pode ser vazio
- Mínimo de 3 caracteres
- Espaços no início/fim são removidos automaticamente

### Alert Message
- Não pode ser vazio

### Alert Severity
- Deve ser um dos valores válidos:
  - `low`
  - `medium`
  - `high`
  - `critical`

### Alert Status
- Deve ser um dos valores válidos:
  - `pending`
  - `resolved`

---

## Campos Read-Only

Os seguintes campos são apenas leitura e não podem ser modificados via API:

**Device:**
- `id`
- `public_id`
- `created_at`
- `updated_at`

**Alert:**
- `id`
- `created_at`
- `updated_at`
- `resolved_at` (preenchido automaticamente ao marcar como resolved)

---

## Exemplos de Uso

### PowerShell
```powershell
# 1. Obter token
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$tokenResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/token/" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$accessToken = $tokenResponse.access

# 2. Listar dispositivos
$headers = @{
    Authorization = "Bearer $accessToken"
}

$devices = Invoke-RestMethod -Uri "http://localhost:8000/api/devices/" `
    -Method GET `
    -Headers $headers

$devices | ConvertTo-Json -Depth 10

# 3. Detalhar dispositivo específico
$device = Invoke-RestMethod -Uri "http://localhost:8000/api/devices/1/" `
    -Method GET `
    -Headers $headers

$device | ConvertTo-Json
```

### cURL
```bash
# Listar dispositivos
curl -X GET http://localhost:8000/api/devices/ \
  -H "Authorization: Bearer <access_token>"

# Detalhar dispositivo
curl -X GET http://localhost:8000/api/devices/1/ \
  -H "Authorization: Bearer <access_token>"
```

---

## Respostas de Erro

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**Solução:** Inclua o header `Authorization: Bearer <token>`

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```
**Solução:** Verifique se o token é válido e o usuário está autenticado

### 404 Not Found
```json
{
  "detail": "Not found."
}
```
**Solução:** Verifique se o ID do dispositivo existe

### 400 Bad Request (Validação)
```json
{
  "name": ["Device name must be at least 3 characters long."],
  "status": ["Status must be one of: active, inactive, maintenance, error"]
}
```
**Solução:** Corrija os dados enviados conforme os erros indicados

