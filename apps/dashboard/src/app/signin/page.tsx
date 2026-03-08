import { SignInForm } from '../../components/auth/signin-form';
import { env } from '../../config/env';
import { localSeedUsers } from '../../config/local-users';

export default function SignInPage() {
  const seededIdentities = localSeedUsers.map((user) => `${user.role.padEnd(8)} ${user.email} / ${user.password}`).join('\n');

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="stack">
          <div>
            <p className="eyebrow">Dashboard access</p>
            <h2>Sign in</h2>
            <p className="lede">Use your seeded or created user email and password to access the internal dashboard.</p>
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
