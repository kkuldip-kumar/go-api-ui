import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
        rules: {
      // ── TypeScript ─────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',           // warn, don't block
   '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',     // flag risky `!` usage
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer: 'type-imports',                               // import type { Foo }
      }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'off',   // too noisy with optional chains
      '@typescript-eslint/no-floating-promises': 'off',       // enable if using typed lint parser

      // ── React Hooks ────────────────────────────────────────────
      'react-hooks/exhaustive-deps': 'warn',                  // warn, not error — devs know when to skip
      'react-hooks/rules-of-hooks': 'error',                  // always enforce hook rules

      // ── General JS Quality ─────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],   // allow console.warn/error
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-var': 'error',                                      // always const/let
      'prefer-const': 'error',
      'object-shorthand': 'warn',                             // { foo: foo } → { foo }
      'prefer-template': 'warn',                              // '' + x → `${x}`
      'eqeqeq': ['error', 'always', { null: 'ignore' }],     // always === except null checks
      'curly': ['warn', 'multi-line'],                        // braces required for multi-line
      'no-throw-literal': 'error',                            // always throw Error, not strings

      // ── Imports ────────────────────────────────────────────────
      'no-restricted-imports': ['warn', {
        patterns: [
          { group: ['../*/../*'], message: 'Use absolute imports instead of deep relative paths' },
        ],
      }],
    }
  },
])
