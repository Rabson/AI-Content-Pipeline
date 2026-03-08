import type { UserSummary } from '@aicp/contracts';
import { assignTopicOwnerAction } from '../../actions';

export function OwnerAssignmentPanel({ topicId, owner, users }: { topicId: string; owner?: UserSummary | null; users: UserSummary[] }) {
  const assignees = users.filter((user) => user.role === 'USER');
  return (
    <div className="panel stack">
      <h3>Publishing owner</h3>
      <p className="topic-meta">Approved posts publish with the assigned normal user credentials. Admins can publish on their behalf.</p>
      <p>{owner?.email ?? 'No owner assigned yet.'}</p>
      {assignees.length ? (
        <form className="create-form" action={assignTopicOwnerAction.bind(null, topicId)}>
          <select name="ownerUserId" defaultValue={owner?.id ?? assignees[0]?.id}>
            {assignees.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}
          </select>
          <button className="button" type="submit">Reassign owner</button>
        </form>
      ) : null}
    </div>
  );
}
