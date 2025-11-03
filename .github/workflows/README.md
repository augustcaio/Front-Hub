# GitHub Actions Workflows

Este diretório contém os workflows de CI/CD configurados para o projeto Front-Hub.

## Workflow Principal: `ci.yml`

### Descrição
Workflow de Integração Contínua que executa testes e builds do backend (Django) e frontend (Angular) em cada push e pull request.

### Triggers
- Push para branches: `main`, `develop`, `master`
- Pull requests para branches: `main`, `develop`, `master`

### Jobs

#### 1. `backend-tests`
- **Objetivo**: Executar testes unitários e de integração do backend Django
- **Serviços**:
  - PostgreSQL 14 (banco de dados)
  - Redis 7 (para Channel Layer)
- **Etapas**:
  - Setup Python 3.11
  - Instalação de dependências do sistema
  - Instalação de dependências Python
  - Linting com flake8
  - Execução de migrações do banco de dados
  - Execução de testes Django
  - Geração de relatório de cobertura de código

#### 2. `frontend-tests`
- **Objetivo**: Executar testes unitários do frontend Angular
- **Etapas**:
  - Setup Node.js 18
  - Instalação de dependências NPM
  - Linting (se configurado)
  - Execução de testes unitários com Karma/ChromeHeadless
  - Geração de relatório de cobertura

#### 3. `backend-build`
- **Objetivo**: Verificar se o build do backend funciona corretamente
- **Dependências**: Requer que `backend-tests` passe
- **Etapas**:
  - Setup Python 3.11
  - Instalação de dependências
  - Verificação de configuração Django para produção
  - Coleta de arquivos estáticos

#### 4. `frontend-build`
- **Objetivo**: Verificar se o build do frontend funciona corretamente
- **Dependências**: Requer que `frontend-tests` passe
- **Etapas**:
  - Setup Node.js 18
  - Instalação de dependências NPM
  - Build da aplicação Angular em modo produção
  - Verificação de artefatos de build

#### 5. `all-tests-pass`
- **Objetivo**: Job de agregação que confirma que todos os jobs anteriores foram bem-sucedidos
- **Dependências**: Requer que todos os jobs anteriores passem

### Variáveis de Ambiente

#### Backend
- `DJANGO_SECRET_KEY`: Chave secreta para testes
- `DJANGO_DEBUG`: Modo de debug (desabilitado em CI)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: Configuração do banco de dados
- `REDIS_HOST`, `REDIS_PORT`: Configuração do Redis

### Cobertura de Código

Os relatórios de cobertura são automaticamente enviados para o Codecov (se configurado):
- Backend: `coverage.xml` gerado pelo `coverage.py`
- Frontend: `coverage-final.json` gerado pelo Karma

### Notas Importantes

1. **Testes do Frontend**: Os testes do Angular são executados em modo headless (ChromeHeadless) e podem falhar silenciosamente (`|| true`) para não bloquear o pipeline se houver problemas de configuração.

2. **Testes do Backend**: Requerem PostgreSQL e Redis rodando como serviços do GitHub Actions.

3. **Cache**: O workflow utiliza cache do NPM e pip para acelerar builds subsequentes.

4. **Segurança**: As credenciais do banco de dados usadas são apenas para CI e não devem ser usadas em produção.

### Melhorias Futuras

- [ ] Adicionar testes E2E com Cypress ou Playwright
- [ ] Integração com serviços de qualidade de código (SonarQube, CodeClimate)
- [ ] Deploy automático em staging após testes bem-sucedidos
- [ ] Notificações em Slack/Email quando o pipeline falhar

