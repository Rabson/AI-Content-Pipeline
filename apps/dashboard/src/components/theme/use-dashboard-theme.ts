'use client';

import { useEffect, useMemo, useState } from 'react';

export type DashboardTheme = 'light' | 'dark';

const STORAGE_KEY = 'aicp-dashboard-theme';

function resolveInitialTheme(): DashboardTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: DashboardTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useDashboardTheme() {
  const [theme, setTheme] = useState<DashboardTheme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = resolveInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }, [ready, theme]);

  return useMemo(
    () => ({
      ready,
      theme,
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [ready, theme],
  );
}
