module.exports = {
  plugins: ['@next/next'],
  extends: ['./base.cjs', 'plugin:@next/next/recommended'],
  env: {
    browser: true,
    node: true,
  },
  settings: {
    next: {
      rootDir: ['apps/dashboard'],
    },
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
