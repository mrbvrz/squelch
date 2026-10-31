import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
    {
        ignores: [
            'dist/**',
            'dist-ui/**',
            'node_modules/**',
            'release/**',
            'resources/**',
            'docs/**',
            '*.config.*'
        ]
    },
    {
        files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts', 'scripts/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ]
        }
    }
];
