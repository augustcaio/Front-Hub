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

## 🎯 Sobre o Projeto

Front-Hub é uma aplicação full-stack para gerenciamento de dispositivos IoT que permite:

- **Gerenciamento de Dispositivos**: Cadastro, listagem e detalhamento de dispositivos
- **Monitoramento em Tempo Real**: Recebimento de medições via WebSockets
- **Sistema de Alertas**: Notificações e gerenciamento de alertas por dispositivo
- **Dashboard Interativo**: Visualização de dados agregados e estatísticas
- **Autenticação Segura**: Sistema de login com JWT tokens

## 🚀 Tecnologias

### Backend
- **Django 4.2+**: Framework web Python
- **Django REST Framework**: API REST
- **Django Channels**: Suporte a WebSockets
- **PostgreSQL**: Banco de dados relacional
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
├── backend/                 # Backend Django
│   ├── accounts/            # App de autenticação e usuários
│   ├── config/              # Configurações do Django
│   ├── devices/             # App de dispositivos e medições
│   ├── Dockerfile           # Imagem Docker do backend
│   ├── manage.py            # Script de gerenciamento Django
│   └── requirements.txt     # Dependências Python
├── frontend/                 # Frontend Angular
│   ├── src/
│   │   └── app/
│   │       ├── core/        # Guards, interceptors, services
│   │       ├── layout/      # Componentes de layout
│   │       └── pages/        # Páginas da aplicação
│   ├── Dockerfile            # Imagem Docker do frontend
│   └── package.json         # Dependências Node.js
├── docker-compose.yml        # Configuração do Docker Compose
├── docker-up.ps1             # Script PowerShell para subir ambiente
├── docker-down.ps1           # Script PowerShell para parar ambiente
└── README.md                 # Este arquivo
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

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd Front-Hub
```

### 2. Configurar Variáveis de Ambiente

O arquivo `.env` será criado automaticamente pelo script `docker-up.ps1` se não existir. Você também pode criá-lo manualmente:

**Windows (PowerShell):**

```powershell
.\docker-up.ps1
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
DJANGO_SECRET_KEY=$(python backend/generate_secret_key.py)
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

### 3. Executar com Docker Compose

**Windows (PowerShell):**

```powershell
# Subir todos os serviços
.\docker-up.ps1

# Ou manualmente
docker-compose up --build -d
```

**Linux/Mac:**

```bash
# Subir todos os serviços
docker-compose up --build -d
```

### 4. Verificar Status dos Containers

```bash
docker-compose ps
```

Você deve ver três containers rodando:
- `front_hub_db` (PostgreSQL)
- `front_hub_backend` (Django)
- `front_hub_frontend` (Angular/Nginx)

### 5. Acessar a Aplicação

Após os containers iniciarem (aguarde cerca de 30-60 segundos):

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/

### 6. Credenciais Padrão

O banco de dados é inicializado automaticamente com um usuário admin:

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANTE**: Altere essas credenciais em produção!

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

# Redis (opcional, para produção)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Gerar Secret Key

Para gerar uma nova secret key:

```bash
python backend/generate_secret_key.py
```

## 📂 Estrutura de Diretórios

### Backend (`/backend`)

```
backend/
├── accounts/              # App de autenticação
│   ├── models.py         # Modelo de usuário customizado
│   ├── serializers.py    # Serializers JWT
│   ├── views.py          # Views de autenticação
│   └── tests.py          # Testes unitários
├── devices/               # App de dispositivos
│   ├── models.py         # Device, Measurement, Alert
│   ├── serializers.py    # Serializers da API
│   ├── views.py          # Views da API REST
│   ├── consumers.py      # WebSocket consumers
│   ├── routing.py        # Rotas WebSocket
│   └── tests.py          # Testes unitários
├── config/                # Configurações Django
│   ├── settings.py        # Configurações principais
│   ├── urls.py           # URLs principais
│   ├── asgi.py           # Configuração ASGI (WebSockets)
│   └── wsgi.py           # Configuração WSGI
├── init_db.py            # Script de inicialização do BD
├── manage.py             # Script de gerenciamento
├── requirements.txt      # Dependências Python
└── Dockerfile            # Imagem Docker
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/              # Funcionalidades core
│   │   │   ├── guards/        # Route guards (auth)
│   │   │   ├── interceptors/  # HTTP interceptors
│   │   │   └── services/      # Services (Auth, Device, WebSocket)
│   │   ├── layout/            # Componentes de layout
│   │   │   ├── components/
│   │   │   │   ├── header/    # Cabeçalho
│   │   │   │   └── sidebar/   # Menu lateral
│   │   │   └── layout.component.*
│   │   └── pages/              # Páginas da aplicação
│   │       ├── dashboard/      # Dashboard principal
│   │       ├── devices/        # Gerenciamento de dispositivos
│   │       └── login/         # Página de login
│   ├── assets/                # Assets estáticos
│   └── index.html             # HTML principal
├── Dockerfile                  # Imagem Docker (multi-stage)
├── nginx.conf                  # Configuração Nginx
├── package.json                # Dependências Node.js
└── angular.json                # Configuração Angular
```

## 📸 Capturas de Tela

### Tela de Login

![Login Screen](docs/screenshots/login.png)
*Tela de login com autenticação JWT*

### Dashboard Principal

![Dashboard](docs/screenshots/dashboard.png)
*Dashboard com visão geral dos dispositivos e estatísticas*

### Lista de Dispositivos

![Devices List](docs/screenshots/devices-list.png)
*Lista de dispositivos com filtros e busca*

### Detalhes do Dispositivo

![Device Detail](docs/screenshots/device-detail.png)
*Detalhes do dispositivo com gráficos em tempo real*

### Alertas

![Alerts](docs/screenshots/alerts.png)
*Painel de alertas e notificações*

> **Nota**: As capturas de tela acima são placeholders. Adicione suas próprias capturas na pasta `docs/screenshots/` após executar a aplicação.

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

### Erro ao fazer login

1. Verifique se o banco foi inicializado: `python init_db.py`
2. Crie um novo superusuário se necessário:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

### WebSocket não conecta

1. Verifique se o Daphne está rodando (servidor ASGI)
2. Verifique os logs do backend:
   ```bash
   docker-compose logs -f backend
   ```
3. Verifique se o Redis está configurado (para produção)

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
```

#### Frontend

```bash
cd frontend
npm test
```

### Estrutura de Testes

- **Backend**: Testes unitários para Models e Serializers (Django TestCase)
- **Frontend**: Testes unitários para Services (Jasmine/Karma)

## 📄 Licença

Este projeto é privado e confidencial.

## 👥 Contribuindo

Este é um projeto interno. Para contribuir:

1. Crie uma branch a partir de `main`
2. Faça suas alterações
3. Escreva testes para novas funcionalidades
4. Certifique-se de que todos os testes passam
5. Envie um Pull Request

## 📧 Contato

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ pela equipe Front-Hub**

