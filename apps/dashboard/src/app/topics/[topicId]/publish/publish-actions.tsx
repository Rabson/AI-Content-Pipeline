import { generateLinkedInAction, generateSeoAction } from '../actions';

export function PublishActions({ topicId, role }: { topicId: string; role: string }) {
  const canGenerate = role === 'ADMIN' || role === 'EDITOR' || role === 'REVIEWER';

  if (!canGenerate) {
    return null;
  }

  return (
    <>
      <form action={generateSeoAction.bind(null, topicId)}>
        <button className="button" type="submit">Generate SEO</button>
      </form>
      <form action={generateLinkedInAction.bind(null, topicId)}>
        <button className="button button-secondary" type="submit">Generate LinkedIn</button>
      </form>
    </>
  );
}
