import { SignInForm } from '../../components/auth/signin-form';

export default function SignInPage() {
  const isLocal = (process.env.NEXT_PUBLIC_APP_ENV ?? 'local') === 'local';
  const adminEmail =
    (process.env.AUTH_ADMIN_EMAILS ?? 'operator@example.com').split(',')[0]?.trim() ||
    'operator@example.com';
  const reviewerEmail =
    (process.env.AUTH_REVIEWER_EMAILS ?? 'reviewer@example.com').split(',')[0]?.trim() ||
    'reviewer@example.com';
  const allowedDomain =
    (process.env.AUTH_ALLOWED_EMAIL_DOMAINS ?? 'example.com').split(',')[0]?.trim() ||
    'example.com';
  const editorEmail = `editor@${allowedDomain.replace(/^@/, '')}`;
  const accessCode = process.env.DASHBOARD_ACCESS_CODE?.trim();
  const seededIdentities = [
    `ADMIN    ${adminEmail} / ${accessCode ?? 'set access code'}`,
    `REVIEWER ${reviewerEmail} / ${accessCode ?? 'set access code'}`,
    `EDITOR   ${editorEmail} / ${accessCode ?? 'set access code'}`,
  ].join('\n');

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="stack">
          <div>
            <p className="eyebrow">Dashboard access</p>
            <h2>Sign in</h2>
            <p className="lede">Use an allowed email and the dashboard access code to open the internal operations dashboard.</p>
          </div>
          <SignInForm />
          {isLocal ? (
            <div className="stack">
              <p className="eyebrow">Seeded local identities</p>
              <pre className="code-block auth-seed-block">{seededIdentities}</pre>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
