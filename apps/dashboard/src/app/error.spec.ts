import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

(globalThis as { React?: typeof React }).React = React;

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

describe('DashboardError', () => {
  it('renders backend error details and the parsed error code', async () => {
    const { default: DashboardError } = await import('./error');
    const html = renderToStaticMarkup(
      React.createElement(DashboardError, {
        error: new Error(JSON.stringify({ error: { code: 'UNHANDLED_ERROR', message: ['bad request'], details: { statusCode: 400 } } })),
        reset: vi.fn(),
      }),
    );

    expect(html).toContain('Dashboard error');
    expect(html).toContain('Code: UNHANDLED_ERROR');
    expect(html).toContain('View backend details');
  });
});
