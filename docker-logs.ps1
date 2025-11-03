# Script para visualizar logs dos containers

param(
    [string]$Service = "",
    [switch]$Follow = $false
)

$followFlag = if ($Follow) { "-f" } else { "" }

if ($Service) {
    Write-Host "Exibindo logs do serviço: $Service" -ForegroundColor Cyan
    docker-compose logs $followFlag $Service
} else {
    Write-Host "Exibindo logs de todos os serviços" -ForegroundColor Cyan
    docker-compose logs $followFlag
}

