'use client';

import Link from 'next/link';
import { extractErrorMessage } from '../lib/error-display';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="error-shell">
          <section className="error-card">
            <p className="eyebrow">Application failure</p>
            <h1>Something broke</h1>
            <p className="lede error-message">{extractErrorMessage(error)}</p>
            <div className="detail-actions">
              <button className="button" type="button" onClick={reset}>
                Retry
              </button>
              <Link className="button button-secondary" href="/signin">
                Back to sign in
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
