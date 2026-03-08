import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

vi.mock('../../lib/api-client/user-api', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'normal_user@example.com',
    role: 'USER',
    name: 'Normal User',
  }),
  getMyPublisherCredentials: vi.fn().mockResolvedValue([
    {
      channel: 'DEVTO',
      tokenHint: 'devt...1234',
      updatedAt: '2026-03-08T00:00:00Z',
      settings: null,
    },
  ]),
}));

vi.mock('./credential-card', () => ({
  CredentialCard: ({ channel, credential }: { channel: string; credential?: { tokenHint?: string } }) =>
    React.createElement('div', null, `${channel}:${credential?.tokenHint ?? 'empty'}`),
}));

describe('AccountPage', () => {
  it('renders the signed-in user and credential channels', async () => {
    const { default: AccountPage } = await import('./page');
    const html = renderToStaticMarkup(await AccountPage());

    expect(html).toContain('Publishing credentials');
    expect(html).toContain('normal_user@example.com');
    expect(html).toContain('DEVTO:devt...1234');
    expect(html).toContain('MEDIUM:empty');
    expect(html).toContain('LINKEDIN:empty');
  });
});
