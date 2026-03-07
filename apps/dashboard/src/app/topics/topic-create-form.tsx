import { createTopicAction } from './actions';

export function TopicCreateForm() {
  return (
    <form className="create-form" action={createTopicAction}>
      <input name="title" placeholder="Topic title" required />
      <textarea name="brief" rows={4} placeholder="Brief" />
      <input name="audience" placeholder="Audience" />
      <input name="tags" placeholder="Tags (comma separated)" />
      <button className="button" type="submit">
        Create topic
      </button>
    </form>
  );
}
