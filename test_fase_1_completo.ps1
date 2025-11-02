# Script de Validacao Completa - Fase 1 (Tarefas 1.1 a 1.8)
# Execute: .\test_fase_1_completo.ps1

$baseUrl = "http://localhost:8000"
$errors = @()
$successes = @()

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
Write-Host "VALIDACAO COMPLETA - FASE 1 (Tarefas 1.1 a 1.8)" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# TESTE 1: Autenticacao JWT (Tarefa 1.4)
# ============================================================================
Write-TestHeader "1. Autenticacao JWT (Tarefa 1.4)"

# 1.1 Obter Token
Write-Host "1.1 Testando POST /api/token/ (Obter token)..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-RestMethod -Uri "$baseUrl/api/token/" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    $accessToken = $tokenResponse.access
    $refreshToken = $tokenResponse.refresh
    
    if ($accessToken -and $refreshToken) {
        Write-TestResult "Token obtido com sucesso (access + refresh)" $true
    }
    else {
        Write-TestResult "Token incompleto (faltam access ou refresh)" $false
    }
}
catch {
    Write-TestResult "Erro ao obter token: $($_.Exception.Message)" $false
    Write-Host "ERRO CRITICO: Nao e possivel continuar sem autenticacao" -ForegroundColor Red
    exit 1
}

# 1.2 Verificar Token
Write-Host "1.2 Testando POST /api/token/verify/ (Verificar token)..." -ForegroundColor Yellow
$verifyBody = @{
    token = $accessToken
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/token/verify/" `
        -Method POST `
        -ContentType "application/json" `
        -Body $verifyBody `
        -ErrorAction Stop | Out-Null
    
    Write-TestResult "Token verificado com sucesso" $true
}
catch {
    Write-TestResult "Erro ao verificar token: $($_.Exception.Message)" $false
}

# 1.3 Refresh Token
Write-Host "1.3 Testando POST /api/token/refresh/ (Atualizar token)..." -ForegroundColor Yellow
$refreshBody = @{
    refresh = $refreshToken
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/api/token/refresh/" `
        -Method POST `
        -ContentType "application/json" `
        -Body $refreshBody `
        -ErrorAction Stop
    
    if ($refreshResponse.access) {
        Write-TestResult "Token atualizado com sucesso" $true
        $accessToken = $refreshResponse.access  # Atualizar token
    }
    else {
        Write-TestResult "Resposta de refresh incompleta" $false
    }
}
catch {
    Write-TestResult "Erro ao atualizar token: $($_.Exception.Message)" $false
}

# Preparar headers para proximos testes
$headers = @{
    Authorization = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

# ============================================================================
# TESTE 2: Endpoints de Devices - Listar (Tarefa 1.7)
# ============================================================================
Write-TestHeader "2. Endpoints de Devices - Listar (Tarefa 1.7)"

Write-Host "2.1 Testando GET /api/devices/ (Listar dispositivos)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/devices/" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($response.count -ge 0 -and $response.results) {
        Write-TestResult "Listagem de dispositivos funcionando (${response.count} encontrados)" $true
    }
    else {
        Write-TestResult "Resposta de listagem invalida" $false
    }
}
catch {
    Write-TestResult "Erro ao listar dispositivos: $($_.Exception.Message)" $false
}

# ============================================================================
# TESTE 3: Endpoints de Devices - Detalhar (Tarefa 1.7)
# ============================================================================
Write-TestHeader "3. Endpoints de Devices - Detalhar (Tarefa 1.7)"

Write-Host "3.1 Testando GET /api/devices/1/ (Detalhar dispositivo)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/devices/1/" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    if ($response.id -and $response.name -and $response.public_id) {
        Write-TestResult "Detalhamento de dispositivo funcionando" $true
        Write-Host "  Dispositivo: $($response.name) (ID: $($response.id), public_id: $($response.public_id))" -ForegroundColor Gray
    }
    else {
        Write-TestResult "Resposta de detalhamento incompleta" $false
    }
}
catch {
    Write-TestResult "Erro ao detalhar dispositivo: $($_.Exception.Message)" $false
}

# ============================================================================
# TESTE 4: Endpoint de Ingestao de Medicao (Tarefa 1.8)
# ============================================================================
Write-TestHeader "4. Endpoint de Ingestao de Medicao (Tarefa 1.8)"

Write-Host "4.1 Testando POST /api/devices/1/measurements/ (Criar medicao)..." -ForegroundColor Yellow
$measurementBody = @{
    metric = "temperature"
    value = "22.5"
    unit = "°C"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/devices/1/measurements/" `
        -Method POST `
        -Headers $headers `
        -Body $measurementBody `
        -ErrorAction Stop
    
    if ($response.id -and $response.device -and $response.metric -and $response.value) {
        Write-TestResult "Medicao criada com sucesso (ID: $($response.id))" $true
        Write-Host "  Medicao: $($response.metric)=$($response.value) $($response.unit)" -ForegroundColor Gray
    }
    else {
        Write-TestResult "Resposta de criacao de medicao incompleta" $false
    }
}
catch {
    Write-TestResult "Erro ao criar medicao: $($_.Exception.Message)" $false
}

# 4.2 Testar com dispositivo diferente
Write-Host "4.2 Testando POST /api/devices/2/measurements/ (Criar medicao em outro dispositivo)..." -ForegroundColor Yellow
$measurementBody2 = @{
    metric = "pressure"
    value = "1013.25"
    unit = "hPa"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/devices/2/measurements/" `
        -Method POST `
        -Headers $headers `
        -Body $measurementBody2 `
        -ErrorAction Stop
    
    if ($response.device -eq 2) {
        Write-TestResult "Medicao criada para dispositivo diferente (Device ID: $($response.device))" $true
    }
    else {
        Write-TestResult "Medicao associada ao dispositivo errado" $false
    }
}
catch {
    Write-TestResult "Erro ao criar medicao em outro dispositivo: $($_.Exception.Message)" $false
}

# ============================================================================
# TESTE 5: Validacoes do Serializer (Tarefa 1.8)
# ============================================================================
Write-TestHeader "5. Validacoes do Serializer (Tarefa 1.8)"

# 5.1 Metric muito curto
Write-Host "5.1 Testando validacao: metric muito curto..." -ForegroundColor Yellow
$invalidBody = @{
    metric = "p"
    value = "1013.25"
    unit = "hPa"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/devices/1/measurements/" `
        -Method POST `
        -Headers $headers `
        -Body $invalidBody `
        -ErrorAction Stop
    
    Write-TestResult "Validacao falhou: deveria rejeitar metric muito curto" $false
}
catch {
    if ($_.Exception.Response.StatusCode -eq 'BadRequest') {
        Write-TestResult "Validacao funcionando: metric muito curto rejeitado" $true
    }
    else {
        Write-TestResult "Erro inesperado na validacao: $($_.Exception.Message)" $false
    }
}

# 5.2 Unit vazio
Write-Host "5.2 Testando validacao: unit vazio..." -ForegroundColor Yellow
$invalidBody2 = @{
    metric = "temperature"
    value = "25.5"
    unit = ""
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/devices/1/measurements/" `
        -Method POST `
        -Headers $headers `
        -Body $invalidBody2 `
        -ErrorAction Stop
    
    Write-TestResult "Validacao falhou: deveria rejeitar unit vazio" $false
}
catch {
    if ($_.Exception.Response.StatusCode -eq 'BadRequest') {
        Write-TestResult "Validacao funcionando: unit vazio rejeitado" $true
    }
    else {
        Write-TestResult "Erro inesperado na validacao: $($_.Exception.Message)" $false
    }
}

# ============================================================================
# TESTE 6: Seguranca - Endpoints sem autenticacao (Tarefa 1.7 e 1.8)
# ============================================================================
Write-TestHeader "6. Seguranca - Endpoints sem autenticacao"

# 6.1 Devices sem auth
Write-Host "6.1 Testando GET /api/devices/ SEM autenticacao..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/devices/" `
        -Method GET `
        -ErrorAction Stop
    
    Write-TestResult "FALHA DE SEGURANCA: endpoint deveria requerer autenticacao" $false
}
catch {
    if ($_.Exception.Response.StatusCode -eq 'Unauthorized') {
        Write-TestResult "Seguranca OK: endpoint de devices requer autenticacao" $true
    }
    else {
        Write-TestResult "Erro inesperado na seguranca: $($_.Exception.Message)" $false
    }
}

# 6.2 Measurements sem auth
Write-Host "6.2 Testando POST /api/devices/1/measurements/ SEM autenticacao..." -ForegroundColor Yellow
$testBody = @{
    metric = "test"
    value = "1.0"
    unit = "unit"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/devices/1/measurements/" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testBody `
        -ErrorAction Stop
    
    Write-TestResult "FALHA DE SEGURANCA: endpoint deveria requerer autenticacao" $false
}
catch {
    if ($_.Exception.Response.StatusCode -eq 'Unauthorized') {
        Write-TestResult "Seguranca OK: endpoint de measurements requer autenticacao" $true
    }
    else {
        Write-TestResult "Erro inesperado na seguranca: $($_.Exception.Message)" $false
    }
}

# ============================================================================
# TESTE 7: Device inexistente (Tarefa 1.8)
# ============================================================================
Write-TestHeader "7. Tratamento de Erros - Device inexistente"

Write-Host "7.1 Testando POST /api/devices/999/measurements/ (Device inexistente)..." -ForegroundColor Yellow
$testBody = @{
    metric = "temperature"
    value = "25.5"
    unit = "°C"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/devices/999/measurements/" `
        -Method POST `
        -Headers $headers `
        -Body $testBody `
        -ErrorAction Stop
    
    Write-TestResult "FALHA: deveria retornar 404 para device inexistente" $false
}
catch {
    if ($_.Exception.Response.StatusCode -eq 'NotFound') {
        Write-TestResult "Tratamento de erro OK: 404 para device inexistente" $true
    }
    else {
        Write-TestResult "Erro inesperado: $($_.Exception.Message)" $false
    }
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
if ($errors.Count -eq 0) {
    Write-Host ("=" * 70) -ForegroundColor Green
    Write-Host "TODOS OS TESTES PASSARAM! Fase 1 validada com sucesso!" -ForegroundColor Green
    Write-Host ("=" * 70) -ForegroundColor Green
}
else {
    Write-Host ("=" * 70) -ForegroundColor Yellow
    Write-Host "Alguns testes falharam. Revise os erros acima." -ForegroundColor Yellow
    Write-Host ("=" * 70) -ForegroundColor Yellow
}

Write-Host ""

