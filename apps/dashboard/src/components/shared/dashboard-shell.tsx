'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardNav } from '../shell/dashboard-nav';
import { PhaseWarnings } from '../shell/phase-warnings';
import { UserBadge } from '../shell/user-badge';

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

function TopBar({ pathname, user, phase3Enabled }: { pathname: string; user: DashboardShellUser; phase3Enabled: boolean }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <h1 className="topbar-title">Operations Dashboard</h1>
      </div>
      <DashboardNav pathname={pathname} user={user} phase3Enabled={phase3Enabled} />
      <UserBadge user={user} />
    </header>
  );
}

export function DashboardShell({ children, user, phase2Enabled, phase3Enabled }: DashboardShellProps) {
  const pathname = usePathname();
  const hideChrome = pathname === '/signin';

  if (hideChrome) {
    return <div className="app-shell auth-shell">{children}</div>;
  }

  return (
    <div className="app-shell">
      <TopBar pathname={pathname} user={user} phase3Enabled={phase3Enabled} />
      <PhaseWarnings phase2Enabled={phase2Enabled} phase3Enabled={phase3Enabled} />
      {children}
    </div>
  );
}
