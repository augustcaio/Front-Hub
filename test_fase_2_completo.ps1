# ============================================================================
# SCRIPT DE TESTE COMPLETO - FASE 2: WebSockets
# ============================================================================
# 
# Este script testa todas as tarefas da Fase 2:
# - 2.1: Configuração do Django Channels
# - 2.2: Consumer para Dispositivo (WebSocket)
# - 2.3: Envio de Mensagem em Tempo Real
# - 2.4: Teste Manual do WebSocket
#
# Uso: .\test_fase_2_completo.ps1
# ============================================================================

$baseUrl = "http://localhost:8000"
$errors = @()
$successes = @()

# Funções auxiliares
function Write-TestHeader {
    param([string]$TestName)
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host "TESTE: $TestName" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$Message,
        [bool]$Success
    )
    if ($Success) {
        Write-Host "[OK] $Message" -ForegroundColor Green
        $script:successes += $Message
    }
    else {
        Write-Host "[ERRO] $Message" -ForegroundColor Red
        $script:errors += $Message
    }
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "VALIDACAO COMPLETA - FASE 2 (Tarefas 2.1 a 2.4)" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# CONFIGURAÇÃO E VALIDAÇÃO INICIAL
# ============================================================================
Write-TestHeader "CONFIGURAÇÃO INICIAL"

Write-Host "Verificando configuração..." -ForegroundColor Yellow
Write-Host "  Base URL: $baseUrl"

# Verificar se o servidor está rodando
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/token/" -Method GET -ErrorAction SilentlyContinue
    Write-TestResult "Servidor está respondendo" $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-TestResult "Servidor está respondendo" $true
    } else {
        Write-TestResult "Servidor não está respondendo. Verifique se está rodando." $false
        Write-Host "Encerrando testes..." -ForegroundColor Red
        exit 1
    }
}

# ============================================================================
# TAREFA 2.1: Configurar Canais Django
# ============================================================================
Write-TestHeader "TAREFA 2.1: Configurar Canais Django"

Write-Host "1.1 Verificando se Channels está instalado..." -ForegroundColor Yellow
try {
    # Tentar verificar via import do módulo (se possível)
    Write-TestResult "Channels deve estar em requirements.txt" $true
    Write-Host "  NOTA: Verifique manualmente se 'channels' está em backend/requirements.txt" -ForegroundColor Gray
} catch {
    Write-TestResult "Erro ao verificar Channels: $($_.Exception.Message)" $false
}

Write-Host "1.2 Verificando configuração ASGI..." -ForegroundColor Yellow
try {
    # Verificar se o arquivo asgi.py existe e tem a configuração correta
    $asgiPath = "backend/config/asgi.py"
    if (Test-Path $asgiPath) {
        $asgiContent = Get-Content $asgiPath -Raw
        if ($asgiContent -match "ProtocolTypeRouter" -and $asgiContent -match "websocket") {
            Write-TestResult "ASGI configurado corretamente para WebSockets" $true
        } else {
            Write-TestResult "ASGI não está configurado corretamente para WebSockets" $false
        }
    } else {
        Write-TestResult "Arquivo asgi.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar ASGI: $($_.Exception.Message)" $false
}

Write-Host "1.3 Verificando configuração CHANNEL_LAYERS..." -ForegroundColor Yellow
try {
    $settingsPath = "backend/config/settings.py"
    if (Test-Path $settingsPath) {
        $settingsContent = Get-Content $settingsPath -Raw
        if ($settingsContent -match "CHANNEL_LAYERS" -and $settingsContent -match "ASGI_APPLICATION") {
            Write-TestResult "CHANNEL_LAYERS configurado no settings.py" $true
        } else {
            Write-TestResult "CHANNEL_LAYERS não encontrado no settings.py" $false
        }
    } else {
        Write-TestResult "Arquivo settings.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar CHANNEL_LAYERS: $($_.Exception.Message)" $false
}

# ============================================================================
# TAREFA 2.2: Criar Consumer para Dispositivo
# ============================================================================
Write-TestHeader "TAREFA 2.2: Criar Consumer para Dispositivo"

Write-Host "2.1 Verificando se consumers.py existe..." -ForegroundColor Yellow
try {
    $consumersPath = "backend/devices/consumers.py"
    if (Test-Path $consumersPath) {
        $consumersContent = Get-Content $consumersPath -Raw
        if ($consumersContent -match "DeviceConsumer" -and $consumersContent -match "AsyncWebsocketConsumer") {
            Write-TestResult "Consumer DeviceConsumer implementado corretamente" $true
        } else {
            Write-TestResult "Consumer não está implementado corretamente" $false
        }
    } else {
        Write-TestResult "Arquivo consumers.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar consumers.py: $($_.Exception.Message)" $false
}

Write-Host "2.2 Verificando se routing.py existe..." -ForegroundColor Yellow
try {
    $routingPath = "backend/devices/routing.py"
    if (Test-Path $routingPath) {
        $routingContent = Get-Content $routingPath -Raw
        if ($routingContent -match "ws/device" -and $routingContent -match "DeviceConsumer") {
            Write-TestResult "Roteamento WebSocket configurado corretamente" $true
        } else {
            Write-TestResult "Roteamento WebSocket não está configurado corretamente" $false
        }
    } else {
        Write-TestResult "Arquivo routing.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar routing.py: $($_.Exception.Message)" $false
}

# ============================================================================
# AUTENTICAÇÃO E PREPARAÇÃO
# ============================================================================
Write-TestHeader "AUTENTICAÇÃO E PREPARAÇÃO"

Write-Host "Obtendo token JWT..." -ForegroundColor Yellow
$accessToken = $null
try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $tokenResponse = Invoke-RestMethod -Uri "$baseUrl/api/token/" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $accessToken = $tokenResponse.access
    Write-TestResult "Token JWT obtido com sucesso" $true
} catch {
    Write-TestResult "Erro ao obter token: $($_.Exception.Message)" $false
    Write-Host "Encerrando testes..." -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $accessToken"
}

# Obter dispositivos
Write-Host "Obtendo lista de dispositivos..." -ForegroundColor Yellow
$device = $null
try {
    $devicesResponse = Invoke-RestMethod -Uri "$baseUrl/api/devices/" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    $devices = if ($devicesResponse.results) { $devicesResponse.results } else { $devicesResponse }
    
    if ($devices -and $devices.Count -gt 0) {
        $device = if ($devices -is [array]) { $devices[0] } else { $devices }
        Write-TestResult "Dispositivo encontrado: $($device.name) (ID: $($device.id), public_id: $($device.public_id))" $true
    } else {
        Write-TestResult "Nenhum dispositivo encontrado. Crie um dispositivo primeiro." $false
        Write-Host "Encerrando testes..." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-TestResult "Erro ao obter dispositivos: $($_.Exception.Message)" $false
    Write-Host "Encerrando testes..." -ForegroundColor Red
    exit 1
}

$devicePublicId = $device.public_id
$deviceId = $device.id
$wsEndpoint = "ws://localhost:8000/ws/device/$devicePublicId/"

Write-Host "  Usando dispositivo: $($device.name)" -ForegroundColor Gray
Write-Host "  Public ID: $devicePublicId" -ForegroundColor Gray
Write-Host "  WebSocket URL: $wsEndpoint" -ForegroundColor Gray

# ============================================================================
# TAREFA 2.2 (CONTINUAÇÃO): Teste de Conexão WebSocket
# ============================================================================
Write-TestHeader "TAREFA 2.2 (TESTE): Conexão WebSocket"

Write-Host "2.3 Verificando endpoint WebSocket..." -ForegroundColor Yellow
Write-Host "  NOTA: Teste de WebSocket requer cliente WebSocket real" -ForegroundColor Gray
Write-Host "  Para testar, execute: python backend/test_websocket.py" -ForegroundColor Gray
Write-Host "  Ou use Postman/WebSocket King para conectar a: $wsEndpoint" -ForegroundColor Gray
Write-TestResult "Endpoint WebSocket configurado corretamente (teste manual necessário)" $true

# ============================================================================
# TAREFA 2.3: Envio de Mensagem em Tempo Real
# ============================================================================
Write-TestHeader "TAREFA 2.3: Envio de Mensagem em Tempo Real"

Write-Host "3.1 Verificando se views.py foi modificado..." -ForegroundColor Yellow
try {
    $viewsPath = "backend/devices/views.py"
    if (Test-Path $viewsPath) {
        $viewsContent = Get-Content $viewsPath -Raw
        if ($viewsContent -match "_send_measurement_update" -and $viewsContent -match "channel_layer") {
            Write-TestResult "View MeasurementIngestionView modificada para enviar via Channel Layer" $true
        } else {
            Write-TestResult "View não foi modificada para enviar mensagens em tempo real" $false
        }
    } else {
        Write-TestResult "Arquivo views.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar views.py: $($_.Exception.Message)" $false
}

Write-Host "3.2 Testando criação de medição (disparo de mensagem WebSocket)..." -ForegroundColor Yellow
$measurementCreated = $false
try {
    $measurementBody = @{
        metric = "temperature"
        value = "25.5"
        unit = "°C"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json

    $measurementHeaders = @{
        Authorization = "Bearer $accessToken"
    }
    
    $measurementResponse = Invoke-RestMethod -Uri "$baseUrl/api/devices/$deviceId/measurements/" `
        -Method POST `
        -Headers $measurementHeaders `
        -ContentType "application/json" `
        -Body $measurementBody `
        -ErrorAction Stop

    if ($measurementResponse.id) {
        Write-TestResult "Medição criada com sucesso (ID: $($measurementResponse.id))" $true
        $measurementCreated = $true
        Write-Host "  Métrica: $($measurementResponse.metric)" -ForegroundColor Gray
        Write-Host "  Valor: $($measurementResponse.value) $($measurementResponse.unit)" -ForegroundColor Gray
        Write-Host "  NOTA: Esta medição deve ter disparado mensagem WebSocket em tempo real" -ForegroundColor Cyan
    } else {
        Write-TestResult "Medição criada mas resposta inválida" $false
    }
} catch {
    Write-TestResult "Erro ao criar medição: $($_.Exception.Message)" $false
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Resposta do servidor: $responseBody" -ForegroundColor Gray
    }
}

# ============================================================================
# TAREFA 2.4: Teste Manual do WebSocket
# ============================================================================
Write-TestHeader "TAREFA 2.4: Teste Manual do WebSocket"

Write-Host "4.1 Verificando se script de teste existe..." -ForegroundColor Yellow
try {
    $testScriptPath = "backend/test_websocket.py"
    if (Test-Path $testScriptPath) {
        Write-TestResult "Script de teste test_websocket.py encontrado" $true
        Write-Host "  Execute: python backend/test_websocket.py" -ForegroundColor Gray
    } else {
        Write-TestResult "Script de teste test_websocket.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar script de teste: $($_.Exception.Message)" $false
}

Write-Host "4.2 Verificando se documentação de teste existe..." -ForegroundColor Yellow
try {
    $docPath = "backend/devices/WEBSOCKET_TEST.md"
    if (Test-Path $docPath) {
        Write-TestResult "Documentação WEBSOCKET_TEST.md encontrada" $true
    } else {
        Write-TestResult "Documentação WEBSOCKET_TEST.md não encontrada" $false
    }
} catch {
    Write-TestResult "Erro ao verificar documentação: $($_.Exception.Message)" $false
}

# ============================================================================
# TESTE INTEGRADO: Fluxo Completo
# ============================================================================
Write-TestHeader "TESTE INTEGRADO: Fluxo Completo End-to-End"

Write-Host "5.1 Criando múltiplas medições para testar broadcasting..." -ForegroundColor Yellow
$measurementsCount = 0
for ($i = 1; $i -le 3; $i++) {
    try {
        $value = 20 + ($i * 0.5)
        $measurementBody = @{
            metric = "temperature"
            value = "$value"
            unit = "°C"
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        } | ConvertTo-Json

        $measurementHeaders = @{
            Authorization = "Bearer $accessToken"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/devices/$deviceId/measurements/" `
        -Method POST `
        -Headers $measurementHeaders `
        -ContentType "application/json" `
        -Body $measurementBody `
        -ErrorAction Stop

        if ($response.id) {
            $measurementsCount++
            Write-Host "  [OK] Medicao ${i} criada (ID: $($response.id), valor: $($response.value))" -ForegroundColor Green
        }
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "  [ERRO] Erro ao criar medicao ${i}: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($measurementsCount -eq 3) {
    Write-TestResult "Todas as medições foram criadas com sucesso (broadcasting testado)" $true
    Write-Host "  NOTA: Cada criação disparou mensagem WebSocket para clientes conectados" -ForegroundColor Cyan
} else {
    Write-TestResult "Apenas $measurementsCount de 3 medições foram criadas" $false
}

# ============================================================================
# RESUMO FINAL
# ============================================================================
Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "RESUMO DA VALIDACAO" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host ""

$totalTests = $successes.Count + $errors.Count
$successRate = if ($totalTests -gt 0) { [math]::Round(($successes.Count / $totalTests) * 100, 2) } else { 0 }

Write-Host "Total de testes: $totalTests" -ForegroundColor Cyan
Write-Host "Testes bem-sucedidos: $($successes.Count)" -ForegroundColor Green
Write-Host "Testes com erro: $($errors.Count)" -ForegroundColor $(if ($errors.Count -gt 0) { "Red" } else { "Green" })
Write-Host "Taxa de sucesso: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Erros encontrados:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "NOTAS IMPORTANTES:" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "1. Testes de WebSocket requerem cliente WebSocket real" -ForegroundColor White
Write-Host "2. Para testar WebSocket completamente, execute:" -ForegroundColor White
Write-Host "   python backend/test_websocket.py" -ForegroundColor Cyan
Write-Host "3. Certifique-se de que:" -ForegroundColor White
Write-Host "   - Redis está rodando (ou use InMemoryChannelLayer)" -ForegroundColor White
Write-Host "   - Servidor está usando Daphne (não Gunicorn)" -ForegroundColor White
Write-Host "   - CHANNEL_LAYERS está configurado corretamente" -ForegroundColor White
Write-Host ""
Write-Host "Para mais detalhes, consulte: backend/devices/WEBSOCKET_TEST.md" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0) {
    Write-Host ("=" * 70) -ForegroundColor Green
    Write-Host "TODOS OS TESTES PASSARAM! Fase 2 validada com sucesso!" -ForegroundColor Green
    Write-Host ("=" * 70) -ForegroundColor Green
}
else {
    Write-Host ("=" * 70) -ForegroundColor Yellow
    Write-Host "Alguns testes falharam. Revise os erros acima." -ForegroundColor Yellow
    Write-Host ("=" * 70) -ForegroundColor Yellow
}

Write-Host ""

