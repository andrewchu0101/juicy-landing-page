import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// issue 012：lint 設定。不啟用型別感知規則（不需要 parserOptions.project），維持速度與簡單。
export default tseslint.config(
  { ignores: ['dist', 'dist-test', 'node_modules', 'coverage', 'diagrams'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['vite.config.ts', 'eslint.config.js', 'tests/**'],
    languageOptions: { globals: { ...globals.node } },
  },
);
