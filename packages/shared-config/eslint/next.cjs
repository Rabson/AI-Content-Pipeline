module.exports = {
  plugins: ['@next/next'],
  extends: ['./base.cjs', 'plugin:@next/next/recommended'],
  env: {
    browser: true,
    node: true,
  },
};
