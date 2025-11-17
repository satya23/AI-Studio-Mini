module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Integrates Prettier with ESLint
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': [
      'error',
      {
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        arrowParens: 'avoid',
      },
    ],
  },
  ignorePatterns: ['dist', 'build', 'node_modules', 'coverage'],
};

