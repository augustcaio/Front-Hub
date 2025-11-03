# Testes End-to-End (E2E)

Este documento descreve como executar testes end-to-end completos da aplicação Front-Hub.

## 📋 Visão Geral

Os scripts de teste E2E verificam toda a aplicação de ponta a ponta:

- ✅ **Ambiente**: Verificação de containers Docker e conectividade
- ✅ **Backend**: Execução de testes unitários e de integração (Django)
- ✅ **Frontend**: Verificação de build (Angular)
- ✅ **API REST**: Testes de todos os endpoints principais
- ✅ **WebSockets**: Verificação de conectividade (opcional)

## 🚀 Uso Rápido

### PowerShell (Windows)

```powershell
# Executar todos os testes
.\test-e2e.ps1

# Pular testes do frontend (mais rápido)
.\test-e2e.ps1 -SkipFrontendTests

# Pular testes de WebSocket
.\test-e2e.ps1 -SkipWebSocketTests

# Usar credenciais diferentes
.\test-e2e.ps1 -Username "usuario" -Password "senha123"
```

### Bash (Linux/Mac)

```bash
# Executar todos os testes
./test-e2e.sh

# Executar com opções (edite o script para configurar)
./test-e2e.sh
```

## 📝 Parâmetros Disponíveis (PowerShell)

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `-SkipDocker` | Pula verificação de containers Docker | `false` |
| `-SkipBackendTests` | Pula testes do backend | `false` |
| `-SkipFrontendTests` | Pula testes/build do frontend | `false` |
| `-SkipAPITests` | Pula testes da API REST | `false` |
| `-SkipWebSocketTests` | Pula testes de WebSocket | `false` |
| `-BackendUrl` | URL do backend | `http://localhost:8000` |
| `-FrontendUrl` | URL do frontend | `http://localhost:4200` |
| `-Username` | Usuário para testes | `admin` |
| `-Password` | Senha para testes | `admin123` |

## 🧪 O que é Testado

### 1. Verificação de Ambiente

- ✅ Docker instalado
- ✅ Containers rodando (backend, frontend, PostgreSQL, Redis)
- ✅ Backend acessível via HTTP
- ✅ Frontend acessível via HTTP

### 2. Testes do Backend

- ✅ Execução de todos os testes Django (`python manage.py test`)
- ✅ Testes de modelos, serializers, views
- ✅ Testes de autenticação e autorização

### 3. Testes do Frontend

- ✅ Build da aplicação Angular em modo produção
- ✅ Verificação de erros de compilação
- ⚠️ Testes unitários requerem ambiente Node.js local

### 4. Testes da API REST

#### Autenticação
- ✅ `POST /api/token/` - Obter token JWT
- ✅ `POST /api/token/refresh/` - Renovar token

#### Dispositivos
- ✅ `GET /api/devices/` - Listar dispositivos
- ✅ `POST /api/devices/` - Criar dispositivo
- ✅ `GET /api/devices/{id}/` - Detalhar dispositivo
- ✅ `PATCH /api/devices/{id}/` - Atualizar dispositivo
- ✅ `DELETE /api/devices/{id}/` - Deletar dispositivo
- ✅ `GET /api/devices/?status=active` - Filtros
- ✅ `GET /api/devices/?search=test` - Busca
- ✅ `GET /api/devices/{id}/aggregated-data/` - Dados agregados
- ✅ `GET /api/devices/{id}/metrics/` - Métricas disponíveis

#### Outros Endpoints
- ✅ `GET /api/me/` - Usuário atual
- ✅ `GET /api/alerts/` - Listar alertas
- ✅ `GET /api/categories/` - Listar categorias

### 5. Testes de WebSocket

- ⚠️ Requer execução manual
- Execute: `docker exec front_hub_backend python test_websocket.py`

## 📊 Relatório de Testes

O script gera um relatório detalhado:

```
==========================================
  RELATÓRIO DE TESTES
==========================================

Total de testes: 25
✅ Passou: 23
❌ Falhou: 2
⏭️  Ignorado: 0

Taxa de sucesso: 92.00%
```

### Arquivo de Relatório

Um arquivo JSON com todos os resultados é salvo automaticamente:

```
test-report-20251103-143022.json
```

## 🔧 Pré-requisitos

### Obrigatórios

1. **Docker e Docker Compose** instalados e rodando
2. **Containers iniciados** (`.\docker-up.ps1`)
3. **Backend e Frontend acessíveis** nas portas padrão

### Opcionais (para testes completos)

- **Node.js e npm** (para testes unitários do frontend)
- **Python** (para testes de WebSocket manuais)

## 🐛 Troubleshooting

### Erro: "Container backend não está rodando"

**Solução:**
```powershell
.\docker-up.ps1
```

Aguarde alguns segundos para os containers iniciarem completamente.

### Erro: "Backend acessível - FAIL"

**Soluções:**
1. Verifique se o container backend está rodando:
   ```powershell
   docker ps | Select-String "front_hub_backend"
   ```

2. Verifique os logs do backend:
   ```powershell
   docker logs front_hub_backend
   ```

3. Verifique se a porta 8000 está disponível

### Erro: "Login - Obter token JWT - FAIL"

**Soluções:**
1. Verifique se as credenciais padrão estão corretas:
   - Usuário: `admin`
   - Senha: `admin123`

2. Verifique se o banco de dados foi inicializado:
   ```powershell
   docker exec front_hub_backend python init_db.py
   ```

3. Crie um novo usuário se necessário:
   ```powershell
   docker exec -it front_hub_backend python manage.py createsuperuser
   ```

### Erro: "Build do Frontend - FAIL"

**Soluções:**
1. Instale as dependências:
   ```powershell
   cd frontend
   npm install --legacy-peer-deps
   cd ..
   ```

2. Verifique se há erros de compilação:
   ```powershell
   cd frontend
   npm run build
   ```

## 💡 Dicas

### Executar apenas testes da API

Para testar apenas a API (mais rápido):

```powershell
.\test-e2e.ps1 -SkipBackendTests -SkipFrontendTests -SkipWebSocketTests
```

### Executar em ambiente diferente

```powershell
.\test-e2e.ps1 -BackendUrl "http://staging.example.com:8000" -FrontendUrl "http://staging.example.com:4200"
```

### Integração com CI/CD

Os scripts podem ser integrados ao pipeline de CI/CD:

```yaml
# .github/workflows/ci.yml
- name: Run E2E Tests
  run: |
    .\docker-up.ps1
    Start-Sleep -Seconds 30
    .\test-e2e.ps1 -SkipFrontendTests
```

## 📚 Testes Adicionais

### Testes de WebSocket Manualmente

```powershell
# Dentro do container backend
docker exec front_hub_backend python test_websocket.py

# Ou com public_id específico
docker exec front_hub_backend python test_websocket.py <public_id>
```

### Testes de Carga (Opcional)

Use ferramentas como:
- **Apache Bench (ab)**
- **JMeter**
- **K6**
- **Artillery**

### Testes de Interface (E2E Real)

Para testes completos de interface, considere:
- **Cypress**
- **Playwright**
- **Selenium**

## 🔄 Fluxo de Trabalho Recomendado

1. **Desenvolvimento Local**
   ```powershell
   .\docker-up.ps1
   # Faça suas alterações
   .\test-e2e.ps1 -SkipFrontendTests
   ```

2. **Antes de Commit**
   ```powershell
   .\test-e2e.ps1
   ```

3. **Após Push**
   - Os testes E2E podem ser executados no CI/CD

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs dos containers
2. Execute os testes com verbose
3. Consulte a documentação dos componentes individuais

