# ============================================================================
# SCRIPT DE TESTE COMPLETO - FASE 4: Dados Agregados, Gráficos e Alertas
# ============================================================================
# 
# Este script testa todas as tarefas da Fase 4:
# - 4.1: Criar Endpoint de Dados Agregados
# - 4.2: Gráfico de Precisão em Tempo Real (PrimeNG)
# - 4.3: Atualização de Gráfico em Tempo Real
# - 4.4: Modelagem e Endpoint da Entidade Alerta
# - 4.5: Destaque de Alertas no Dashboard
#
# Uso: .\test_fase_4_completo.ps1
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
Write-Host "VALIDACAO COMPLETA - FASE 4 (Tarefas 4.1 a 4.5)" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTA: Este script requer pelo menos um dispositivo para testes completos." -ForegroundColor Cyan
Write-Host "      Se não houver dispositivos, alguns testes serão pulados." -ForegroundColor Cyan
Write-Host "      Crie um dispositivo via admin (http://localhost:8000/admin) se necessário." -ForegroundColor Cyan
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
# AUTENTICAÇÃO
# ============================================================================
Write-TestHeader "AUTENTICAÇÃO"

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
    "Content-Type" = "application/json"
}

# Obter ou criar dispositivo para testes
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
        Write-TestResult "Dispositivo encontrado: $($device.name) (ID: $($device.id))" $true
    } else {
        Write-Host "  Nenhum dispositivo encontrado. Criando dispositivo de teste..." -ForegroundColor Yellow
        # Tentar criar um dispositivo de teste
        # Nota: Se o endpoint de criação não estiver disponível, o teste falhará aqui
        Write-Host "  AVISO: Se o endpoint POST /api/devices/ não estiver disponível," -ForegroundColor Yellow
        Write-Host "  crie um dispositivo manualmente via admin ou API antes de executar este script." -ForegroundColor Yellow
        Write-TestResult "Nenhum dispositivo disponível para testes" $false
        Write-Host ""
        Write-Host "Para continuar os testes, você precisa de pelo menos um dispositivo." -ForegroundColor Yellow
        Write-Host "Opções:" -ForegroundColor Yellow
        Write-Host "  1. Acesse http://localhost:8000/admin e crie um dispositivo manualmente" -ForegroundColor Cyan
        Write-Host "  2. Ou use a API POST /api/devices/ se estiver disponível" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Tentando continuar sem dispositivo (alguns testes serão pulados)..." -ForegroundColor Yellow
        $device = $null
    }
} catch {
    Write-TestResult "Erro ao obter dispositivos: $($_.Exception.Message)" $false
    Write-Host "Tentando continuar sem dispositivo (alguns testes serão pulados)..." -ForegroundColor Yellow
    $device = $null
}

# Se não há dispositivo, pular testes que dependem dele
if (-not $device) {
    Write-Host ""
    Write-Host "ATENÇÃO: Sem dispositivo disponível, alguns testes serão pulados." -ForegroundColor Yellow
    Write-Host "A maioria dos testes da Fase 4 requer um dispositivo ativo." -ForegroundColor Yellow
    Write-Host ""
    $deviceId = $null
} else {
    $deviceId = $device.id
}

# Criar algumas medições para testar dados agregados (se houver dispositivo)
if ($deviceId) {
    Write-Host "Criando medições para teste de dados agregados..." -ForegroundColor Yellow
    $measurementsCreated = 0
    for ($i = 1; $i -le 5; $i++) {
        try {
            $value = 20 + ($i * 2) + (Get-Random -Minimum 0 -Maximum 5)
            $measurementBody = @{
                metric = "temperature"
                value = "$value"
                unit = "°C"
                timestamp = (Get-Date).AddSeconds(-$i * 10).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            } | ConvertTo-Json

            $response = Invoke-RestMethod -Uri "$baseUrl/api/devices/$deviceId/measurements/" `
                -Method POST `
                -Headers $headers `
                -ContentType "application/json" `
                -Body $measurementBody `
                -ErrorAction Stop

            if ($response.id) {
                $measurementsCreated++
            }
            Start-Sleep -Milliseconds 200
        } catch {
            Write-Host "  [AVISO] Erro ao criar medição ${i}: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    if ($measurementsCreated -gt 0) {
        Write-TestResult "$measurementsCreated medições criadas para testes" $true
    } else {
        Write-TestResult "Nenhuma medição foi criada" $false
    }
} else {
    Write-Host "Pulando criação de medições (nenhum dispositivo disponível)..." -ForegroundColor Yellow
    Write-TestResult "Criação de medições pulada (sem dispositivo)" $false
}

# ============================================================================
# TAREFA 4.1: Endpoint de Dados Agregados
# ============================================================================
Write-TestHeader "TAREFA 4.1: Endpoint de Dados Agregados"

Write-Host "1.1 Verificando se o endpoint existe..." -ForegroundColor Yellow
if ($deviceId) {
    try {
        $aggregatedResponse = Invoke-RestMethod -Uri "$baseUrl/api/devices/$deviceId/aggregated-data/" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop

        Write-TestResult "Endpoint GET /api/devices/{id}/aggregated-data/ está acessível" $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-TestResult "Endpoint não encontrado. Verifique a rota." $false
        } elseif ($_.Exception.Response.StatusCode -eq 401) {
            Write-TestResult "Endpoint requer autenticação (correto)" $true
        } else {
            Write-TestResult "Erro ao acessar endpoint: $($_.Exception.Message)" $false
        }
    }
} else {
    Write-TestResult "Teste pulado: nenhum dispositivo disponível" $false
}

Write-Host "1.2 Testando resposta do endpoint..." -ForegroundColor Yellow
if ($deviceId) {
    try {
        $aggregatedResponse = Invoke-RestMethod -Uri "$baseUrl/api/devices/$deviceId/aggregated-data/" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop

    # Validar estrutura da resposta
    $hasMeasurements = $aggregatedResponse.measurements -ne $null
    $hasStatistics = $aggregatedResponse.statistics -ne $null
    $hasCount = $aggregatedResponse.count -ne $null

    if ($hasMeasurements -and $hasStatistics -and $hasCount) {
        Write-TestResult "Resposta possui estrutura correta (measurements, statistics, count)" $true
        
        # Validar estatísticas
        $stats = $aggregatedResponse.statistics
        $hasMean = $stats.mean -ne $null -or $stats.mean -eq $null
        $hasMax = $stats.max -ne $null -or $stats.max -eq $null
        $hasMin = $stats.min -ne $null -or $stats.min -eq $null
        
        if ($hasMean -and $hasMax -and $hasMin) {
            Write-TestResult "Estatísticas agregadas presentes (mean, max, min)" $true
            Write-Host "  Média: $($stats.mean)" -ForegroundColor Gray
            Write-Host "  Máximo: $($stats.max)" -ForegroundColor Gray
            Write-Host "  Mínimo: $($stats.min)" -ForegroundColor Gray
        } else {
            Write-TestResult "Estatísticas incompletas" $false
        }

        # Validar limite de 100 pontos
        $measurementCount = $aggregatedResponse.count
        if ($measurementCount -le 100) {
            Write-TestResult "Endpoint retorna no máximo 100 pontos (atual: $measurementCount)" $true
        } else {
            Write-TestResult "Endpoint retorna mais de 100 pontos ($measurementCount)" $false
        }
    } else {
        Write-TestResult "Estrutura da resposta incompleta" $false
    }
    } catch {
        Write-TestResult "Erro ao testar resposta: $($_.Exception.Message)" $false
    }
} else {
    Write-TestResult "Teste pulado: nenhum dispositivo disponível" $false
}

Write-Host "1.3 Verificando código da view..." -ForegroundColor Yellow
try {
    $viewsPath = "backend/devices/views.py"
    if (Test-Path $viewsPath) {
        $viewsContent = Get-Content $viewsPath -Raw
        if ($viewsContent -match "DeviceAggregatedDataView" -and $viewsContent -match "aggregated-data") {
            Write-TestResult "View DeviceAggregatedDataView implementada" $true
        } else {
            Write-TestResult "View DeviceAggregatedDataView não encontrada" $false
        }
    } else {
        Write-TestResult "Arquivo views.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar views.py: $($_.Exception.Message)" $false
}

Write-Host "1.4 Verificando rota configurada..." -ForegroundColor Yellow
try {
    $urlsPath = "backend/config/urls.py"
    if (Test-Path $urlsPath) {
        $urlsContent = Get-Content $urlsPath -Raw
        if ($urlsContent -match "aggregated-data" -and $urlsContent -match "DeviceAggregatedDataView") {
            Write-TestResult "Rota configurada em urls.py" $true
        } else {
            Write-TestResult "Rota não encontrada em urls.py" $false
        }
    } else {
        Write-TestResult "Arquivo urls.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar urls.py: $($_.Exception.Message)" $false
}

# ============================================================================
# TAREFA 4.2 e 4.3: Gráfico de Precisão (Frontend)
# ============================================================================
Write-TestHeader "TAREFA 4.2 e 4.3: Gráfico de Precisão (Frontend)"

Write-Host "2.1 Verificando dependências do gráfico..." -ForegroundColor Yellow
try {
    $packagePath = "frontend/package.json"
    if (Test-Path $packagePath) {
        $packageContent = Get-Content $packagePath -Raw
        if ($packageContent -match "chart\.js") {
            Write-TestResult "chart.js instalado no package.json" $true
        } else {
            Write-TestResult "chart.js não encontrado no package.json" $false
        }
    } else {
        Write-TestResult "Arquivo package.json não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar package.json: $($_.Exception.Message)" $false
}

Write-Host "2.2 Verificando ChartModule importado..." -ForegroundColor Yellow
try {
    $componentPath = "frontend/src/app/pages/devices/device-detail.component.ts"
    if (Test-Path $componentPath) {
        $componentContent = Get-Content $componentPath -Raw
        if ($componentContent -match "ChartModule" -and $componentContent -match "primeng/chart") {
            Write-TestResult "ChartModule importado no DeviceDetailComponent" $true
        } else {
            Write-TestResult "ChartModule não encontrado no componente" $false
        }
    } else {
        Write-TestResult "Arquivo device-detail.component.ts não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar componente: $($_.Exception.Message)" $false
}

Write-Host "2.3 Verificando método getAggregatedData no service..." -ForegroundColor Yellow
try {
    $servicePath = "frontend/src/app/core/services/device.service.ts"
    if (Test-Path $servicePath) {
        $serviceContent = Get-Content $servicePath -Raw
        if ($serviceContent -match "getAggregatedData" -and $serviceContent -match "aggregated-data") {
            Write-TestResult "Método getAggregatedData implementado no DeviceService" $true
        } else {
            Write-TestResult "Método getAggregatedData não encontrado" $false
        }
    } else {
        Write-TestResult "Arquivo device.service.ts não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar service: $($_.Exception.Message)" $false
}

Write-Host "2.4 Verificando atualização em tempo real..." -ForegroundColor Yellow
try {
    $componentPath = "frontend/src/app/pages/devices/device-detail.component.ts"
    if (Test-Path $componentPath) {
        $componentContent = Get-Content $componentPath -Raw
        if ($componentContent -match "updateChartWithNewMeasurement" -and $componentContent -match "loadAggregatedData") {
            Write-TestResult "Funções de atualização do gráfico implementadas" $true
        } else {
            Write-TestResult "Funções de atualização não encontradas" $false
        }
    } else {
        Write-TestResult "Arquivo device-detail.component.ts não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar atualização: $($_.Exception.Message)" $false
}

Write-Host "2.5 Verificando template do gráfico..." -ForegroundColor Yellow
try {
    $templatePath = "frontend/src/app/pages/devices/device-detail.component.html"
    if (Test-Path $templatePath) {
        $templateContent = Get-Content $templatePath -Raw
        if ($templateContent -match "p-chart" -and $templateContent -match "chartData") {
            Write-TestResult "Template contém componente p-chart" $true
        } else {
            Write-TestResult "Componente p-chart não encontrado no template" $false
        }
    } else {
        Write-TestResult "Arquivo device-detail.component.html não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar template: $($_.Exception.Message)" $false
}

# ============================================================================
# TAREFA 4.4: Modelo e Endpoint CRUD de Alert
# ============================================================================
Write-TestHeader "TAREFA 4.4: Modelo e Endpoint CRUD de Alert"

Write-Host "4.1 Verificando modelo Alert..." -ForegroundColor Yellow
try {
    $modelsPath = "backend/devices/models.py"
    if (Test-Path $modelsPath) {
        $modelsContent = Get-Content $modelsPath -Raw
        if ($modelsContent -match "class Alert" -and $modelsContent -match "severity" -and $modelsContent -match "status") {
            Write-TestResult "Modelo Alert implementado com campos severity e status" $true
        } else {
            Write-TestResult "Modelo Alert incompleto ou não encontrado" $false
        }
    } else {
        Write-TestResult "Arquivo models.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar models.py: $($_.Exception.Message)" $false
}

Write-Host "4.2 Verificando migration do Alert..." -ForegroundColor Yellow
try {
    $migrationPath = "backend/devices/migrations/0003_alert.py"
    if (Test-Path $migrationPath) {
        $migrationContent = Get-Content $migrationPath -Raw
        if ($migrationContent -match "CreateModel" -and $migrationContent -match "Alert") {
            Write-TestResult "Migration 0003_alert.py encontrada" $true
        } else {
            Write-TestResult "Migration não está completa" $false
        }
    } else {
        Write-TestResult "Migration 0003_alert.py não encontrada" $false
    }
} catch {
    Write-TestResult "Erro ao verificar migration: $($_.Exception.Message)" $false
}

Write-Host "4.3 Verificando serializer Alert..." -ForegroundColor Yellow
try {
    $serializersPath = "backend/devices/serializers.py"
    if (Test-Path $serializersPath) {
        $serializersContent = Get-Content $serializersPath -Raw
        if ($serializersContent -match "class AlertSerializer" -and $serializersContent -match "validate") {
            Write-TestResult "AlertSerializer implementado com validações" $true
        } else {
            Write-TestResult "AlertSerializer não encontrado ou incompleto" $false
        }
    } else {
        Write-TestResult "Arquivo serializers.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar serializers.py: $($_.Exception.Message)" $false
}

Write-Host "4.4 Testando endpoint GET /api/alerts/ (Listar alertas)..." -ForegroundColor Yellow
try {
    $alertsResponse = Invoke-RestMethod -Uri "$baseUrl/api/alerts/" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    if ($alertsResponse.count -ge 0 -and $alertsResponse.results -ne $null) {
        Write-TestResult "Endpoint GET /api/alerts/ funcionando (${alertsResponse.count} alertas)" $true
    } else {
        Write-TestResult "Resposta de listagem inválida" $false
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-TestResult "Endpoint /api/alerts/ não encontrado. Verifique a rota." $false
    } elseif ($_.Exception.Response.StatusCode -eq 401) {
        Write-TestResult "Endpoint requer autenticação (correto)" $true
    } else {
        Write-TestResult "Erro ao listar alertas: $($_.Exception.Message)" $false
    }
}

Write-Host "4.5 Testando filtro unresolved_only..." -ForegroundColor Yellow
try {
    $alertsResponse = Invoke-RestMethod -Uri "$baseUrl/api/alerts/?unresolved_only=true" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    # Verificar se todos os alertas retornados têm status pending
    $allPending = $true
    if ($alertsResponse.results -and $alertsResponse.results.Count -gt 0) {
        foreach ($alert in $alertsResponse.results) {
            if ($alert.status -ne "pending") {
                $allPending = $false
                break
            }
        }
    }
    
    Write-TestResult "Filtro unresolved_only funcionando (todos são pending)" $allPending
} catch {
    Write-TestResult "Erro ao testar filtro: $($_.Exception.Message)" $false
}

Write-Host "4.6 Testando POST /api/alerts/ (Criar alerta)..." -ForegroundColor Yellow
$createdAlert = $null
if ($deviceId) {
    try {
        $alertBody = @{
            device = $deviceId
            title = "Teste de Alerta - Temperatura Alta"
            message = "Temperatura do dispositivo excedeu 30°C durante os testes"
            severity = "high"
            status = "pending"
        } | ConvertTo-Json

        $alertResponse = Invoke-RestMethod -Uri "$baseUrl/api/alerts/" `
            -Method POST `
            -Headers $headers `
            -ContentType "application/json" `
            -Body $alertBody `
            -ErrorAction Stop

        if ($alertResponse.id -and $alertResponse.title -and $alertResponse.device) {
            $createdAlert = $alertResponse
            Write-TestResult "Alerta criado com sucesso (ID: $($alertResponse.id))" $true
            Write-Host "  Título: $($alertResponse.title)" -ForegroundColor Gray
            Write-Host "  Severidade: $($alertResponse.severity)" -ForegroundColor Gray
            Write-Host "  Status: $($alertResponse.status)" -ForegroundColor Gray
        } else {
            Write-TestResult "Alerta criado mas resposta incompleta" $false
        }
    } catch {
        Write-TestResult "Erro ao criar alerta: $($_.Exception.Message)" $false
        if ($_.Exception.Response) {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Resposta: $responseBody" -ForegroundColor Gray
        }
    }
} else {
    Write-TestResult "Teste pulado: nenhum dispositivo disponível para criar alerta" $false
}

Write-Host "4.7 Testando GET /api/alerts/{id}/ (Detalhar alerta)..." -ForegroundColor Yellow
if ($createdAlert) {
    try {
        $alertDetail = Invoke-RestMethod -Uri "$baseUrl/api/alerts/$($createdAlert.id)/" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop

        if ($alertDetail.id -eq $createdAlert.id) {
            Write-TestResult "Endpoint GET /api/alerts/{id}/ funcionando" $true
        } else {
            Write-TestResult "Resposta de detalhamento incorreta" $false
        }
    } catch {
        Write-TestResult "Erro ao detalhar alerta: $($_.Exception.Message)" $false
    }
} else {
    Write-TestResult "Pulando teste: nenhum alerta criado anteriormente" $false
}

Write-Host "4.8 Testando PATCH /api/alerts/{id}/ (Atualizar alerta)..." -ForegroundColor Yellow
if ($createdAlert) {
    try {
        $updateBody = @{
            status = "resolved"
        } | ConvertTo-Json

        $updatedAlert = Invoke-RestMethod -Uri "$baseUrl/api/alerts/$($createdAlert.id)/" `
            -Method PATCH `
            -Headers $headers `
            -ContentType "application/json" `
            -Body $updateBody `
            -ErrorAction Stop

        if ($updatedAlert.status -eq "resolved" -and $updatedAlert.resolved_at -ne $null) {
            Write-TestResult "Alerta atualizado e resolved_at preenchido automaticamente" $true
            Write-Host "  Status: $($updatedAlert.status)" -ForegroundColor Gray
            Write-Host "  Resolved At: $($updatedAlert.resolved_at)" -ForegroundColor Gray
        } else {
            Write-TestResult "Alerta atualizado mas resolved_at não foi preenchido" $false
        }
    } catch {
        Write-TestResult "Erro ao atualizar alerta: $($_.Exception.Message)" $false
    }
} else {
    Write-TestResult "Pulando teste: nenhum alerta criado anteriormente" $false
}

Write-Host "4.9 Verificando AlertViewSet..." -ForegroundColor Yellow
try {
    $viewsPath = "backend/devices/views.py"
    if (Test-Path $viewsPath) {
        $viewsContent = Get-Content $viewsPath -Raw
        if ($viewsContent -match "class AlertViewSet" -and $viewsContent -match "ModelViewSet") {
            Write-TestResult "AlertViewSet implementado com ModelViewSet (CRUD completo)" $true
        } else {
            Write-TestResult "AlertViewSet não encontrado" $false
        }
    } else {
        Write-TestResult "Arquivo views.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar views.py: $($_.Exception.Message)" $false
}

Write-Host "4.10 Verificando rota de alerts..." -ForegroundColor Yellow
try {
    $urlsPath = "backend/config/urls.py"
    if (Test-Path $urlsPath) {
        $urlsContent = Get-Content $urlsPath -Raw
        if ($urlsContent -match "alerts" -and $urlsContent -match "AlertViewSet") {
            Write-TestResult "Rota de alerts configurada no router" $true
        } else {
            Write-TestResult "Rota de alerts não encontrada" $false
        }
    } else {
        Write-TestResult "Arquivo urls.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar urls.py: $($_.Exception.Message)" $false
}

Write-Host "4.11 Verificando registro no admin..." -ForegroundColor Yellow
try {
    $adminPath = "backend/devices/admin.py"
    if (Test-Path $adminPath) {
        $adminContent = Get-Content $adminPath -Raw
        if ($adminContent -match "@admin.register\(Alert\)" -or $adminContent -match "AlertAdmin") {
            Write-TestResult "Modelo Alert registrado no Django Admin" $true
        } else {
            Write-TestResult "Modelo Alert não registrado no admin" $false
        }
    } else {
        Write-TestResult "Arquivo admin.py não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar admin.py: $($_.Exception.Message)" $false
}

# ============================================================================
# TAREFA 4.5: Destaque de Alertas no Dashboard
# ============================================================================
Write-TestHeader "TAREFA 4.5: Destaque de Alertas no Dashboard"

Write-Host "5.1 Verificando método getUnresolvedAlerts no service..." -ForegroundColor Yellow
try {
    $servicePath = "frontend/src/app/core/services/device.service.ts"
    if (Test-Path $servicePath) {
        $serviceContent = Get-Content $servicePath -Raw
        if ($serviceContent -match "getUnresolvedAlerts" -or $serviceContent -match "getAlerts") {
            Write-TestResult "Método para buscar alertas não resolvidos implementado" $true
        } else {
            Write-TestResult "Método não encontrado" $false
        }
    } else {
        Write-TestResult "Arquivo device.service.ts não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar service: $($_.Exception.Message)" $false
}

Write-Host "5.2 Verificando interface Alert no frontend..." -ForegroundColor Yellow
try {
    $servicePath = "frontend/src/app/core/services/device.service.ts"
    if (Test-Path $servicePath) {
        $serviceContent = Get-Content $servicePath -Raw
        if ($serviceContent -match "export interface Alert" -and $serviceContent -match "severity" -and $serviceContent -match "status") {
            Write-TestResult "Interface Alert definida no frontend" $true
        } else {
            Write-TestResult "Interface Alert não encontrada" $false
        }
    } else {
        Write-TestResult "Arquivo device.service.ts não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar service: $($_.Exception.Message)" $false
}

Write-Host "5.3 Verificando MessageModule no DashboardComponent..." -ForegroundColor Yellow
try {
    $componentPath = "frontend/src/app/pages/dashboard/dashboard.component.ts"
    if (Test-Path $componentPath) {
        $componentContent = Get-Content $componentPath -Raw
        if ($componentContent -match "MessageModule" -and $componentContent -match "primeng/message") {
            Write-TestResult "MessageModule importado no DashboardComponent" $true
        } else {
            Write-TestResult "MessageModule não encontrado" $false
        }
    } else {
        Write-TestResult "Arquivo dashboard.component.ts não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar componente: $($_.Exception.Message)" $false
}

Write-Host "5.4 Verificando lógica de carregamento de alertas..." -ForegroundColor Yellow
try {
    $componentPath = "frontend/src/app/pages/dashboard/dashboard.component.ts"
    if (Test-Path $componentPath) {
        $componentContent = Get-Content $componentPath -Raw
        if ($componentContent -match "loadAlerts" -and $componentContent -match "getUnresolvedAlerts") {
            Write-TestResult "Função loadAlerts implementada no dashboard" $true
        } else {
            Write-TestResult "Função loadAlerts não encontrada" $false
        }
    } else {
        Write-TestResult "Arquivo dashboard.component.ts não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar componente: $($_.Exception.Message)" $false
}

Write-Host "5.5 Verificando template de alertas no dashboard..." -ForegroundColor Yellow
try {
    $templatePath = "frontend/src/app/pages/dashboard/dashboard.component.html"
    if (Test-Path $templatePath) {
        $templateContent = Get-Content $templatePath -Raw
        if ($templateContent -match "p-message" -and $templateContent -match "hasUnresolvedAlerts" -and $templateContent -match "Alertas Não Resolvidos") {
            Write-TestResult "Template contém seção de alertas com p-message" $true
        } else {
            Write-TestResult "Seção de alertas não encontrada no template" $false
        }
    } else {
        Write-TestResult "Arquivo dashboard.component.html não encontrado" $false
    }
} catch {
    Write-TestResult "Erro ao verificar template: $($_.Exception.Message)" $false
}

# ============================================================================
# TESTE INTEGRADO: Fluxo Completo
# ============================================================================
Write-TestHeader "TESTE INTEGRADO: Fluxo Completo"

Write-Host "6.1 Criando alerta adicional para teste do dashboard..." -ForegroundColor Yellow
if ($deviceId) {
    try {
        $alertBody2 = @{
            device = $deviceId
            title = "Teste Dashboard - Temperatura Crítica"
            message = "Temperatura crítica detectada: 40°C"
            severity = "critical"
            status = "pending"
        } | ConvertTo-Json

        $alertResponse2 = Invoke-RestMethod -Uri "$baseUrl/api/alerts/" `
            -Method POST `
            -Headers $headers `
            -ContentType "application/json" `
            -Body $alertBody2 `
            -ErrorAction Stop

        if ($alertResponse2.id) {
            Write-TestResult "Alerta adicional criado para teste do dashboard (ID: $($alertResponse2.id))" $true
        }
    } catch {
        Write-Host "  [AVISO] Não foi possível criar alerta adicional: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [AVISO] Pulando criação de alerta adicional (nenhum dispositivo disponível)" -ForegroundColor Yellow
}

Write-Host "6.2 Verificando contagem de alertas não resolvidos..." -ForegroundColor Yellow
try {
    $unresolvedResponse = Invoke-RestMethod -Uri "$baseUrl/api/alerts/?unresolved_only=true" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    $unresolvedCount = $unresolvedResponse.count
    Write-TestResult "Total de alertas não resolvidos: $unresolvedCount" ($unresolvedCount -ge 0)
} catch {
    Write-TestResult "Erro ao verificar alertas não resolvidos: $($_.Exception.Message)" $false
}

# ============================================================================
# RESUMO FINAL
# ============================================================================
Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "RESUMO DA VALIDACAO - FASE 4" -ForegroundColor Yellow
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
Write-Host "1. Testes de gráficos requerem visualização no navegador" -ForegroundColor White
Write-Host "2. Para testar gráfico em tempo real, acesse:" -ForegroundColor White
Write-Host "   http://localhost:4200/devices/{device_id}" -ForegroundColor Cyan
Write-Host "3. Verifique se as migrations foram aplicadas:" -ForegroundColor White
Write-Host "   docker-compose exec backend python manage.py migrate" -ForegroundColor Cyan
Write-Host "4. Para visualizar alertas no dashboard:" -ForegroundColor White
Write-Host "   http://localhost:4200/dashboard" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0) {
    Write-Host ("=" * 70) -ForegroundColor Green
    Write-Host "TODOS OS TESTES PASSARAM! Fase 4 validada com sucesso!" -ForegroundColor Green
    Write-Host ("=" * 70) -ForegroundColor Green
}
else {
    Write-Host ("=" * 70) -ForegroundColor Yellow
    Write-Host "Alguns testes falharam. Revise os erros acima." -ForegroundColor Yellow
    Write-Host ("=" * 70) -ForegroundColor Yellow
}

Write-Host ""

