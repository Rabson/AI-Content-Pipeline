import Link from 'next/link';
import { SignOutButton } from '../auth/signout-button';

interface DashboardShellUser {
  role: string;
  email: string;
  name?: string | null;
  authorized: boolean;
}

export function UserBadge({ user }: { user: DashboardShellUser }) {
  if (!user.authorized) {
    return (
      <div className="user-badge">
        <Link className="button button-secondary" href="/signin">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="user-badge">
      <div className="user-meta">
        {user.name ? <span className="user-name">{user.name}</span> : null}
        <span className="user-email">{user.email}</span>
        <strong className="role-chip">{user.role}</strong>
      </div>
      <SignOutButton />
    </div>
  );
}
