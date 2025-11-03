# Endpoint de Ingestão de Medição

Documentação do endpoint para receber e salvar novos dados de medição de dispositivos.

## Endpoint

**POST** `/api/devices/{device_id}/measurements/`

**Descrição:** Cria uma nova medição para um dispositivo específico.

**Autenticação:** Requerida (JWT Bearer Token)

---

## Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `device_id` | integer | ID do dispositivo que gerou a medição |

---

## Request Body

```json
{
  "metric": "temperature",
  "value": "25.5",
  "unit": "°C",
  "timestamp": "2025-11-02T10:30:00Z"
}
```

### Campos Obrigatórios:

- **metric** (string, min 2 caracteres): Tipo de métrica (ex: temperature, humidity, pressure)
- **value** (decimal, 20 dígitos, 10 decimais): Valor da medição com precisão
- **unit** (string, min 1 caractere): Unidade de medida (ex: °C, %, hPa, m/s)
- **timestamp** (datetime, ISO 8601): Data/hora da medição

**Nota:** O campo `device` é automaticamente associado ao `device_id` do path. Não precisa enviar no body.

---

## Responses

### 201 Created (Sucesso)

```json
{
  "id": 1,
  "device": 1,
  "metric": "temperature",
  "value": "25.5000000000",
  "unit": "°C",
  "timestamp": "2025-11-02T10:30:00Z"
}
```

### 400 Bad Request (Validação)

```json
{
  "metric": ["Metric cannot be empty."],
  "value": ["Value cannot be null."],
  "unit": ["Unit cannot be empty."],
  "timestamp": ["This field is required."]
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found (Dispositivo não existe)

```json
{
  "detail": "Not found."
}
```

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

# 2. Criar medição
$headers = @{
    Authorization = "Bearer $accessToken"
    Content-Type = "application/json"
}

$measurementBody = @{
    metric = "temperature"
    value = "25.5"
    unit = "°C"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/devices/1/measurements/" `
    -Method POST `
    -Headers $headers `
    -Body $measurementBody

$response | ConvertTo-Json
```

### cURL

```bash
# Criar medição
curl -X POST http://localhost:8000/api/devices/1/measurements/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "temperature",
    "value": "25.5",
    "unit": "°C",
    "timestamp": "2025-11-02T10:30:00Z"
  }'
```

---

## Validações

### Metric
- Não pode ser vazio
- Mínimo de 2 caracteres
- Espaços no início/fim são removidos automaticamente

### Value
- Não pode ser null
- Aceita valores decimais com até 10 casas decimais
- Precisão: 20 dígitos totais, 10 decimais

### Unit
- Não pode ser vazio
- Espaços no início/fim são removidos automaticamente

### Timestamp
- Formato ISO 8601 (ex: 2025-11-02T10:30:00Z)
- Campo obrigatório

---

## Notas Importantes

1. **Autenticação**: Todas as requisições devem incluir o header `Authorization: Bearer <token>`

2. **Device ID**: O `device_id` no path deve corresponder a um dispositivo existente no banco

3. **Precisão**: O campo `value` usa DecimalField com alta precisão (20 dígitos, 10 decimais)

4. **Timestamp**: Pode ser enviado no formato ISO 8601. Se não fornecido, Django usará o timestamp atual

