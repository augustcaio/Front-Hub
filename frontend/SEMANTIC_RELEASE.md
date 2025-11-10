# Semantic Release - Configuração

## 📋 O que é Semantic Release?

O **Semantic Release** automatiza o processo de versionamento e publicação baseado nas mensagens de commit seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/).

## 🔍 Análise dos Logs

### ⚠️ Avisos Encontrados:

1. **Dry-run mode**: O semantic-release detectou que não está rodando em um ambiente CI conhecido (GitHub Actions, GitLab CI, etc.), então executa em modo de simulação sem fazer alterações reais.

2. **Branch atrasada**: A branch local `main` está atrás da branch remota. Para publicar uma nova versão, você precisa:
   ```bash
   git pull origin main
   ```

## 📦 Configuração Criada

Foi criado o arquivo `.releaserc.json` com a seguinte configuração:

- **Branches**: `main` (produção) e `beta` (pré-release)
- **Plugins**:
  - `@semantic-release/commit-analyzer`: Analisa commits para determinar o tipo de versão
  - `@semantic-release/release-notes-generator`: Gera notas de release
  - `@semantic-release/changelog`: Cria/atualiza CHANGELOG.md
  - `@semantic-release/npm`: Atualiza package.json (sem publicar no npm, pois é `private: true`)
  - `@semantic-release/github`: Cria releases no GitHub
  - `@semantic-release/git`: Faz commit das alterações (package.json e CHANGELOG.md)

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

### 2. Fazer Commits Semânticos

Use o padrão Conventional Commits:

```
feat: adiciona novo componente de dashboard
fix: corrige bug no serviço de autenticação
docs: atualiza documentação do README
style: formata código com prettier
refactor: refatora serviço de devices
test: adiciona testes para auth guard
chore: atualiza dependências
```

**Tipos de commit:**
- `feat`: Nova funcionalidade (patch → minor)
- `fix`: Correção de bug (patch → patch)
- `BREAKING CHANGE`: Mudança que quebra compatibilidade (patch → major)
- `docs`, `style`, `refactor`, `test`, `chore`: Não geram versão

### 3. Executar Semantic Release

#### Modo Dry-Run (Teste Local)
```bash
npm run semantic-release:dry-run
```

#### Modo Real (CI/CD)
O semantic-release deve ser executado em um ambiente CI (GitHub Actions, GitLab CI, etc.) com as variáveis de ambiente necessárias:

- `GITHUB_TOKEN` ou `GH_TOKEN`: Token do GitHub com permissões para criar releases

### 4. GitHub Actions Workflows (✅ Já Configurado)

Os workflows do GitHub Actions já foram configurados:

#### 📦 `.github/workflows/release.yml`
Workflow de release automático que:
- Executa quando há push na branch `main` ou `beta`
- Instala dependências
- Executa testes (opcional, continua mesmo se falhar)
- Faz build da aplicação
- Executa semantic-release automaticamente
- Cria release no GitHub com os arquivos de build

**Permissões necessárias:**
- O `GITHUB_TOKEN` é fornecido automaticamente pelo GitHub Actions
- Não é necessário configurar secrets adicionais

#### 🔄 `.github/workflows/ci.yml`
Workflow de CI que:
- Executa em pushes e pull requests
- Instala dependências
- Executa linter (se configurado)
- Executa testes com cobertura
- Faz build da aplicação
- Faz upload dos artefatos de build

**Como funciona:**
1. Faça commit seguindo o padrão Conventional Commits
2. Faça push para a branch `main` ou `beta`
3. O GitHub Actions executa automaticamente
4. Se houver commits `feat:` ou `fix:`, uma nova versão é criada
5. O CHANGELOG.md é atualizado automaticamente
6. Uma release é criada no GitHub com os arquivos de build

## 📝 Convenções de Commit

### Formato
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Exemplos

**Feature (Minor Version)**
```
feat(dashboard): adiciona gráfico de temperatura em tempo real
```

**Bug Fix (Patch Version)**
```
fix(auth): corrige expiração de token
```

**Breaking Change (Major Version)**
```
feat(api): altera estrutura de resposta da API

BREAKING CHANGE: A resposta da API agora retorna um objeto `data` ao invés de array direto
```

## 🔧 Troubleshooting

### Problema: "The local branch main is behind the remote one"

**Solução:**
```bash
git pull origin main
```

### Problema: "This run was not triggered in a known CI environment"

**Solução:** Isso é normal em desenvolvimento local. Para testar, use:
```bash
npm run semantic-release:dry-run
```

Para produção, configure o GitHub Actions ou outro CI/CD.

### Problema: Não está criando releases

**Verifique:**
1. Se há commits com `feat:` ou `fix:` desde a última release
2. Se o workflow está executando corretamente (verifique a aba "Actions" no GitHub)
3. Se está executando na branch `main` ou `beta`
4. Se o commit não contém `[skip ci]` na mensagem
5. Se as permissões do workflow estão corretas (contents: write, issues: write, pull-requests: write)

### Problema: Workflow não executa

**Solução:**
- Verifique se o arquivo `.github/workflows/release.yml` está no repositório
- Verifique se está fazendo push para a branch `main` ou `beta`
- Verifique se o commit não contém `[skip ci]` na mensagem

## 📚 Recursos

- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

