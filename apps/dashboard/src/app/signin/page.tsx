import { SignInForm } from '../../components/auth/signin-form';
import { env } from '../../config/env';

export default function SignInPage() {
  const editorEmail = `editor@${env.defaultAllowedDomain.replace(/^@/, '')}`;
  const seededIdentities = [
    `ADMIN    ${env.defaultAdminEmail} / ${env.dashboardAccessCode ?? 'set access code'}`,
    `REVIEWER ${env.defaultReviewerEmail} / ${env.dashboardAccessCode ?? 'set access code'}`,
    `EDITOR   ${editorEmail} / ${env.dashboardAccessCode ?? 'set access code'}`,
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
          {env.isLocal ? (
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
