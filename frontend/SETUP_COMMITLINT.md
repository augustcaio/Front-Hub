# Setup - Conventional Commits

Este guia explica como configurar o Conventional Commits no projeto após instalar as dependências.

## 📦 Passo a Passo

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

Isso instalará:

- `@commitlint/cli` - CLI do commitlint
- `@commitlint/config-conventional` - Configuração padrão do Conventional Commits
- `husky` - Git hooks

### 2. Inicializar Husky

O script `prepare` no `package.json` já está configurado para executar `husky install` automaticamente após `npm install`.

Se precisar executar manualmente:

```bash
npm run prepare
# ou
npx husky install
```

### 3. Verificar Configuração

Verifique se o hook foi criado corretamente:

```bash
# Windows (PowerShell)
ls .husky/commit-msg

# Linux/Mac
ls -la .husky/commit-msg
```

### 4. Testar Validação

Teste se a validação está funcionando:

```bash
# Teste com mensagem válida
echo "feat: adiciona nova funcionalidade" | npx commitlint

# Teste com mensagem inválida (deve falhar)
echo "mensagem inválida" | npx commitlint
```

## ✅ Verificação

Após a configuração, tente fazer um commit:

```bash
# Commit válido (deve passar)
git commit -m "feat: adiciona validação de formulário"

# Commit inválido (deve falhar)
git commit -m "mensagem sem tipo"
```

## 🔧 Troubleshooting

### Hook não está executando

1. Verifique se o Husky foi instalado:

   ```bash
   npx husky install
   ```

2. Verifique se o arquivo `.husky/commit-msg` existe e tem o conteúdo correto.

3. No Windows, certifique-se de que o Git Bash está sendo usado ou configure o PowerShell adequadamente.

### Erro: "commitlint: command not found"

Execute:

```bash
npm install
```

### Erro: "husky: command not found"

Execute:

```bash
npm install
npm run prepare
```

## 📝 Próximos Passos

Após a configuração, todos os commits serão validados automaticamente. Consulte `CONVENTIONAL_COMMITS.md` para ver exemplos e regras de formatação.

---

**Nota**: Se você estiver em um ambiente Windows, certifique-se de que o Git Bash ou PowerShell está configurado corretamente para executar os hooks.
