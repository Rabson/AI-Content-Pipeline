import {
  generateLinkedInAction,
  generateSeoAction,
  publishDevtoAction,
} from '../actions';

export function PublishActions({ topicId }: { topicId: string }) {
  return (
    <>
      <form action={generateSeoAction.bind(null, topicId)}>
        <button className="button" type="submit">
          Generate SEO
        </button>
      </form>
      <form action={generateLinkedInAction.bind(null, topicId)}>
        <button className="button button-secondary" type="submit">
          Generate LinkedIn
        </button>
      </form>
      <form action={publishDevtoAction.bind(null, topicId)}>
        <button className="button" type="submit">
          Publish Dev.to
        </button>
      </form>
    </>
  );
}
