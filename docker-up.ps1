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

