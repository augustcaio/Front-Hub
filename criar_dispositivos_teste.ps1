# ============================================================================
# SCRIPT: Criar Dispositivos Fictícios para Testes
# ============================================================================
# 
# Este script executa o script Python que cria dispositivos, medições e alertas
# fictícios para facilitar os testes da aplicação.
#
# Uso: .\criar_dispositivos_teste.ps1
# ============================================================================

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "CRIANDO DISPOSITIVOS FICTÍCIOS PARA TESTES" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "backend/create_test_devices.py")) {
    Write-Host "[ERRO] Arquivo backend/create_test_devices.py não encontrado." -ForegroundColor Red
    Write-Host "Execute este script a partir do diretório raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Verificar se o Docker está rodando
Write-Host "Verificando se o backend está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/token/" -Method GET -ErrorAction SilentlyContinue
    $serverRunning = $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        $serverRunning = $true
        Write-Host "[OK] Servidor está respondendo" -ForegroundColor Green
    } else {
        $serverRunning = $false
        Write-Host "[AVISO] Não foi possível verificar o servidor" -ForegroundColor Yellow
    }
}

if (-not $serverRunning) {
    Write-Host ""
    Write-Host "IMPORTANTE: O servidor backend precisa estar rodando!" -ForegroundColor Yellow
    Write-Host "Execute primeiro: .\docker-up.ps1" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Deseja continuar mesmo assim? (S/N)"
    if ($continue -ne "S" -and $continue -ne "s") {
        exit 1
    }
}

Write-Host ""
Write-Host "Executando script Python..." -ForegroundColor Yellow
Write-Host ""

# Tentar executar via Docker primeiro
try {
    Write-Host "Tentando executar via Docker..." -ForegroundColor Cyan
    docker-compose exec -T backend python create_test_devices.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Script executado com sucesso via Docker!" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "  Docker não disponível, tentando executar localmente..." -ForegroundColor Yellow
}

# Tentar executar localmente
try {
    Write-Host "Executando localmente..." -ForegroundColor Cyan
    cd backend
    python create_test_devices.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Script executado com sucesso!" -ForegroundColor Green
        cd ..
        exit 0
    } else {
        Write-Host ""
        Write-Host "[ERRO] Script falhou com código: $LASTEXITCODE" -ForegroundColor Red
        cd ..
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "[ERRO] Não foi possível executar o script Python." -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente executar manualmente:" -ForegroundColor Yellow
    Write-Host "  docker-compose exec backend python create_test_devices.py" -ForegroundColor Cyan
    Write-Host "Ou:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Cyan
    Write-Host "  python create_test_devices.py" -ForegroundColor Cyan
    cd ..
    exit 1
}

