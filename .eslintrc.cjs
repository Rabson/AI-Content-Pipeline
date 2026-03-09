module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/', '.next/', 'coverage/'],
  overrides: [
    {
      files: [
        'apps/api/**/*.ts',
        'apps/worker/**/*.ts',
        'packages/contracts/**/*.ts',
        'packages/shared-config/**/*.ts',
        'packages/auth-core/**/*.ts',
        'packages/observability-core/**/*.ts',
        'packages/workflow-core/**/*.ts',
        'packages/backend-core/**/*.ts',
        'packages/queue-contracts/**/*.ts',
      ],
      extends: ['./packages/shared-config/eslint/nest.cjs'],
    },
    {
      files: ['apps/dashboard/**/*.{ts,tsx}', 'apps/dashboard/**/*.js'],
      extends: ['./packages/shared-config/eslint/next.cjs'],
    },
    {
      files: ['apps/worker/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: ['@api/*', '@aicp/api/*', '**/api/src/**'],
          },
        ],
      },
    },
    {
      files: ['apps/dashboard/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: ['@api/*', '@aicp/api/*', '**/api/src/**'],
          },
        ],
      },
    },
  ],
};
