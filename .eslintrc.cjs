module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/', '.next/', 'coverage/'],
  overrides: [
    {
      files: ['apps/api/**/*.ts', 'apps/worker/**/*.ts', 'packages/shared-types/**/*.ts', 'packages/shared-config/**/*.ts', 'packages/backend-core/**/*.ts'],
      extends: ['./packages/shared-config/eslint/nest.cjs'],
    },
    {
      files: ['apps/dashboard/**/*.{ts,tsx}', 'apps/dashboard/**/*.js'],
      extends: ['./packages/shared-config/eslint/next.cjs'],
    },
  ],
};
