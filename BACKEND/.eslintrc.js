module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off', // Permitir console.log em desenvolvimento
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'node/no-unpublished-require': 'off', // Permitir require em arquivos não publicados
    'node/no-missing-require': 'error',
    'prettier/prettier': 'error',
    'no-process-exit': 'off' // Permitir process.exit
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true
      }
    }
  ]
};

