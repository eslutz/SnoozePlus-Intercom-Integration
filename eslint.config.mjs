import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  { languageOptions: { globals: globals.node } },
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'scripts',
      'tests',
      'eslint.config.mjs',
      'jest.config.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        allowDefaultProject: ['*.config.*', '*.mjs'],
      },
    },
  },
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier
);
