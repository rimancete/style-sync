// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Strict configuration for pre-commit hooks
export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'eslint.commit.mjs', 'dist/**/*', 'node_modules/**/*'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // Strict rules for commits - enforce quality
      '@typescript-eslint/no-explicit-any': 'warn', // Still allow but warn
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'prefer-const': 'error', // Core ESLint rule, not TypeScript
      'no-console': 'error',
      
      // Critical errors that should never be committed
      '@typescript-eslint/ban-ts-comment': 'error',
      'no-debugger': 'error',
    },
  },
  // Test files still get relaxed rules even in commit mode
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts', '**/testing/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
);
