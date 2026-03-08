'use client';

import type { DashboardTheme } from './use-dashboard-theme';

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: DashboardTheme;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="theme-toggle-label">{theme === 'light' ? 'Light' : 'Dark'}</span>
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === 'light' ? 'Sun' : 'Moon'}
      </span>
    </button>
  );
}
