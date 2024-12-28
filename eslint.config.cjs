// eslint.config.js

"use strict";

// ESLint plugins
const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptEslintParser = require("@typescript-eslint/parser");

// Custom rules
const enforceCommentOrderRule = require("./eslint-rules/enforce-comment-order.cjs");

// Local plugin
const localPlugin = {
	rules: {
		"enforce-comment-order": enforceCommentOrderRule,
	},
};

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
			local: localPlugin,
		},
		rules: {
			semi: ["error", "never"],
			quotes: ["error", "single"],
			indent: ["error", "tab", { SwitchCase: 1 }],
			"typescript/no-unused-vars": "warn",
			"no-tabs": "off",
			"local/enforce-comment-order": "error",
		},
		settings: {
			// Include any necessary settings here
		},
	},
];
