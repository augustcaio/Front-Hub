# ============================================================================
# SCRIPT AUXILIAR: Criar Dispositivo de Teste
# ============================================================================
# 
# Este script cria um dispositivo de teste para ser usado nos scripts de validação
#
# Uso: .\criar_dispositivo_teste.ps1
# ============================================================================

$baseUrl = "http://localhost:8000"

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "CRIANDO DISPOSITIVO DE TESTE" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

# Autenticação
Write-Host "Obtendo token JWT..." -ForegroundColor Yellow
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
    Write-Host "[OK] Token obtido com sucesso" -ForegroundColor Green
    
    $headers = @{
        Authorization = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
} catch {
    Write-Host "[ERRO] Não foi possível obter token: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se o servidor está rodando e as credenciais estão corretas." -ForegroundColor Yellow
    exit 1
}

# Verificar se já existe dispositivo
Write-Host ""
Write-Host "Verificando dispositivos existentes..." -ForegroundColor Yellow
try {
    $devicesResponse = Invoke-RestMethod -Uri "$baseUrl/api/devices/" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    $devices = if ($devicesResponse.results) { $devicesResponse.results } else { $devicesResponse }
    
    if ($devices -and $devices.Count -gt 0) {
        Write-Host "[OK] Já existem $($devices.Count) dispositivo(s) no sistema" -ForegroundColor Green
        $firstDevice = if ($devices -is [array]) { $devices[0] } else { $devices }
        Write-Host "  Primeiro dispositivo: $($firstDevice.name) (ID: $($firstDevice.id))" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Nenhum dispositivo adicional será criado." -ForegroundColor Cyan
        exit 0
    }
} catch {
    Write-Host "[AVISO] Erro ao verificar dispositivos: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Nota: Como o DeviceViewSet só permite GET (conforme task 1.7),
# não podemos criar dispositivos via API
# O usuário deve criar via admin

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "INSTRUÇÕES PARA CRIAR DISPOSITIVO" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host ""
Write-Host "O endpoint de criação de dispositivos não está disponível via API." -ForegroundColor White
Write-Host "Você precisa criar um dispositivo através do Django Admin:" -ForegroundColor White
Write-Host ""
Write-Host "1. Acesse: http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host "2. Faça login com:" -ForegroundColor Cyan
Write-Host "   - Usuário: admin" -ForegroundColor Gray
Write-Host "   - Senha: admin123" -ForegroundColor Gray
Write-Host "3. Vá em 'Devices' -> 'Add Device'" -ForegroundColor Cyan
Write-Host "4. Preencha:" -ForegroundColor Cyan
Write-Host "   - Name: 'Sensor de Teste'" -ForegroundColor Gray
Write-Host "   - Status: 'Active'" -ForegroundColor Gray
Write-Host "   - Description: 'Dispositivo criado para testes da Fase 4' (opcional)" -ForegroundColor Gray
Write-Host "5. Clique em 'Save'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Após criar o dispositivo, execute novamente:" -ForegroundColor White
Write-Host "  .\test_fase_4_completo.ps1" -ForegroundColor Cyan
Write-Host ""

