module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipo deve ser minúsculo
    'type-case': [2, 'always', 'lower-case'],
    // Tipo não pode estar vazio
    'type-empty': [2, 'never'],
    // Escopo deve ser minúsculo
    'scope-case': [2, 'always', 'lower-case'],
    // Descrição não pode estar vazia
    'subject-empty': [2, 'never'],
    // Descrição não deve terminar com ponto
    'subject-full-stop': [2, 'never', '.'],
    // Tipo deve ser um dos tipos permitidos
    'type-enum': [
      2,
      'always',
      [
        'build',      // Mudanças que afetam o sistema de build ou dependências externas
        'chore',      // Outras mudanças que não modificam src ou test files
        'ci',         // Mudanças em arquivos e scripts de CI/CD
        'docs',       // Apenas documentação
        'feat',       // Nova funcionalidade
        'fix',        // Correção de bug
        'perf',       // Melhoria de performance
        'refactor',   // Refatoração de código que não corrige bug nem adiciona feature
        'revert',     // Reverte um commit anterior
        'style',      // Mudanças de formatação, espaços, etc (não afeta o código)
        'test'        // Adiciona ou corrige testes
      ]
    ],
    // Tamanho máximo da descrição
    'subject-max-length': [2, 'always', 100],
    // Tamanho máximo do escopo
    'scope-max-length': [2, 'always', 50],
    // Corpo deve começar com linha em branco
    'body-leading-blank': [1, 'always'],
    // Rodapé deve começar com linha em branco
    'footer-leading-blank': [1, 'always']
  }
};

