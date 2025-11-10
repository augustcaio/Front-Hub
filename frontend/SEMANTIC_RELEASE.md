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

### 4. Configurar GitHub Actions (Recomendado)

Crie `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        run: |
          cd frontend
          npm run build
      
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          cd frontend
          npm run semantic-release
```

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
2. Se o token do GitHub está configurado corretamente
3. Se está executando na branch `main`

## 📚 Recursos

- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

