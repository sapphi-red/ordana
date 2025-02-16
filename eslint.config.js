// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import vitest from '@vitest/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    languageOptions: {
      sourceType: 'module'
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    rules: {
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }]
    }
  },
  {
    files: ['**/*.test(?:-d)?.ts'],
    ...vitest.configs.recommended
  },
  {
    files: ['**/*.test-d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },
  eslintConfigPrettier,
  {
    ignores: ['**/dist/**']
  }
)
