import type { UserPublisherCredentialView } from '@aicp/shared-types';
import { formatDate } from '../../lib/formatting';
import { deletePublisherCredentialAction, upsertPublisherCredentialAction } from './actions';

type Channel = 'DEVTO' | 'MEDIUM' | 'LINKEDIN';

const guidance: Record<Channel, string> = {
  DEVTO: 'Provide a Dev.to API key. The article will publish with the selected banner image when configured.',
  MEDIUM: 'Provide a Medium token. Author ID is optional if the token can resolve /me. Publication ID is optional unless you publish into a publication.',
  LINKEDIN: 'Provide a LinkedIn access token and the author URN for the profile or organization that should publish the post.',
};

export function CredentialCard({
  channel,
  credential,
}: {
  channel: Channel;
  credential?: UserPublisherCredentialView;
}) {
  return (
    <section className="panel stack">
      <div className="stack stack-tight">
        <h3>{channel}</h3>
        <p className="topic-meta">{guidance[channel]}</p>
        <p className="topic-meta">
          {credential
            ? `Configured ${credential.tokenHint ?? ''} • updated ${formatDate(credential.updatedAt)}`
            : 'No token configured.'}
        </p>
      </div>
      <form className="create-form" action={upsertPublisherCredentialAction.bind(null, channel)}>
        <input name="token" type="password" placeholder={`${channel} token`} required />
        {channel === 'MEDIUM' ? (
          <>
            <input
              name="mediumAuthorId"
              placeholder="Medium author ID"
              defaultValue={credential?.settings?.mediumAuthorId ?? ''}
            />
            <input
              name="mediumPublicationId"
              placeholder="Medium publication ID"
              defaultValue={credential?.settings?.mediumPublicationId ?? ''}
            />
          </>
        ) : null}
        {channel === 'LINKEDIN' ? (
          <input
            name="linkedinAuthorUrn"
            placeholder="LinkedIn author URN"
            defaultValue={credential?.settings?.linkedinAuthorUrn ?? ''}
            required
          />
        ) : null}
        <button className="button" type="submit">
          Save token
        </button>
      </form>
      {credential ? (
        <form action={deletePublisherCredentialAction.bind(null, channel)}>
          <button className="button button-secondary" type="submit">
            Remove token
          </button>
        </form>
      ) : null}
    </section>
  );
}
