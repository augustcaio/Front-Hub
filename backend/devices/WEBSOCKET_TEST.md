# Teste Manual de WebSocket - Tarefa 2.4

Este documento descreve como testar manualmente o fluxo de envio de dados em tempo real via WebSocket.

## 📋 Pré-requisitos

1. Servidor Django rodando com Daphne (suporta WebSockets)
2. Redis rodando (para Channel Layer) OU usar InMemoryChannelLayer em desenvolvimento
3. Python 3.8+ com dependências instaladas
4. Pelo menos um dispositivo criado no banco de dados

## 🔧 Instalação de Dependências

```bash
# Instalar bibliotecas necessárias para o script de teste
pip install websockets requests

# Ou se estiver usando Docker
docker-compose exec backend pip install websockets requests
```

## 🧪 Método 1: Script Python Automatizado

O script `test_websocket.py` automatiza o processo de teste.

### Executar o Script

```bash
# No diretório backend/
python test_websocket.py
```

O script irá:
1. ✅ Obter token JWT automaticamente
2. ✅ Listar dispositivos disponíveis
3. ✅ Conectar ao WebSocket usando o `public_id` do dispositivo
4. ✅ Escutar mensagens em tempo real

### Enviar Medição de Teste

Em **outro terminal**, enquanto o WebSocket está escutando:

```bash
# Enviar medição para o dispositivo ID 1
python test_websocket.py --send-measurement 1

# Com métrica e valor customizados
python test_websocket.py --send-measurement 1 --metric humidity --value 65.5
```

### Exemplo de Saída Esperada

```
✅ Conectado ao WebSocket!
📨 Mensagem de boas-vindas recebida:
{
  "type": "connection_established",
  "message": "Connected to device 550e8400-e29b-41d4-a716-446655440000",
  "device_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_name": "Sensor de Temperatura"
}

👂 Escutando mensagens em tempo real...
📨 Mensagem recebida:
{
  "type": "measurement_update",
  "measurement": {
    "id": 1,
    "device": 1,
    "metric": "temperature",
    "value": "25.5000000000",
    "unit": "°C",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
✅ Atualização de medição recebida em tempo real!
```

## 🧪 Método 2: Teste Manual com Ferramentas

### 2.1. Obter Informações do Dispositivo

Primeiro, obtenha o `public_id` de um dispositivo:

```bash
# PowerShell
$headers = @{
    Authorization = "Bearer $accessToken"
}
$device = Invoke-RestMethod -Uri "http://localhost:8000/api/devices/1/" -Headers $headers
$device.public_id
```

### 2.2. Conectar ao WebSocket

Use uma ferramenta como:
- **WebSocket King** (extensão Chrome)
- **Postman** (com suporte WebSocket)
- **wscat** (CLI tool)

#### Exemplo com wscat:

```bash
# Instalar wscat
npm install -g wscat

# Conectar
wscat -c ws://localhost:8000/ws/device/550e8400-e29b-41d4-a716-446655440000/
```

#### URL do WebSocket:

```
ws://localhost:8000/ws/device/{public_id}/
```

Substitua `{public_id}` pelo UUID do dispositivo.

### 2.3. Enviar Medição via API REST

Enquanto o WebSocket está conectado, envie uma medição:

```bash
# PowerShell
$measurementBody = @{
    metric = "temperature"
    value = "25.5"
    unit = "°C"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/devices/1/measurements/" `
    -Method POST `
    -Headers $headers `
    -Body $measurementBody
```

```bash
# cURL
curl -X POST http://localhost:8000/api/devices/1/measurements/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "temperature",
    "value": "25.5",
    "unit": "°C",
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

### 2.4. Verificar Mensagem no WebSocket

A mensagem deve aparecer **instantaneamente** no cliente WebSocket:

```json
{
  "type": "measurement_update",
  "measurement": {
    "id": 1,
    "device": 1,
    "metric": "temperature",
    "value": "25.5000000000",
    "unit": "°C",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## 🔍 Verificação do Fluxo Completo

### Checklist de Teste:

- [ ] WebSocket conecta com sucesso
- [ ] Mensagem de boas-vindas é recebida
- [ ] Dispositivo inexistente retorna erro (404)
- [ ] Medição criada via API REST
- [ ] Mensagem de atualização chega em tempo real no WebSocket
- [ ] Múltiplos clientes recebem a mesma mensagem
- [ ] Desconexão funciona corretamente

## 🐛 Troubleshooting

### Erro: "Channel layer is not configured"

**Problema:** Redis não está configurado ou não está rodando.

**Solução:**
1. Adicione Redis ao `docker-compose.yml`:
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  networks:
    - backend_network
```

2. Ou use InMemoryChannelLayer para desenvolvimento (apenas um processo):
```python
# Em settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    },
}
```

### Erro: "WebSocket connection failed"

**Problema:** Servidor não está usando Daphne.

**Solução:** Certifique-se de que o servidor está rodando com Daphne:
```bash
# Em vez de:
gunicorn config.wsgi:application

# Use:
daphne config.asgi:application
```

Ou atualize o `docker-compose.yml`:
```yaml
command: daphne config.asgi:application --bind 0.0.0.0 --port 8000
```

### Mensagem não chega no WebSocket

**Possíveis causas:**
1. Channel Layer não está funcionando
2. `public_id` está incorreto
3. Dispositivo não existe
4. View não está enviando mensagem (verificar logs)

**Solução:**
- Verifique os logs do servidor Django
- Confirme que o `public_id` está correto
- Teste enviando uma medição e verificando os logs

### Erro: "Invalid UUID format"

**Problema:** O `public_id` no WebSocket URL não está no formato UUID correto.

**Solução:** Use o formato UUID completo:
```
ws://localhost:8000/ws/device/550e8400-e29b-41d4-a716-446655440000/
```

## 📝 Exemplo Completo de Teste

### Terminal 1: WebSocket Client

```bash
python test_websocket.py
```

### Terminal 2: Enviar Medições

```bash
# Obter token
TOKEN=$(curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r .access)

# Enviar múltiplas medições
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/devices/1/measurements/ \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"metric\": \"temperature\",
      \"value\": \"$(echo "20 + $i * 0.5" | bc)\",
      \"unit\": \"°C\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }"
  sleep 2
done
```

### Resultado Esperado

No Terminal 1, você deve ver 5 mensagens chegando em tempo real, uma após cada POST.

## ✅ Critérios de Sucesso

O teste é considerado bem-sucedido quando:

1. ✅ WebSocket conecta sem erros
2. ✅ Mensagem de boas-vindas é recebida corretamente
3. ✅ Ao enviar uma medição via API REST, a mensagem chega **instantaneamente** no WebSocket
4. ✅ O formato da mensagem está correto com todos os campos da medição
5. ✅ Múltiplos clientes conectados recebem a mesma mensagem simultaneamente

---

**Nota:** Este teste valida a integração completa entre:
- API REST (MeasurementIngestionView)
- Channel Layer
- WebSocket Consumer (DeviceConsumer)

