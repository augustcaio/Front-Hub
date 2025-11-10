# Conventional Commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/) para padronizar as mensagens de commit e facilitar a geração automática de changelogs e versionamento semântico.

## 📋 Formato

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Estrutura

- **type** (obrigatório): Tipo da mudança
- **scope** (opcional): Escopo da mudança (ex: componente, módulo)
- **subject** (obrigatório): Descrição curta da mudança
- **body** (opcional): Descrição detalhada
- **footer** (opcional): Referências a issues, breaking changes, etc.

## 🎯 Tipos de Commit

### `feat`

Nova funcionalidade para o usuário final.

```bash
feat(auth): adiciona refresh token automático
feat(dashboard): implementa gráficos em tempo real
```

### `fix`

Correção de bug que afeta o usuário final.

```bash
fix(login): corrige redirecionamento após autenticação
fix(devices): resolve erro ao deletar dispositivo
```

### `docs`

Mudanças apenas na documentação.

```bash
docs: atualiza README com instruções de instalação
docs(api): adiciona exemplos de uso dos endpoints
```

### `style`

Mudanças de formatação, espaços, indentação, etc. (não afeta o código).

```bash
style: corrige formatação do código
style(components): aplica prettier nos templates
```

### `refactor`

Refatoração de código que não corrige bug nem adiciona feature.

```bash
refactor(auth): simplifica lógica de validação de token
refactor(services): extrai lógica comum para utils
```

### `perf`

Melhoria de performance.

```bash
perf(dashboard): otimiza renderização de gráficos
perf(api): adiciona cache para consultas frequentes
```

### `test`

Adiciona ou corrige testes.

```bash
test(auth): adiciona testes para refresh token
test(devices): corrige testes de integração
```

### `build`

Mudanças que afetam o sistema de build ou dependências externas.

```bash
build: atualiza dependências do Angular
build(docker): otimiza Dockerfile multi-stage
```

### `ci`

Mudanças em arquivos e scripts de CI/CD.

```bash
ci: adiciona workflow de testes no GitHub Actions
ci: configura codecov para relatórios de cobertura
```

### `chore`

Outras mudanças que não modificam src ou test files.

```bash
chore: atualiza .gitignore
chore(deps): atualiza dependências de desenvolvimento
```

### `revert`

Reverte um commit anterior.

```bash
revert: reverte "feat(auth): adiciona refresh token automático"
revert(abc123): reverte commit que causou bug crítico
```

## 📝 Exemplos

### Commit Simples

```bash
feat(login): adiciona validação de formulário reativo
```

### Commit com Escopo

```bash
fix(devices): corrige paginação na lista de dispositivos
```

### Commit com Corpo

```bash
feat(dashboard): implementa gráficos em tempo real

Adiciona integração com Chart.js para exibir medições
em tempo real via WebSocket. Inclui:
- Gráfico de linha para histórico
- Atualização automática a cada 5 segundos
- Indicador de status da conexão
```

### Commit com Breaking Change

```bash
feat(api): altera estrutura de resposta dos endpoints

BREAKING CHANGE: A resposta do endpoint /api/devices/ agora
retorna um objeto com propriedade 'data' ao invés de array direto.
Migre seu código para acessar response.data ao invés de response.
```

### Commit com Referência a Issue

```bash
fix(auth): corrige expiração de token

Resolve problema onde tokens expiravam antes do tempo configurado.
Fixes #123
```

### Commit com Múltiplos Tipos

```bash
feat(devices): adiciona filtro por categoria

- Adiciona dropdown de categorias no filtro
- Implementa lógica de filtragem no service
- Adiciona testes unitários

Closes #45
```

## ✅ Regras de Validação

O projeto utiliza `commitlint` para validar automaticamente os commits. As regras incluem:

- ✅ Tipo deve ser minúsculo
- ✅ Tipo não pode estar vazio
- ✅ Tipo deve ser um dos tipos permitidos
- ✅ Descrição não pode estar vazia
- ✅ Descrição não deve terminar com ponto
- ✅ Descrição deve ter no máximo 100 caracteres
- ✅ Escopo deve ter no máximo 50 caracteres

## 🚫 Exemplos de Commits Inválidos

```bash
# ❌ Tipo em maiúsculo
FEAT: adiciona nova funcionalidade

# ❌ Tipo inválido
feature: adiciona nova funcionalidade

# ❌ Sem descrição
fix:

# ❌ Descrição muito longa
feat: adiciona uma funcionalidade muito importante que vai melhorar significativamente a experiência do usuário e resolver vários problemas

# ❌ Descrição termina com ponto
fix(login): corrige bug de autenticação.
```

## 🔧 Configuração

### Instalação

As dependências já estão configuradas no `package.json`. Para instalar:

```bash
cd frontend
npm install
```

### Husky Hook

O projeto utiliza Husky para executar o commitlint automaticamente antes de cada commit. O hook está configurado em `.husky/commit-msg`.

### Validação Manual

Para validar uma mensagem de commit manualmente:

```bash
npm run commitlint
```

Ou usando commitlint diretamente:

```bash
npx commitlint --from HEAD~1 --to HEAD --verbose
```

## 🔄 Integração com Semantic Release

O projeto já está configurado com `semantic-release`, que utiliza os commits no formato Conventional Commits para:

- **Versionamento automático**: Determina a versão baseada nos tipos de commit
- **Geração de changelog**: Cria changelog automaticamente
- **Publicação**: Publica releases no GitHub/GitLab

### Como o Semantic Release Interpreta os Commits

- `feat`: Incrementa versão MINOR (1.0.0 → 1.1.0)
- `fix`: Incrementa versão PATCH (1.0.0 → 1.0.1)
- `BREAKING CHANGE`: Incrementa versão MAJOR (1.0.0 → 2.0.0)
- Outros tipos: Não incrementam versão

## 📚 Referências

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)

## 💡 Dicas

1. **Seja específico**: Use escopos quando fizer sentido (ex: `feat(auth)`, `fix(devices)`)
2. **Use o imperativo**: "adiciona" ao invés de "adicionado" ou "adicionando"
3. **Seja conciso**: A descrição deve ser clara e direta
4. **Use o corpo para detalhes**: Se precisar explicar mais, use o corpo do commit
5. **Referencie issues**: Use `Closes #123` ou `Fixes #123` quando relevante

## 🎯 Checklist Antes de Commitar

- [ ] Tipo do commit está correto?
- [ ] Escopo está correto (se aplicável)?
- [ ] Descrição está clara e no imperativo?
- [ ] Descrição tem menos de 100 caracteres?
- [ ] Breaking changes estão documentados?
- [ ] Issues relacionadas estão referenciadas?

---

**Lembre-se**: Commits bem escritos facilitam a manutenção do código e a compreensão do histórico do projeto! 🚀
