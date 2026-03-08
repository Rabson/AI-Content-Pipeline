import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashboardShell } from '@dashboard/components/shared/dashboard-shell';
import { getDashboardUser } from '@dashboard/lib/auth';
import { isPhaseEnabled } from '@dashboard/lib/feature-flags';

export const metadata: Metadata = {
  title: 'AI Content Pipeline Dashboard',
  description: 'Internal operations dashboard',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getDashboardUser();
  const phase2Enabled = isPhaseEnabled(2);
  const phase3Enabled = isPhaseEnabled(3);

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <DashboardShell user={user} phase2Enabled={phase2Enabled} phase3Enabled={phase3Enabled}>
          {children}
        </DashboardShell>
      </body>
    </html>
  );
}
