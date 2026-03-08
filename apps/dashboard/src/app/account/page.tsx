import type { UserPublisherCredentialView, UserSummary } from '@aicp/shared-types';
import { getMyPublisherCredentials, getCurrentUser } from '../../lib/api-client/user-api';
import { formatDate } from '../../lib/formatting';
import { deletePublisherCredentialAction, upsertPublisherCredentialAction } from './actions';

export const dynamic = 'force-dynamic';

const channels = ['DEVTO', 'MEDIUM', 'LINKEDIN'] as const;

function credentialFor(credentials: UserPublisherCredentialView[], channel: (typeof channels)[number]) {
  return credentials.find((credential) => credential.channel === channel);
}

function CredentialCard({ channel, credential }: { channel: (typeof channels)[number]; credential?: UserPublisherCredentialView }) {
  return (
    <section className="panel stack">
      <div>
        <h3>{channel}</h3>
        <p className="topic-meta">{credential ? `Configured ${credential.tokenHint ?? ''} • updated ${formatDate(credential.updatedAt)}` : 'No token configured.'}</p>
      </div>
      <form className="create-form" action={upsertPublisherCredentialAction.bind(null, channel)}>
        <input name="token" type="password" placeholder={`${channel} token`} required />
        <button className="button" type="submit">Save token</button>
      </form>
      {credential ? (
        <form action={deletePublisherCredentialAction.bind(null, channel)}>
          <button className="button button-secondary" type="submit">Remove token</button>
        </form>
      ) : null}
    </section>
  );
}

function UserSummaryCard({ user }: { user: UserSummary | null }) {
  return (
    <section className="panel stack">
      <h3>Signed-in user</h3>
      <p>{user?.name ?? user?.email ?? 'Unknown user'}</p>
      <p className="topic-meta">{user?.email ?? 'No email available'} • {user?.role ?? 'Unknown role'}</p>
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
        <p className="lede">Manage the platform tokens the publisher uses when you publish approved articles.</p>
      </section>
      <UserSummaryCard user={user} />
      <section className="grid-three">
        {channels.map((channel) => <CredentialCard key={channel} channel={channel} credential={credentialFor(credentials, channel)} />)}
      </section>
    </main>
  );
}
