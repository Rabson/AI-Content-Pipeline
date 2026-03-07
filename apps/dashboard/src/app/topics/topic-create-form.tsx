'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTopicAction } from './actions';
import { initialTopicFormState } from './topic-form-state';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create topic'}
    </button>
  );
}

export function TopicCreateForm() {
  const [state, formAction] = useActionState(createTopicAction, initialTopicFormState);

  return (
    <form className="create-form" action={formAction}>
      <input name="title" placeholder="Topic title" required />
      <textarea name="brief" rows={4} placeholder="Brief" />
      <input name="audience" placeholder="Audience" />
      <input name="tags" placeholder="Tags (comma separated)" />
      {state.error ? <p className="inline-alert">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
