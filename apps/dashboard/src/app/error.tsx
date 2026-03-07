'use client';

import Link from 'next/link';
import { extractErrorMessage, parseErrorInfo } from '../lib/error-display';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const info = parseErrorInfo(error);

  return (
    <main className="error-shell">
      <section className="error-card">
        <p className="eyebrow">Request failed</p>
        <h1>Dashboard error</h1>
        <p className="lede error-message">{extractErrorMessage(error)}</p>
        {info.code ? <p className="topic-meta">Code: {info.code}</p> : null}
        {info.details ? (
          <details className="json-toggle">
            <summary>View backend details</summary>
            <pre className="mono-block">{JSON.stringify(info.details, null, 2)}</pre>
          </details>
        ) : null}
        <div className="detail-actions">
          <button className="button" type="button" onClick={reset}>
            Retry
          </button>
          <Link className="button button-secondary" href="/topics">
            Go to topics
          </Link>
        </div>
      </section>
    </main>
  );
}
