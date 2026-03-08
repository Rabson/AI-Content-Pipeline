import type { UserPublisherCredentialView, UserSummary } from '@aicp/shared-types';
import { getCurrentUser, getMyPublisherCredentials } from '../../lib/api-client/user-api';
import { CredentialCard } from './credential-card';

export const dynamic = 'force-dynamic';

const channels = ['DEVTO', 'MEDIUM', 'LINKEDIN'] as const;

function credentialFor(credentials: UserPublisherCredentialView[], channel: (typeof channels)[number]) {
  return credentials.find((credential) => credential.channel === channel);
}

function UserSummaryCard({ user }: { user: UserSummary | null }) {
  return (
    <section className="panel stack">
      <h3>Signed-in user</h3>
      <p>{user?.name ?? user?.email ?? 'Unknown user'}</p>
      <p className="topic-meta">
        {user?.email ?? 'No email available'} • {user?.role ?? 'Unknown role'}
      </p>
    </section>
  );
}

export default async function AccountPage() {
  const [user, credentials] = await Promise.all([getCurrentUser(), getMyPublisherCredentials()]);

  return (
    <main className="page stack">
      <section className="detail-header">
        <p className="eyebrow">Account</p>
        <h2>Publishing credentials</h2>
        <p className="lede">
          Manage the channel tokens and account identifiers the publisher uses when approved
          articles are assigned to you.
        </p>
      </section>
      <UserSummaryCard user={user} />
      <section className="grid-three">
        {channels.map((channel) => (
          <CredentialCard
            key={channel}
            channel={channel}
            credential={credentialFor(credentials, channel)}
          />
        ))}
      </section>
    </main>
  );
}
