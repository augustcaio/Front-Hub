# Script para parar e remover todos os containers

Write-Host "Parando containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
$removeVolumes = Read-Host "Deseja remover volumes também? (s/N)"
if ($removeVolumes -eq "s" -or $removeVolumes -eq "S") {
    Write-Host "Removendo volumes..." -ForegroundColor Yellow
    docker-compose down -v
}

Write-Host ""
Write-Host "Containers parados com sucesso!" -ForegroundColor Green

