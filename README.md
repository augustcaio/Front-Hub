# Front-Hub

Sistema de gerenciamento e monitoramento de dispositivos IoT em tempo real, com interface web moderna e comunicação via WebSockets.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Capturas de Tela](#capturas-de-tela)
- [Comandos Úteis](#comandos-úteis)
- [Troubleshooting](#troubleshooting)
- [Testes](#testes)
- [CI/CD (GitHub Actions)](#cicd-github-actions)

## 🎯 Sobre o Projeto

Front-Hub é uma aplicação full-stack moderna para gerenciamento e monitoramento de dispositivos IoT em tempo real. Desenvolvida com tecnologias de ponta, oferece uma experiência completa de gerenciamento de dispositivos conectados.

### Funcionalidades Principais

- **🔐 Autenticação Segura**: Sistema de login e registro com JWT tokens
- **📱 Gerenciamento de Dispositivos**: CRUD completo de dispositivos IoT
- **📊 Dashboard Interativo**: Visualização de estatísticas e dados agregados
- **⚡ Monitoramento em Tempo Real**: Recebimento de medições via WebSockets
- **🚨 Sistema de Alertas**: Notificações e gerenciamento de alertas por dispositivo
- **📈 Gráficos em Tempo Real**: Visualização de medições com Chart.js
- **🏷️ Categorização**: Organização de dispositivos por categorias
- **🔍 Busca e Filtros**: Busca por nome e filtros por status e categoria
- **📄 Paginação**: Navegação eficiente em listas grandes

### Arquitetura

O Front-Hub segue uma arquitetura de três camadas:

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente (Browser)                       │
│                  Angular 15 + PrimeNG + TailwindCSS        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Frontend (Nginx)                          │
│              Porta 4200 → Proxy Reverso                      │
│   ┌────────────────────────────────────────────────────┐   │
│   │  /api/*  → Proxy → Backend                         │   │
│   │  /ws/*   → WebSocket Proxy → Backend                │   │
│   │  /*      → index.html (SPA Routing)                 │   │
│   └────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Internal Network
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend (Daphne/ASGI)                      │
│              Porta 8000 → API REST + WebSockets            │
│   ┌────────────────────────────────────────────────────┐   │
│   │  Django REST Framework (API)                       │   │
│   │  Django Channels (WebSockets)                      │   │
│   │  Simple JWT (Autenticação)                        │   │
│   └──────────────────────┬───────────────────────────┘   │
└────────────────────────────┼───────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                │   PostgreSQL│  Redis     │
                │            │            │
      ┌─────────▼─────┐  ┌──▼──────────┐
      │  PostgreSQL 14 │  │  Redis 7     │
      │  Porta 5432    │  │  Porta 6379  │
      └────────────────┘  └─────────────┘
                      (DB)  (Channel Layer)
```

### Fluxo de Dados

1. **Autenticação**: Cliente faz login → Backend valida → Retorna JWT token
2. **Listagem de Dispositivos**: Cliente solicita → Backend consulta DB → Retorna JSON
3. **Medições em Tempo Real**: Cliente conecta WebSocket → Backend envia medições → Cliente atualiza gráfico
4. **Criação de Dispositivo**: Cliente envia formulário → Backend valida → Salva no DB → Retorna sucesso

## 🚀 Tecnologias

### Backend

- **Django 4.2+**: Framework web Python
- **Django REST Framework**: API REST
- **Django Channels**: Suporte a WebSockets
- **PostgreSQL**: Banco de dados relacional
- **Redis**: Channel Layer para escalabilidade de WebSockets
- **JWT (Simple JWT)**: Autenticação baseada em tokens
- **Daphne**: Servidor ASGI para WebSockets

### Frontend

- **Angular 15**: Framework web TypeScript
- **PrimeNG**: Componentes UI
- **Chart.js**: Gráficos e visualizações
- **Tailwind CSS**: Estilização
- **RxJS**: Programação reativa

### DevOps

- **Docker**: Containerização
- **Docker Compose**: Orquestração de containers
- **Nginx**: Servidor web para frontend (produção)

## 📁 Estrutura do Projeto

```
Front-Hub/
├── backend/                      # Backend Django
│   ├── accounts/                 # App de autenticação e usuários
│   │   ├── models.py            # Modelo de usuário customizado
│   │   ├── serializers.py       # Serializers JWT (login/registro)
│   │   ├── views.py             # Views de autenticação
│   │   ├── urls.py              # Rotas de autenticação
│   │   ├── tests.py             # Testes unitários
│   │   └── admin.py             # Registro no Django Admin
│   ├── devices/                  # App de dispositivos IoT
│   │   ├── models.py            # Device, Measurement, Alert, Category
│   │   ├── serializers.py       # Serializers da API REST
│   │   ├── views.py             # ViewSets (CRUD completo)
│   │   ├── consumers.py         # WebSocket consumers
│   │   ├── routing.py           # Rotas WebSocket
│   │   ├── tests.py             # Testes de integração (APITestCase)
│   │   ├── admin.py             # Registro no Django Admin
│   │   ├── API_ENDPOINTS.md     # Documentação dos endpoints
│   │   ├── MEASUREMENT_INGESTION.md  # Como enviar medições
│   │   └── WEBSOCKET_TEST.md    # Como testar WebSockets
│   ├── config/                   # Configurações Django
│   │   ├── settings.py          # Configurações principais
│   │   ├── urls.py              # URLs principais (API routing)
│   │   ├── asgi.py              # Configuração ASGI (WebSockets)
│   │   └── wsgi.py              # Configuração WSGI
│   ├── init_db.py               # Script de inicialização do BD
│   ├── manage.py                # Script de gerenciamento Django
│   ├── requirements.txt         # Dependências Python
│   ├── Dockerfile               # Imagem Docker do backend
│   ├── .coveragerc              # Configuração de cobertura de testes
│   └── setup.cfg                # Configuração flake8 e coverage
├── frontend/                     # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/            # Funcionalidades core
│   │   │   │   ├── guards/      # Route guards (auth, redirect)
│   │   │   │   ├── interceptors/# HTTP interceptors (JWT)
│   │   │   │   ├── services/    # Services (Auth, Device, WebSocket)
│   │   │   │   ├── types/       # Tipos TypeScript
│   │   │   │   └── utils/       # Funções utilitárias
│   │   │   ├── layout/          # Componentes de layout
│   │   │   │   ├── components/
│   │   │   │   │   ├── header/ # Cabeçalho com menu
│   │   │   │   │   └── sidebar/ # Menu lateral
│   │   │   │   └── layout.component.*
│   │   │   └── pages/           # Páginas da aplicação
│   │   │       ├── dashboard/   # Dashboard principal
│   │   │       ├── devices/     # CRUD de dispositivos
│   │   │       ├── login/       # Página de login
│   │   │       ├── register/    # Página de registro
│   │   │       └── account/      # Detalhes da conta
│   │   ├── assets/              # Assets estáticos
│   │   ├── index.html           # HTML principal
│   │   └── main.ts              # Entry point
│   ├── Dockerfile               # Imagem Docker (multi-stage)
│   ├── nginx.conf               # Configuração Nginx (proxy reverso)
│   ├── package.json             # Dependências Node.js
│   └── angular.json             # Configuração Angular
├── docs/
│   └── screenshots/             # Capturas de tela da aplicação
├── docker-compose.yml           # Configuração Docker Compose
├── docker-compose.dev.yml       # Override para desenvolvimento
├── docker-up.ps1                # Script PowerShell para subir ambiente
├── docker-down.ps1              # Script PowerShell para parar ambiente
├── docker-logs.ps1              # Script PowerShell para ver logs
├── .gitignore                   # Arquivos ignorados pelo Git
├── .env                         # Variáveis de ambiente (criado automaticamente)
└── README.md                    # Este arquivo
```

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** (versão 20.10 ou superior)
- **Docker Compose** (versão 2.0 ou superior)
- **Git** (para clonar o repositório)
- **PowerShell** (Windows) ou **Bash** (Linux/Mac)

### Verificar Instalação

```bash
# Verificar Docker
docker --version

# Verificar Docker Compose
docker-compose --version
```

## 🛠️ Instalação e Execução

### Quick Start (Rápido)

O Front-Hub pode ser executado rapidamente usando Docker Compose. Siga estes passos simples:

**Windows (PowerShell):**

```powershell
# 1. Clone o repositório
git clone <url-do-repositorio>
cd Front-Hub

# 2. Execute o script de inicialização (cria .env automaticamente)
.\docker-up.ps1

# 3. Aguarde os containers iniciarem (30-60 segundos)
# 4. Acesse: http://localhost:4200
```

**Linux/Mac:**

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd Front-Hub

# 2. Crie o arquivo .env (veja seção abaixo)
# 3. Execute Docker Compose
docker-compose up --build -d

# 4. Aguarde os containers iniciarem (30-60 segundos)
# 5. Acesse: http://localhost:4200
```

### Passo a Passo Detalhado

#### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd Front-Hub
```

#### 2. Configurar Variáveis de Ambiente

O arquivo `.env` será criado automaticamente pelo script `docker-up.ps1` (Windows). No Linux/Mac, crie manualmente:

**Windows (PowerShell):**

```powershell
.\docker-up.ps1
# O script pergunta se deseja criar/atualizar o .env automaticamente
```

**Linux/Mac:**

```bash
# Criar arquivo .env manualmente
cat > .env << EOF
# Database
POSTGRES_DB=front_hub_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Django
DJANGO_SECRET_KEY=$(python3 backend/generate_secret_key.py)
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_PORT=8000

# JWT
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=86400

# Frontend
FRONTEND_PORT=4200
EOF
```

#### 3. Executar com Docker Compose

**Windows (PowerShell):**

```powershell
# Opção 1: Usar script automatizado
.\docker-up.ps1

# Opção 2: Executar manualmente
docker-compose up --build -d
```

**Linux/Mac:**

```bash
# Subir todos os serviços em background
docker-compose up --build -d

# Ou em foreground (ver logs em tempo real)
docker-compose up --build
```

#### 4. Verificar Status dos Containers

Aguarde cerca de 30-60 segundos para todos os serviços iniciarem, depois verifique:

```bash
docker-compose ps
```

Você deve ver quatro containers com status `Up (healthy)`:

- ✅ `front_hub_db` (PostgreSQL)
- ✅ `front_hub_redis` (Redis)
- ✅ `front_hub_backend` (Django/Daphne)
- ✅ `front_hub_frontend` (Angular/Nginx)

**Verificar logs se necessário:**

```bash
# Todos os logs
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

#### 5. Acessar a Aplicação

Após os containers iniciarem completamente:

| Serviço          | URL                          | Descrição                        |
| ---------------- | ---------------------------- | -------------------------------- |
| **Frontend**     | http://localhost:4200        | Interface principal da aplicação |
| **Backend API**  | http://localhost:8000/api/   | API REST do backend              |
| **API Docs**     | http://localhost:8000/api/   | Documentação interativa da API   |
| **Admin Django** | http://localhost:8000/admin/ | Painel administrativo Django     |

#### 6. Credenciais Padrão

O banco de dados é inicializado automaticamente com um usuário administrador:

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANTE**:

- **NÃO** use essas credenciais em produção!
- Altere imediatamente após a primeira execução
- Para criar um novo superusuário:
  ```bash
  docker-compose exec backend python manage.py createsuperuser
  ```

### Primeiro Acesso

1. **Acesse**: http://localhost:4200
2. **Faça login** com as credenciais padrão (`admin` / `admin123`)
3. **Explore o Dashboard** com estatísticas dos dispositivos
4. **Gerencie dispositivos** na seção "Dispositivos"
5. **Visualize dados em tempo real** ao abrir os detalhes de um dispositivo

## 🔧 Variáveis de Ambiente

### Arquivo `.env`

O arquivo `.env` na raiz do projeto contém todas as configurações necessárias:

```env
# Database
POSTGRES_DB=front_hub_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Django
DJANGO_SECRET_KEY=sua-chave-secreta-aqui
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_PORT=8000

# JWT Tokens
JWT_ACCESS_TOKEN_LIFETIME=3600      # 1 hora em segundos
JWT_REFRESH_TOKEN_LIFETIME=86400   # 24 horas em segundos

# Frontend
FRONTEND_PORT=4200

# Redis (Channel Layer para WebSockets)
REDIS_HOST=redis  # Use 'redis' no Docker, 'localhost' em desenvolvimento local
REDIS_PORT=6379
```

### Gerar Secret Key

Para gerar uma nova secret key:

```bash
python backend/generate_secret_key.py
```

## 📂 Estrutura de Diretórios Detalhada

### Backend (`/backend`)

```
backend/
├── accounts/                    # App de autenticação e usuários
│   ├── migrations/              # Migrações do banco de dados
│   ├── models.py               # Modelo de usuário customizado
│   ├── serializers.py          # Serializers JWT (login/registro/token)
│   ├── views.py                # Views de autenticação e registro
│   ├── urls.py                 # Rotas: /token/, /token/refresh/, /register/
│   ├── tests.py                # Testes unitários e de integração
│   ├── admin.py                # Registro no Django Admin
│   └── README.md               # Documentação do app
├── devices/                      # App de dispositivos IoT
│   ├── migrations/              # Migrações (Device, Measurement, Alert, Category)
│   ├── models.py               # Models: Device, Measurement, Alert, Category
│   ├── serializers.py          # Serializers para API REST
│   ├── views.py                # ViewSets: DeviceViewSet, CategoryViewSet
│   ├── consumers.py            # WebSocket consumers (medições em tempo real)
│   ├── routing.py              # Rotas WebSocket (/ws/device/<public_id>/)
│   ├── urls.py                 # URLs da API REST
│   ├── tests.py                # Testes de integração (APITestCase)
│   ├── admin.py                # Registro no Django Admin
│   ├── API_ENDPOINTS.md        # Documentação dos endpoints
│   ├── MEASUREMENT_INGESTION.md # Como enviar medições via API
│   └── WEBSOCKET_TEST.md       # Como testar WebSockets
├── config/                       # Configurações Django
│   ├── settings.py             # Configurações principais (DB, CORS, JWT, etc.)
│   ├── urls.py                 # URLs principais (inclui rotas das apps)
│   ├── asgi.py                 # Configuração ASGI (suporta WebSockets)
│   └── wsgi.py                 # Configuração WSGI
├── init_db.py                   # Script de inicialização (usuários, dispositivos, etc.)
├── create_superuser.py          # Script para criar superusuário
├── create_test_devices.py       # Script para criar dispositivos de teste
├── generate_secret_key.py       # Script para gerar SECRET_KEY
├── test_websocket.py            # Script de teste de WebSocket
├── healthcheck.py               # Script de healthcheck para Docker
├── manage.py                    # Script de gerenciamento Django
├── requirements.txt             # Dependências Python
├── Dockerfile                   # Imagem Docker do backend
├── .coveragerc                  # Configuração de cobertura de testes
└── setup.cfg                    # Configuração flake8 e coverage
```

**Principais Endpoints da API:**

- `/api/token/` - Obter JWT token (login)
- `/api/token/refresh/` - Renovar access token
- `/api/token/verify/` - Verificar token
- `/api/register/` - Registrar novo usuário
- `/api/devices/` - CRUD de dispositivos
- `/api/devices/<id>/` - Detalhes do dispositivo
- `/api/devices/<id>/aggregated-data/` - Dados agregados
- `/api/categories/` - CRUD de categorias
- `/api/alerts` - Listar alertas
- `/ws/device/<public_id>/` - WebSocket para medições em tempo real

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                   # Funcionalidades core
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts          # Guard de autenticação
│   │   │   │   └── auth-redirect.guard.ts # Redireciona se autenticado
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts    # Interceptor JWT
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts        # Serviço de autenticação
│   │   │   │   ├── auth.service.spec.ts   # Testes do AuthService
│   │   │   │   ├── device.service.ts      # Serviço de dispositivos
│   │   │   │   ├── device.service.spec.ts # Testes do DeviceService
│   │   │   │   └── websocket.service.ts   # Serviço WebSocket
│   │   │   ├── types/
│   │   │   │   └── chart.types.ts         # Tipos para Chart.js
│   │   │   └── utils/
│   │   │       ├── alert.utils.ts         # Utilitários de alertas
│   │   │       ├── constants.ts           # Constantes da aplicação
│   │   │       ├── date.utils.ts          # Formatação de datas
│   │   │       └── device.utils.ts        # Utilitários de dispositivos
│   │   ├── layout/                       # Componentes de layout
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   │   ├── header.component.ts      # Cabeçalho com menu
│   │   │   │   │   ├── header.component.html
│   │   │   │   │   └── header.component.spec.ts # Testes
│   │   │   │   └── sidebar/
│   │   │   │       ├── sidebar.component.ts     # Menu lateral
│   │   │   │       └── sidebar.component.html
│   │   │   ├── layout.component.ts
│   │   │   └── layout.component.html
│   │   └── pages/                          # Páginas da aplicação
│   │       ├── dashboard/
│   │       │   ├── dashboard.component.ts      # Dashboard principal
│   │       │   └── dashboard.component.html
│   │       ├── devices/
│   │       │   ├── devices-list.component.*   # Lista de dispositivos
│   │       │   ├── device-detail.component.*   # Detalhes do dispositivo
│   │       │   ├── device-form.component.*     # Formulário de dispositivo
│   │       │   └── devices.routes.ts           # Rotas lazy loading
│   │       ├── login/
│   │       │   ├── login.component.ts          # Página de login
│   │       │   ├── login.component.html
│   │       │   └── login.component.spec.ts     # Testes
│   │       ├── register/
│   │       │   ├── register.component.ts       # Página de registro
│   │       │   ├── register.component.html
│   │       │   └── register.component.spec.ts  # Testes
│   │       └── account/
│   │           ├── account-details.component.* # Detalhes da conta
│   │           └── account-details.component.spec.ts
│   ├── assets/                        # Assets estáticos (imagens, etc.)
│   ├── index.html                     # HTML principal
│   ├── main.ts                        # Entry point da aplicação
│   └── styles.css                     # Estilos globais
├── dist/                              # Build de produção (gerado)
│   └── frontend-hub/                  # Arquivos otimizados
├── Dockerfile                         # Imagem Docker (multi-stage build)
├── nginx.conf                         # Configuração Nginx (proxy reverso)
├── package.json                       # Dependências Node.js
├── angular.json                       # Configuração Angular
├── tailwind.config.js                # Configuração Tailwind CSS
└── tsconfig.json                     # Configuração TypeScript
```

### Arquivos de Configuração na Raiz

```
Front-Hub/
├── docker-compose.yml                # Configuração Docker Compose
├── docker-compose.dev.yml            # Override para desenvolvimento
├── docker-up.ps1                     # Script PowerShell (Windows)
├── docker-down.ps1                   # Script para parar containers
├── docker-logs.ps1                   # Script para ver logs
├── .env                              # Variáveis de ambiente (gitignored)
├── .gitignore                        # Arquivos ignorados pelo Git
└── README.md                         # Este arquivo
```

## 📸 Capturas de Tela

Esta seção exibe as principais telas e funcionalidades da aplicação Front-Hub.

### Como Adicionar Capturas de Tela

Para adicionar suas próprias capturas de tela:

1. Execute a aplicação localmente
2. Capture as telas desejadas (use ferramentas como Snipping Tool, Lightshot, etc.)
3. Salve as imagens na pasta `docs/screenshots/` com os seguintes nomes:
   - `login.png` - Tela de login
   - `register.png` - Tela de registro
   - `dashboard.png` - Dashboard principal
   - `devices-list.png` - Lista de dispositivos
   - `device-detail.png` - Detalhes do dispositivo
   - `device-form.png` - Formulário de cadastro/edição
   - `alerts.png` - Painel de alertas
   - `account-details.png` - Detalhes da conta

### Telas Principais

#### 1. Tela de Login

![Login Screen](docs/screenshots/login.png)
_Tela de login com autenticação JWT. Permite acesso seguro à aplicação._

**Funcionalidades:**

- Validação de credenciais em tempo real
- Mensagens de erro claras
- Link para registro de novos usuários
- Redirecionamento automático após login

#### 2. Tela de Registro

![Register Screen](docs/screenshots/register.png)
_Formulário de registro de novos usuários. Após registro, o usuário é autenticado automaticamente._

**Funcionalidades:**

- Validação de formulário reativo
- Validação de formato de username
- Verificação de correspondência de senhas
- Autenticação automática após registro
- Redirecionamento para dashboard

#### 3. Dashboard Principal

![Dashboard](docs/screenshots/dashboard.png)
_Dashboard com visão geral dos dispositivos e estatísticas em tempo real._

**Funcionalidades:**

- Cards com estatísticas (Total, Ativos, Inativos, etc.)
- Lista de dispositivos recentes
- Lista de alertas pendentes
- Atualização em tempo real
- Links rápidos para ações principais

#### 4. Lista de Dispositivos

![Devices List](docs/screenshots/devices-list.png)
_Lista completa de dispositivos com filtros, busca e paginação._

**Funcionalidades:**

- Busca por nome
- Filtro por status (Ativo, Inativo, Manutenção, Erro)
- Filtro por categoria
- Paginação
- Ações: Visualizar, Editar, Excluir
- Botão "Novo Dispositivo"

#### 5. Formulário de Dispositivo

![Device Form](docs/screenshots/device-form.png)
_Formulário para cadastro e edição de dispositivos com validações._

**Funcionalidades:**

- Campos: Nome, Status, Descrição, Categoria
- Validação em tempo real
- Dropdown de categorias carregado dinamicamente
- Mensagens de sucesso/erro
- Botão cancelar retorna à lista

#### 6. Detalhes do Dispositivo

![Device Detail](docs/screenshots/device-detail.png)
_Página de detalhes com gráficos em tempo real via WebSocket._

**Funcionalidades:**

- Informações do dispositivo
- Gráfico de medições em tempo real (Chart.js)
- Estatísticas agregadas (média, máximo, mínimo)
- Lista de medições recentes
- Conexão WebSocket para atualização em tempo real
- Status da conexão WebSocket visível

#### 7. Painel de Alertas

![Alerts](docs/screenshots/alerts.png)
_Visualização de alertas e notificações do sistema._

**Funcionalidades:**

- Filtro por dispositivo
- Filtro por severidade (High, Medium, Low)
- Filtro por status (Pending, Resolved)
- Ações para resolver alertas

#### 8. Detalhes da Conta

![Account Details](docs/screenshots/account-details.png)
_Informações do usuário logado e opção de logout._

**Funcionalidades:**

- Exibição de dados do usuário
- Data de criação da conta
- Último login
- Botão de logout

> **Nota**: As capturas de tela acima referem-se às imagens na pasta `docs/screenshots/`. Se as imagens não estiverem disponíveis, adicione-as seguindo as instruções acima.

## 🎮 Comandos Úteis

### Docker Compose

```bash
# Subir serviços
docker-compose up -d

# Subir e reconstruir imagens
docker-compose up --build -d

# Parar serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Ver status dos containers
docker-compose ps

# Executar comando no container backend
docker-compose exec backend python manage.py <comando>

# Executar comando no container frontend
docker-compose exec frontend sh
```

### Scripts PowerShell (Windows)

```powershell
# Subir ambiente completo
.\docker-up.ps1

# Parar ambiente
.\docker-down.ps1

# Ver logs
.\docker-logs.ps1
```

### Django (dentro do container)

```bash
# Acessar container backend
docker-compose exec backend bash

# Criar superusuário
docker-compose exec backend python manage.py createsuperuser

# Executar migrations
docker-compose exec backend python manage.py migrate

# Coletar arquivos estáticos
docker-compose exec backend python manage.py collectstatic

# Executar testes
docker-compose exec backend python manage.py test

# Shell Django
docker-compose exec backend python manage.py shell
```

### Desenvolvimento Local (sem Docker)

#### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar banco de dados
python manage.py migrate

# Inicializar banco
python init_db.py

# Rodar servidor
python manage.py runserver
```

#### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm start
# ou
ng serve

# Executar testes
npm test
# ou
ng test

# Build de produção
npm run build
```

## 🔍 Troubleshooting

### Containers não iniciam

```bash
# Verificar logs
docker-compose logs

# Verificar se as portas estão disponíveis
netstat -ano | findstr :8000
netstat -ano | findstr :4200
netstat -ano | findstr :5432
```

### Erro de conexão com banco de dados

1. Verifique se o container do PostgreSQL está rodando:

   ```bash
   docker-compose ps db
   ```

2. Verifique as variáveis de ambiente no `.env`

3. Aguarde alguns segundos após iniciar - o PostgreSQL precisa de tempo para inicializar

### Frontend não conecta ao backend

1. Verifique se o backend está acessível: http://localhost:8000/api/
2. Verifique as configurações de CORS no `backend/config/settings.py`
3. Verifique se ambos os containers estão na mesma rede Docker
4. O frontend usa proxy reverso através do Nginx - certifique-se de que as requisições `/api/` e `/ws/` estão sendo roteadas corretamente

### Arquitetura Docker Compose

#### Serviços Configurados

1. **db** (PostgreSQL)

   - Banco de dados relacional
   - Volume persistente para dados
   - Healthcheck para garantir disponibilidade

2. **redis** (Redis)

   - Channel Layer para Django Channels (WebSockets)
   - Volume persistente para dados (AOF - Append Only File)
   - Healthcheck para garantir disponibilidade
   - Permite escalabilidade horizontal de WebSockets

3. **backend** (Django/Daphne)

   - Servidor ASGI com suporte a WebSockets
   - Expõe API REST em `/api/`
   - WebSockets em `/ws/`
   - Conectado às redes `backend_network` e `frontend_network`
   - Depende de `db` e `redis` estar saudáveis antes de iniciar

4. **frontend** (Angular/Nginx)
   - Build multi-stage: Node.js para build + Nginx para servir
   - Servidor Nginx com proxy reverso
   - Rotas `/api/` → proxy para `backend:8000`
   - Rotas `/ws/` → proxy para WebSocket `backend:8000`
   - SPA routing para rotas do Angular
   - Cache de assets estáticos
   - Conectado à rede `frontend_network` e `backend_network` (para proxy)

#### Proxy Reverso Nginx

O Nginx no container frontend configura:

- **API REST** (`/api/*`): Todas as requisições são proxyadas para o backend
- **WebSockets** (`/ws/*`): Conexões WebSocket são upgradeadas e proxyadas
- **SPA Routing**: Todas as outras rotas retornam `index.html` para suportar rotas do Angular

**Vantagens:**

- Frontend e backend na mesma origem (sem problemas de CORS)
- Simplifica configuração de URLs no código
- Melhor para produção (uma única porta exposta)

#### Build e Deploy

**Modo Produção (padrão):**

```bash
docker-compose up --build
```

- Build Angular otimizado (minificação, tree-shaking)
- Imagem final contém apenas Nginx + assets compilados
- Tamanho reduzido da imagem final

**Modo Desenvolvimento:**

```bash
# Opção 1: Desenvolvimento local (fora do Docker)
cd frontend && npm start

# Opção 2: Usar docker-compose.dev.yml (se configurado)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Erro ao fazer login

1. Verifique se o banco foi inicializado: `python init_db.py`
2. Crie um novo superusuário se necessário:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

### WebSocket não conecta

1. Verifique se o Daphne está rodando (servidor ASGI)
2. Verifique se o Redis está rodando e saudável:
   ```bash
   docker-compose ps redis
   docker-compose logs redis
   ```
3. Verifique os logs do backend para erros de conexão com Redis:
   ```bash
   docker-compose logs -f backend
   ```
4. Teste a conexão com Redis manualmente:
   ```bash
   docker-compose exec redis redis-cli ping
   # Deve retornar: PONG
   ```

### Limpar tudo e recomeçar

```bash
# Parar e remover containers, volumes e imagens
docker-compose down -v --rmi all

# Limpar cache do Docker (opcional)
docker system prune -a

# Subir novamente
docker-compose up --build -d
```

## 📝 Desenvolvimento

### Executar Testes

#### Backend

```bash
# Todos os testes
docker-compose exec backend python manage.py test

# Testes de uma app específica
docker-compose exec backend python manage.py test accounts
docker-compose exec backend python manage.py test devices

# Testes com relatório de cobertura
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
docker-compose exec backend coverage html

# Ver relatório HTML de cobertura (após executar coverage html)
# Os arquivos estarão em: backend/htmlcov/index.html
# Para acessar via Docker:
docker-compose exec backend ls -la htmlcov/
```

#### Frontend

```bash
cd frontend
npm test
```

### Linter e Qualidade de Código

#### Backend (Flake8)

```bash
# Executar linter no código backend
docker-compose exec backend flake8 .

# Executar linter em um diretório específico
docker-compose exec backend flake8 devices/

# Executar linter com saída detalhada
docker-compose exec backend flake8 . --statistics --count
```

### Cobertura de Testes

O projeto utiliza `coverage.py` para gerar relatórios de cobertura de código. A configuração está em:

- `backend/.coveragerc` - Configuração principal do coverage
- `backend/setup.cfg` - Configurações adicionais (coverage e flake8)

**Comandos úteis:**

```bash
# 1. Executar testes com coverage
docker-compose exec backend coverage run --source='.' manage.py test

# 2. Gerar relatório textual no terminal
docker-compose exec backend coverage report

# 3. Gerar relatório HTML (mais detalhado)
docker-compose exec backend coverage html

# 4. Ver apenas a cobertura geral (útil para CI/CD)
docker-compose exec backend coverage report --show-missing | tail -1

# 5. Combinar comandos (executar testes e gerar relatório)
docker-compose exec backend coverage run --source='.' manage.py test && coverage report
```

**Estrutura do relatório de cobertura:**

- Relatório textual: exibido no terminal
- Relatório HTML: arquivos em `backend/htmlcov/`
  - Abra `backend/htmlcov/index.html` no navegador para ver a cobertura detalhada
  - Cada arquivo mostra quais linhas foram testadas e quais não foram

**Arquivos excluídos da cobertura:**

- Migrações Django (`*/migrations/*`)
- Arquivos de configuração (`manage.py`, `settings/*`, `urls.py`, etc.)
- Scripts utilitários (`init_db.py`, `create_superuser.py`, etc.)
- Código de teste (`*/tests/*`, `test_*.py`)

### Estrutura de Testes

- **Backend**:
  - Testes unitários para Models e Serializers (Django TestCase)
  - Testes de integração para ViewSets e endpoints API (APITestCase)
  - Validação de permissões JWT e comportamento CRUD
- **Frontend**: Testes unitários para Services (Jasmine/Karma)

## 🏗️ Arquitetura Técnica

### Stack Tecnológica Completa

| Camada              | Tecnologia     | Versão | Propósito                         |
| ------------------- | -------------- | ------ | --------------------------------- |
| **Frontend**        | Angular        | 15.x   | Framework SPA                     |
| **UI Components**   | PrimeNG        | 15.x   | Componentes de interface          |
| **Estilização**     | Tailwind CSS   | 3.x    | Utility-first CSS                 |
| **Gráficos**        | Chart.js       | 3.x    | Visualizações de dados            |
| **Backend**         | Django         | 4.2+   | Framework web Python              |
| **API**             | DRF            | 3.14+  | API REST                          |
| **WebSockets**      | Channels       | 4.0+   | Comunicação em tempo real         |
| **Servidor**        | Daphne         | 4.0+   | Servidor ASGI                     |
| **Banco de Dados**  | PostgreSQL     | 14     | Banco relacional                  |
| **Autenticação**    | Simple JWT     | 5.2+   | Tokens JWT                        |
| **Containerização** | Docker         | 20.10+ | Isolamento de serviços            |
| **Orquestração**    | Docker Compose | 2.0+   | Gerenciamento de containers       |
| **Web Server**      | Nginx          | Alpine | Proxy reverso e servidor estático |

### Padrões de Desenvolvimento

- **Backend**:

  - Type Hints em todas as funções
  - `ModelViewSet` para CRUD completo
  - Service Layer Pattern
  - Testes de integração com `APITestCase`
  - Cobertura de testes com `coverage.py`

- **Frontend**:
  - Standalone Components (Angular 15+)
  - Reactive Forms
  - Change Detection: `OnPush`
  - Lazy Loading de rotas
  - Testes unitários com Jasmine/Karma

### Estrutura de API

A API REST segue padrões RESTful:

- `GET /api/devices/` - Lista todos os dispositivos
- `POST /api/devices/` - Cria novo dispositivo
- `GET /api/devices/{id}/` - Detalhes do dispositivo
- `PUT /api/devices/{id}/` - Atualiza dispositivo completo
- `PATCH /api/devices/{id}/` - Atualiza dispositivo parcialmente
- `DELETE /api/devices/{id}/` - Remove dispositivo
- `GET /api/devices/{id}/aggregated-data/` - Dados agregados

## 🔒 Segurança

### Implementações de Segurança

- **JWT Tokens**: Autenticação stateless
- **Refresh Tokens**: Renovação automática de tokens
- **CORS Configurado**: Controle de origens permitidas
- **SQL Injection Protection**: ORM do Django previne SQL injection
- **XSS Protection**: Headers de segurança no Nginx
- **Input Validation**: Validação em múltiplas camadas (Frontend + Backend)

### Boas Práticas

- Tokens armazenados em `localStorage` (considerar `httpOnly` cookies em produção)
- Validação de permissões em todas as views
- Sanitização de dados de entrada
- Logs de segurança (implementar conforme necessário)

## 📈 Performance

### Otimizações Implementadas

- **Backend**:

  - `select_related()` e `prefetch_related()` para evitar N+1 queries
  - Índices em campos frequentemente consultados
  - Paginação em listagens grandes
  - Redis como Channel Layer para escalabilidade de WebSockets
  - Gzip compression no Nginx

- **Frontend**:
  - Build otimizado (minificação, tree-shaking)
  - Lazy loading de rotas
  - OnPush change detection
  - Cache de assets estáticos (1 ano)

### Métricas Esperadas

- Tempo de resposta da API: < 200ms (p95)
- Carregamento inicial: < 3s
- Time to Interactive: < 5s
- Cobertura de testes: > 80%

## 🧪 Testes

### Testes End-to-End

Para executar testes completos de ponta a ponta da aplicação:

```powershell
# Executar todos os testes
.\test-e2e.ps1

# Executar apenas testes da API (mais rápido)
.\test-e2e.ps1 -SkipBackendTests -SkipFrontendTests
```

O script de teste E2E verifica:
- ✅ Ambiente e containers Docker
- ✅ Testes do backend (Django)
- ✅ Build do frontend (Angular)
- ✅ Endpoints da API REST (CRUD completo)
- ✅ Autenticação e autorização
- ✅ Filtros, busca e paginação
- ✅ Dados agregados e métricas

**📚 Documentação completa**: Consulte [`docs/E2E_TESTING.md`](docs/E2E_TESTING.md)

### Estrutura de Testes

- **Backend**: 81+ testes unitários e de integração
- **Frontend**: Testes para Services e principais Components
- **Cobertura**: Configurado com `coverage.py` e relatórios HTML

### Executar Testes

```bash
# Backend - Todos os testes
docker-compose exec backend python manage.py test

# Backend - Com cobertura
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
docker-compose exec backend coverage html

# Frontend
cd frontend && npm test
```

## 📚 Documentação Adicional

### Documentação de Código

- `backend/devices/API_ENDPOINTS.md` - Documentação completa da API
- `backend/devices/MEASUREMENT_INGESTION.md` - Como enviar medições
- `backend/devices/WEBSOCKET_TEST.md` - Como testar WebSockets
- `backend/accounts/README.md` - Documentação de autenticação

### Scripts Úteis

#### Scripts de Teste
- `test-e2e.ps1` - Script PowerShell para testes end-to-end completos
- `test-e2e.sh` - Script Bash para testes end-to-end (Linux/Mac)
- `backend/test_websocket.py` - Testa conexão WebSocket

#### Scripts de Configuração
- `backend/init_db.py` - Inicializa banco com dados de teste
- `backend/create_test_devices.py` - Cria dispositivos de exemplo
- `backend/generate_secret_key.py` - Gera SECRET_KEY seguro

#### Scripts Docker
- `docker-up.ps1` - Inicia toda a stack
- `docker-down.ps1` - Para todos os containers
- `docker-logs.ps1` - Visualiza logs dos containers

## 🔄 CI/CD (GitHub Actions)

O projeto inclui um workflow de CI/CD configurado no GitHub Actions que executa automaticamente em cada push e pull request.

### Workflow Configurado

O workflow principal (`.github/workflows/ci.yml`) executa:

1. **Testes do Backend (Django)**
   - Setup PostgreSQL e Redis como serviços
   - Instalação de dependências
   - Linting com flake8
   - Execução de migrações
   - Execução de testes unitários e de integração
   - Geração de relatório de cobertura de código

2. **Testes do Frontend (Angular)**
   - Setup Node.js 18
   - Instalação de dependências NPM
   - Execução de testes unitários (Karma/ChromeHeadless)
   - Geração de relatório de cobertura

3. **Build do Backend**
   - Verificação de configuração Django para produção
   - Coleta de arquivos estáticos

4. **Build do Frontend**
   - Build da aplicação Angular em modo produção
   - Verificação de artefatos gerados

### Triggers

O workflow é executado automaticamente quando:
- Um push é feito para as branches: `main`, `develop`, `master`
- Um pull request é criado para as branches: `main`, `develop`, `master`

### Status do Pipeline

Você pode verificar o status do pipeline de CI/CD:
- Na aba "Actions" do repositório GitHub
- No badge de status (se configurado) na página principal do README

### Cobertura de Código

Os relatórios de cobertura são automaticamente enviados para o Codecov (opcional):
- Backend: `coverage.xml`
- Frontend: `coverage-final.json`

### Documentação Completa

Para mais detalhes sobre a configuração do CI/CD, consulte:
- `.github/workflows/README.md` - Documentação completa dos workflows

## 🚀 Deploy

### Pré-requisitos para Produção

1. Configure variáveis de ambiente adequadas
2. Altere `DJANGO_DEBUG=False`
3. Configure `DJANGO_ALLOWED_HOSTS` com seu domínio
4. Use um SECRET_KEY seguro e único
5. Configure SSL/TLS (HTTPS)
6. Redis já está configurado como Channel Layer para escalabilidade
7. Configure backups do banco de dados e Redis

### Deploy com Docker Compose

```bash
# Build e iniciar em produção
docker-compose up --build -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

## 📄 Licença

Este projeto é privado e confidencial.

## 👥 Contribuindo

Este é um projeto interno. Para contribuir:

1. Crie uma branch a partir de `main`
2. Faça suas alterações seguindo os padrões do projeto
3. Escreva testes para novas funcionalidades
4. Execute `flake8` e `coverage` antes de commitar
5. Certifique-se de que todos os testes passam
6. Atualize a documentação se necessário
7. Envie um Pull Request

### Checklist de Pull Request

- [ ] Código segue os padrões do projeto
- [ ] Testes passam (backend e frontend)
- [ ] Cobertura de testes mantida ou aumentada
- [ ] Sem erros de lint
- [ ] Documentação atualizada
- [ ] Migrations criadas (se necessário)

## 📧 Contato

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

## 🙏 Agradecimentos

- Django REST Framework pela excelente API framework
- Angular Team pelo framework moderno e poderoso
- PrimeNG pela biblioteca de componentes
- Comunidade open-source por todas as ferramentas utilizadas

---

**Desenvolvido com ❤️ pela equipe Front-Hub**

_Última atualização: 2024_
