module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    jest: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-misused-promises': [
      'error',
      { checksVoidReturn: false }
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  },
  ignorePatterns: ['dist/', 'node_modules/']
};
