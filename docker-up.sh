#!/usr/bin/env bash

# Script para subir o ambiente completo (Backend + Frontend + Database) no Linux

set -euo pipefail

# Cores
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
GREEN="\033[0;32m"
RED="\033[0;31m"
WHITE="\033[0;37m"
NC="\033[0m" # No Color

echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}  Iniciando Front-Hub Stack${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# Detectar comando Docker Compose (v1: docker-compose, v2: docker compose)
if command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  echo -e "${RED}❌ Docker Compose não encontrado.${NC}"
  echo -e "${WHITE}Instale o Docker Compose v2 (recomendado) ou o v1 legada.${NC}"
  exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}AVISO: Arquivo .env não encontrado!${NC}"
  echo -e "${YELLOW}Criando arquivo .env com valores padrão...${NC}"

  # Detectar interpretador Python disponível
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  else
    echo -e "${RED}❌ Python não encontrado. Instale python3 para continuar.${NC}"
    exit 1
  fi

  # Gerar SECRET_KEY fora do heredoc para evitar erro de substituição
  secret_key="$($PYTHON_BIN backend/generate_secret_key.py)"

  cat > .env <<EOF
# Database
POSTGRES_DB=front_hub_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Django
DJANGO_PORT=8000
SECRET_KEY=${secret_key}
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Frontend
FRONTEND_PORT=4200
EOF

  echo -e "${GREEN}Arquivo .env criado com valores padrão.${NC}"
  echo ""
fi

# Parar containers existentes (se houver)
echo -e "${YELLOW}Parando containers existentes...${NC}"
$DC down >/dev/null 2>&1 || true

# Remover volumes órfãos (opcional)
read -r -p "Deseja remover volumes antigos? (s/N) " removeVolumes
if [[ "${removeVolumes:-N}" == "s" || "${removeVolumes:-N}" == "S" ]]; then
  echo -e "${YELLOW}Removendo volumes...${NC}"
  $DC down -v >/dev/null 2>&1 || true
fi

echo ""
echo -e "${CYAN}Construindo e iniciando containers...${NC}"
$DC up --build -d

echo ""
echo -e "${YELLOW}Aguardando serviços iniciarem...${NC}"
sleep 5

# Verificar status dos containers
echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}  Status dos Containers${NC}"
echo -e "${CYAN}==========================================${NC}"
$DC ps

echo ""
echo -e "${YELLOW}Aplicando migrações e semeando dados de demonstração...${NC}"

# Função auxiliar para executar comandos no container do backend com retries
invoke_backend_cmd() {
  local cmd="$1"
  local retries="${2:-12}"
  local delay_seconds="${3:-5}"

  local i
  for i in $(seq 1 "${retries}"); do
    if $DC exec -T backend sh -c "${cmd}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "${delay_seconds}"
  done
  return 1
}

# Tentar migrações até sucesso
if invoke_backend_cmd "python manage.py migrate --noinput"; then
  echo -e "${GREEN}✅ Migrações aplicadas.${NC}"
else
  echo -e "${RED}❌ Falha ao aplicar migrações no backend.${NC}"
fi

# Criar/atualizar superusuário padrão (idempotente)
if invoke_backend_cmd "python backend/create_superuser.py"; then
  echo -e "${GREEN}✅ Superusuário verificado/criado.${NC}"
fi

# Semear 10 dispositivos fakes + medições + alertas (idempotente)
if invoke_backend_cmd "python manage.py seed_demo_data --devices 10 --with-measurements --with-alerts"; then
  echo -e "${GREEN}✅ Dados de demonstração criados.${NC}"
else
  echo -e "${YELLOW}⚠️  Não foi possível semear dados agora. Verifique logs do backend e rode manualmente:${NC}"
  echo -e "${WHITE}  $DC exec backend python manage.py seed_demo_data --devices 10 --with-measurements --with-alerts${NC}"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Serviços Disponíveis${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${CYAN}Frontend:  http://localhost:4200${NC}"
echo -e "${CYAN}Backend:   http://localhost:8000${NC}"
echo -e "${CYAN}API Docs:  http://localhost:8000/api/${NC}"
echo ""
echo -e "${YELLOW}Para ver os logs:${NC}"
echo -e "${WHITE}  $DC logs -f${NC}"
echo ""
echo -e "${YELLOW}Para parar os serviços:${NC}"
echo -e "${WHITE}  $DC down${NC}"
echo ""


