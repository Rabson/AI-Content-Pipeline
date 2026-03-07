export function PhaseWarnings({
  phase2Enabled,
  phase3Enabled,
}: {
  phase2Enabled: boolean;
  phase3Enabled: boolean;
}) {
  return (
    <>
      {!phase2Enabled ? <div className="warning-banner">Phase 2 screens and jobs are disabled in this environment.</div> : null}
      {!phase3Enabled ? <div className="warning-banner">Phase 3 screens and jobs are disabled in this environment.</div> : null}
    </>
  );
}
