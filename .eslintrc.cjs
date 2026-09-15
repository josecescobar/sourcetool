/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  globals: {
    chrome: 'readonly',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    'no-empty': 'off',
    'no-undef': 'off',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '.next/',
    '.turbo/',
    'packages/db/generated/',
    'coverage/',
  ],
};
