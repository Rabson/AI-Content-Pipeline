import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

vi.mock('../../components/auth/signin-form', () => ({
  SignInForm: () => React.createElement('form', null, 'Mock sign-in form'),
}));

describe('SignInPage', () => {
  it('renders the sign-in shell with seeded local identities', async () => {
    const { default: SignInPage } = await import('./page');
    const html = renderToStaticMarkup(React.createElement(SignInPage));

    expect(html).toContain('Dashboard access');
    expect(html).toContain('Mock sign-in form');
    expect(html).toContain('admin@example.com');
    expect(html).toContain('normal_user@example.com');
  });
});
