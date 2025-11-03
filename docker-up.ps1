# Script para subir o ambiente completo (Backend + Frontend + Database)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Front-Hub Stack" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
if (-Not (Test-Path ".env")) {
    Write-Host "AVISO: Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "Criando arquivo .env com valores padrão..." -ForegroundColor Yellow
    
    @"
# Database
POSTGRES_DB=front_hub_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Django
DJANGO_PORT=8000
SECRET_KEY=$(python backend/generate_secret_key.py)
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Frontend
FRONTEND_PORT=4200
"@ | Out-File -FilePath ".env" -Encoding utf8
    
    Write-Host "Arquivo .env criado com valores padrão." -ForegroundColor Green
    Write-Host ""
}

# Parar containers existentes (se houver)
Write-Host "Parando containers existentes..." -ForegroundColor Yellow
docker-compose down 2>$null

# Remover volumes órfãos (opcional)
$removeVolumes = Read-Host "Deseja remover volumes antigos? (s/N)"
if ($removeVolumes -eq "s" -or $removeVolumes -eq "S") {
    Write-Host "Removendo volumes..." -ForegroundColor Yellow
    docker-compose down -v 2>$null
}

Write-Host ""
Write-Host "Construindo e iniciando containers..." -ForegroundColor Cyan
docker-compose up --build -d

Write-Host ""
Write-Host "Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar status dos containers
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Status dos Containers" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
docker-compose ps

Write-Host "" 
Write-Host "Aplicando migrações e semeando dados de demonstração..." -ForegroundColor Yellow

# Função auxiliar para executar comandos no container do backend com retries
function Invoke-BackendCmd {
    param (
        [string]$Cmd,
        [int]$Retries = 12,
        [int]$DelaySeconds = 5
    )
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            docker-compose exec -T backend sh -c $Cmd 2>$null
            if ($LASTEXITCODE -eq 0) { return $true }
        } catch {
            # Ignorar e tentar novamente
        }
        Start-Sleep -Seconds $DelaySeconds
    }
    return $false
}

# Tentar migrações até sucesso
$migrated = Invoke-BackendCmd -Cmd "python manage.py migrate --noinput"
if (-not $migrated) {
    Write-Host "❌ Falha ao aplicar migrações no backend." -ForegroundColor Red
} else {
    Write-Host "✅ Migrações aplicadas." -ForegroundColor Green
}

# Criar/atualizar superusuário padrão (idempotente)
$createdAdmin = Invoke-BackendCmd -Cmd "python backend/create_superuser.py"
if ($createdAdmin) {
    Write-Host "✅ Superusuário verificado/criado." -ForegroundColor Green
}

# Semear 10 dispositivos fakes + medições + alertas (idempotente)
$seeded = Invoke-BackendCmd -Cmd "python manage.py seed_demo_data --devices 10 --with-measurements --with-alerts"
if ($seeded) {
    Write-Host "✅ Dados de demonstração criados." -ForegroundColor Green
} else {
    Write-Host "⚠️  Não foi possível semear dados agora. Verifique logs do backend e rode manualmente: docker-compose exec backend python manage.py seed_demo_data --devices 10 --with-measurements --with-alerts" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Serviços Disponíveis" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:4200" -ForegroundColor Cyan
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:  http://localhost:8000/api/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver os logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "Para parar os serviços:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host ""

