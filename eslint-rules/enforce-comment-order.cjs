// eslint-rules/enforce-comment-order.cjs

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
	meta: {
		type: "problem",
		docs: {
			description:
				"Ensure the file contains 4 specific comments in a certain order",
			category: "Best Practices",
			recommended: false,
		},
		fixable: null,
		schema: [], // no options
	},

	create(context) {
		const requiredComments = [
			"// Node.js built-in modules",
			"// Third-party libraries",
			"// Own modules",
			"// Environment variables",
			"// Config variables",
			"// Destructuring and global variables"
		];

		return {
			Program(node) {
				const comments = context.sourceCode.getAllComments();
				let commentIndex = 0;

				comments.forEach((comment) => {
					const commentText = `// ${comment.value.trim()}`;
					if (commentText === requiredComments[commentIndex]) {
						commentIndex++;
					}
				});

				if (commentIndex !== requiredComments.length) {
					context.report({
						node,
						message: `File must contain the following comments in order: ${requiredComments.join(
							", "
						)}`,
					});
				}
			},
		};
	},
};

module.exports = rule;
