import Link from 'next/link';

interface DashboardShellUser {
  role: string;
}

function getNavItems(user: DashboardShellUser, phase3Enabled: boolean) {
  return [
    { href: '/', label: 'Overview', enabled: true },
    { href: '/topics', label: 'Topics', enabled: true },
    { href: '/account', label: 'Account', enabled: Boolean(user.role) },
    { href: '/analytics', label: 'Analytics', enabled: phase3Enabled },
    { href: '/ops', label: 'Ops', enabled: user.role === 'ADMIN' },
  ].filter((item) => item.enabled);
}

function isActiveNavItem(pathname: string, href: string) {
  return href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({
  pathname,
  user,
  phase3Enabled,
}: {
  pathname: string;
  user: DashboardShellUser;
  phase3Enabled: boolean;
}) {
  return (
    <nav className="topnav">
      {getNavItems(user, phase3Enabled).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={isActiveNavItem(pathname, item.href) ? 'nav-link nav-link-active' : 'nav-link'}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
