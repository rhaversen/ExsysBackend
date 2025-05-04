// @ts-check - Recommended for type checking the config file

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import eslint from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import stylistic from '@stylistic/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import * as importPlugin from 'eslint-plugin-import'
import nPlugin from 'eslint-plugin-n'
import promisePlugin from 'eslint-plugin-promise'
import tseslint from 'typescript-eslint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const compat = new FlatCompat({
	baseDirectory: __dirname,
})

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	// Use FlatCompat to extend legacy-style configs
	...compat.extends('plugin:promise/recommended', 'plugin:n/recommended-module'),
	// Prettier compatibility (must be last after all configs that might include stylistic rules)
	eslintConfigPrettier,

	// Custom configuration for TypeScript files
	{
		files: ['**/*.ts'],
		plugins: {
			// Keep plugin definitions here so rules in *this* config block can find them
			'@stylistic': stylistic,
			import: importPlugin,
			n: nPlugin,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore - Known type mismatch for promisePlugin object structure
			promise: promisePlugin,
			'@typescript-eslint': tseslint.plugin
		},
		languageOptions: {
			parser: tseslint.parser, // Use the parser export from tseslint
			parserOptions: {
				project: './tsconfig.json',
				ecmaVersion: 'latest',
				sourceType: 'module'
			}
		},
		settings: {
			'import/parsers': {
				'@typescript-eslint/parser': ['.ts', '.tsx']
			},
			'import/resolver': {
				typescript: {
					project: './tsconfig.json'
				}
			}
		},
		rules: {
			// TypeScript specific rules
			'@typescript-eslint/strict-boolean-expressions': 'error',
			'@typescript-eslint/no-unused-vars': 'warn',

			// Disallow console.log
			'no-console': ['error'],

			// Import plugin rules
			'import/first': 'error',
			'import/order': [
				'error',
				{
					alphabetize: { order: 'asc', caseInsensitive: true },
					groups: [
						'builtin',
						'external',
						'internal',
						'parent',
						'sibling',
						'index'
					],
					'newlines-between': 'always'
				}
			],
			'import/newline-after-import': 'error',
			'import/no-duplicates': 'error',
			'import/no-unresolved': 'error',
			'import/no-named-as-default': 'warn',
			'import/no-named-as-default-member': 'off',
			'import/no-extraneous-dependencies': 'off',
			'import/no-mutable-exports': 'error',
			'import/no-amd': 'error',
			'import/no-commonjs': 'off',
			'import/no-nodejs-modules': 'off',
			'import/no-anonymous-default-export': 'off',
			'import/namespace': 'off',
			'import/default': 'off',
			'import/no-named-default': 'off',
			'import/no-cycle': 'off',
			'import/no-self-import': 'error',
			'import/no-useless-path-segments': 'error',
			'import/no-relative-parent-imports': 'off',
			'import/no-unused-modules': 'off',
			'import/no-import-module-exports': 'off',
			'import/no-internal-modules': 'off',
			'import/no-unassigned-import': 'off',
			'import/no-absolute-path': 'error',
			'import/extensions': [
				'error',
				'ignorePackages',
				{
					ts: 'never',
					tsx: 'never'
				}
			],

			// Node plugin rules
			'n/no-missing-import': 'off', // Covered by import/no-unresolved

			// Stylistic rules
			'@stylistic/semi': ['error', 'never'],
			'@stylistic/no-extra-semi': 'error',
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/no-tabs': 'off',
			'@stylistic/indent': ['error', 'tab', { SwitchCase: 1 }], // Use tabs
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/array-bracket-spacing': ['error', 'never'],
			'@stylistic/generator-star-spacing': ['error', { before: true, after: false }],
			'@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
			'@stylistic/space-before-function-paren': ['error', 'always'],
			'@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
			'@stylistic/no-multi-spaces': 'error',
			'@stylistic/block-spacing': ['error', 'always'],
			'@stylistic/space-in-parens': ['error', 'never'],
			'@stylistic/comma-dangle': ['error', 'never'],
			'@stylistic/lines-between-class-members': [
				'error',
				'always',
				{ exceptAfterSingleLine: true }
			],
			'@stylistic/padded-blocks': ['error', 'never'],
			'@stylistic/no-trailing-spaces': 'error',
			'@stylistic/spaced-comment': ['error', 'always'],
			'@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],

			// Core ESLint rules (ensure not conflicting with Prettier or other plugins)
			curly: ['error', 'all']
		}
	},

	// Configuration overrides for test files
	{
		files: ['src/test/**/*.ts'], // Updated pattern for test files
		rules: {
			// Allow importing dev dependencies in test files
			'n/no-unpublished-import': 'off',
			'n/no-extraneous-import': 'off'
		}
	},

	// Configuration overrides for the ESLint config file itself
	{
		files: ['eslint.config.mjs'],
		rules: {
			// Allow importing dev dependencies
			'n/no-extraneous-import': 'off',
			'n/no-unpublished-import': 'off',
			// Allow unresolved imports if needed (e.g., for plugins)
			'import/no-unresolved': 'off' // Might be needed depending on setup
		}
	}
)
