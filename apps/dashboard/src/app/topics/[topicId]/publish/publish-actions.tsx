import { requestPublicationAction, generateLinkedInAction, generateSeoAction } from '../actions';

const publishChannels = [
  { key: 'DEVTO', enabled: true },
  { key: 'MEDIUM', enabled: false },
  { key: 'LINKEDIN', enabled: false },
] as const;

export function PublishActions({ topicId, role }: { topicId: string; role: string }) {
  const canGenerate = role === 'ADMIN' || role === 'EDITOR' || role === 'REVIEWER';
  const canPublish = role === 'ADMIN' || role === 'USER';

  return (
    <>
      {canGenerate ? (
        <>
          <form action={generateSeoAction.bind(null, topicId)}><button className="button" type="submit">Generate SEO</button></form>
          <form action={generateLinkedInAction.bind(null, topicId)}><button className="button button-secondary" type="submit">Generate LinkedIn</button></form>
        </>
      ) : null}
      {canPublish ? publishChannels.map((channel) => (
        channel.enabled ? (
          <form key={channel.key} action={requestPublicationAction.bind(null, topicId, channel.key)}>
            <button className="button" type="submit">Publish {channel.key}</button>
          </form>
        ) : (
          <button key={channel.key} className="button button-secondary" type="button" disabled>
            {channel.key} coming soon
          </button>
        )
      )) : null}
    </>
  );
}
