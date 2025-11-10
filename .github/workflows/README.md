# GitHub Actions Workflows

Este diretório contém os workflows de CI/CD configurados para o projeto Front-Hub.

## 📋 Workflows Disponíveis

### 1. 🔄 `ci.yml` - Continuous Integration

**Quando executa:**
- Push para branches: `main`, `develop`, `feature/**`, `fix/**`
- Pull requests para `main` ou `develop`

**O que faz:**
- ✅ Valida commits em Pull Requests (Conventional Commits)
- ✅ Instala dependências
- ✅ Executa type checking TypeScript
- ✅ Executa linter
- ✅ Executa testes com cobertura de código
- ✅ Faz build da aplicação Angular
- ✅ Faz upload dos artefatos de build

**Status:** Executa em todas as mudanças de código para garantir qualidade.

---

### 2. 🚀 `release.yml` - Semantic Release

**Quando executa:**
- Push para branches: `main` (produção) ou `beta` (pré-release)
- **Não executa** se o commit contém `[skip ci]` na mensagem

**O que faz:**
- ✅ Instala dependências
- ✅ Valida commits (Conventional Commits)
- ✅ Executa type checking TypeScript
- ✅ Executa testes
- ✅ Faz build da aplicação Angular
- ✅ Analisa commits seguindo Conventional Commits
- ✅ Gera nova versão automaticamente (se houver `feat:` ou `fix:`)
- ✅ Atualiza `CHANGELOG.md`
- ✅ Atualiza `package.json` com nova versão
- ✅ Cria release no GitHub com os arquivos de build
- ✅ Faz commit das alterações (package.json e CHANGELOG.md)

**Permissões necessárias:**
- `contents: write` - Para criar releases e fazer commits
- `issues: write` - Para criar issues relacionadas (se configurado)
- `pull-requests: write` - Para comentar em PRs (se configurado)

**Tokens:**
- `GITHUB_TOKEN` - Fornecido automaticamente pelo GitHub Actions
- `NPM_TOKEN` - Opcional, apenas se precisar publicar no npm (não necessário para projetos privados)

---

## 🎯 Como Funciona o Semantic Release

### Fluxo Automático:

1. **Desenvolvedor faz commit:**
   ```bash
   git commit -m "feat(dashboard): adiciona gráfico de temperatura"
   git push origin main
   ```

2. **GitHub Actions detecta o push** e executa o workflow `release.yml`

3. **Validação de commits:**
   - Valida se os commits seguem o padrão Conventional Commits
   - Falha o workflow se houver commits inválidos

4. **Semantic Release analisa os commits:**
   - Se encontrar `feat:` → Incrementa versão **minor** (1.0.0 → 1.1.0)
   - Se encontrar `fix:` → Incrementa versão **patch** (1.0.0 → 1.0.1)
   - Se encontrar `BREAKING CHANGE:` → Incrementa versão **major** (1.0.0 → 2.0.0)

5. **Se houver nova versão:**
   - Atualiza `package.json`
   - Gera/atualiza `CHANGELOG.md`
   - Cria release no GitHub
   - Faz commit das alterações

6. **Se não houver nova versão:**
   - Workflow termina sem criar release

### Convenções de Commit:

| Tipo | Exemplo | Impacto na Versão |
|------|---------|-------------------|
| `feat:` | `feat(auth): adiciona login social` | Minor (1.0.0 → 1.1.0) |
| `fix:` | `fix(api): corrige timeout` | Patch (1.0.0 → 1.0.1) |
| `BREAKING CHANGE:` | `feat(api): refatora endpoints`<br>`BREAKING CHANGE: remove endpoint /v1/users` | Major (1.0.0 → 2.0.0) |
| `docs:`, `style:`, `refactor:`, `test:`, `chore:` | `chore: atualiza dependências` | Nenhum |

---

## 🔧 Configuração

### Permissões do Workflow

Os workflows já estão configurados com as permissões necessárias. Se precisar ajustar, edite o arquivo `.github/workflows/release.yml`:

```yaml
permissions:
  contents: write    # Para criar releases e commits
  issues: write      # Para criar issues (opcional)
  pull-requests: write  # Para comentar em PRs (opcional)
```

### Variáveis de Ambiente

O `GITHUB_TOKEN` é fornecido automaticamente pelo GitHub Actions. Não é necessário configurar secrets adicionais.

### Cache do npm

O workflow usa cache do npm para acelerar as instalações. O cache é baseado no arquivo `frontend/package-lock.json`.

### Husky no CI

O Husky está configurado para não executar em ambiente CI através das variáveis de ambiente:
- `CI: 'true'`
- `HUSKY: '0'`

---

## 📊 Monitoramento

### Verificar Execução dos Workflows:

1. Acesse o repositório no GitHub
2. Clique na aba **"Actions"**
3. Veja os workflows em execução ou histórico

### Logs e Debugging:

- Cada step do workflow gera logs detalhados
- Em caso de erro, os logs mostram exatamente onde falhou
- O semantic-release mostra quais commits foram analisados
- A validação de commits mostra quais commits são inválidos

---

## 🚨 Troubleshooting

### Workflow não executa:

- ✅ Verifique se está fazendo push para `main` ou `beta`
- ✅ Verifique se o commit não contém `[skip ci]`
- ✅ Verifique se o arquivo `.github/workflows/release.yml` está no repositório

### Semantic Release não cria versão:

- ✅ Verifique se há commits `feat:` ou `fix:` desde a última release
- ✅ Verifique se os commits seguem o padrão Conventional Commits
- ✅ Verifique os logs do workflow para ver a análise dos commits
- ✅ Verifique se a validação de commits passou

### Erro de permissões:

- ✅ Verifique se o workflow tem as permissões necessárias
- ✅ Verifique se o `GITHUB_TOKEN` está disponível (é automático)

### Validação de commits falha:

- ✅ Verifique se os commits seguem o padrão Conventional Commits
- ✅ Consulte `frontend/CONVENTIONAL_COMMITS.md` para exemplos
- ✅ Verifique os logs do commitlint para ver qual commit está inválido

---

## 📚 Recursos

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)

