const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
module.exports = tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'supabase/functions/**'] },
  { files: ['**/*.ts'], extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended], processor: angular.processInlineTemplates, rules: { '@typescript-eslint/no-explicit-any': 'off' } },
  { files: ['**/*.html'], extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility] }
);
