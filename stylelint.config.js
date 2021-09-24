module.exports = {
	extends: ['stylelint-config-standard'],
	rules: {
		indentation: 'tab',
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: [
					'tailwind',
					'apply',
					'layer',
					'variants',
					'responsive',
					'screen',
					'each',
					'mixin',
					'include',
				],
			},
		],
		'declaration-block-trailing-semicolon': null,
		'no-descending-specificity': null,
	},
};
