// eslint.config.js

"use strict";

// ESLint plugins
const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptEslintParser = require("@typescript-eslint/parser");

module.exports = [
	{
		ignores: ["node_modules/**"],
	},
	{
		files: ["**/*.js", "**/*.ts"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			parser: typescriptEslintParser,
		},
		plugins: {
			// Alias the plugin with a valid identifier
			typescript: typescriptEslintPlugin,
		},
		rules: {
			semi: ["error", "never"],
			quotes: ["error", "single"],
			indent: ["error", "tab", { SwitchCase: 1 }],
			"typescript/no-unused-vars": "warn",
			"no-tabs": "off",
		},
		settings: {
			// Include any necessary settings here
		},
	},
];
