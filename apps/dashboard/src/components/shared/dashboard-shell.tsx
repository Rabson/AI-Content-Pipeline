'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardNav } from '@dashboard/components/shell/dashboard-nav';
import { PhaseWarnings } from '@dashboard/components/shell/phase-warnings';
import { UserBadge } from '@dashboard/components/shell/user-badge';
import { ThemeToggle } from '@dashboard/components/theme/theme-toggle';
import { useDashboardTheme } from '@dashboard/components/theme/use-dashboard-theme';

interface DashboardShellUser {
  role: string;
  email: string;
  authorized: boolean;
}

interface DashboardShellProps {
  children: ReactNode;
  user: DashboardShellUser;
  phase2Enabled: boolean;
  phase3Enabled: boolean;
}

function TopBar({
  pathname,
  user,
  phase3Enabled,
  theme,
  onToggleTheme,
}: {
  pathname: string;
  user: DashboardShellUser;
  phase3Enabled: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <h1 className="topbar-title">Operations Dashboard</h1>
      </div>
      <DashboardNav pathname={pathname} user={user} phase3Enabled={phase3Enabled} />
      <div className="topbar-actions">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <UserBadge user={user} />
      </div>
    </header>
  );
}

export function DashboardShell({ children, user, phase2Enabled, phase3Enabled }: DashboardShellProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useDashboardTheme();
  const hideChrome = pathname === '/signin';

  if (hideChrome) {
    return <div className="app-shell auth-shell">{children}</div>;
  }

  return (
    <div className="app-shell">
      <TopBar
        pathname={pathname}
        user={user}
        phase3Enabled={phase3Enabled}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <PhaseWarnings phase2Enabled={phase2Enabled} phase3Enabled={phase3Enabled} />
      {children}
    </div>
  );
}
