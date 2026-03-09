type WorkerRoute = {
  controller: string;
  action: string;
  path: string;
};

function route(controller: string, action: string): WorkerRoute {
  return {
    controller,
    action,
    path: `${controller}/${action}`,
  };
}

export const WORKER_INTERNAL_ROUTE_PREFIX = 'v1/internal/worker' as const;

export const WORKER_INTERNAL_ROUTES = {
  analyticsRollup: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/analytics`, 'rollup'),
  discoveryImport: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/discovery`, 'import'),
  draftProcessSection: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/draft`, 'process-section'),
  draftFinalize: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/draft`, 'finalize'),
  draftMarkFailed: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/draft`, 'mark-failed'),
  outlineRun: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/outline`, 'run'),
  outlineMarkFailed: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/outline`, 'mark-failed'),
  publishArticle: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/publisher`, 'publish'),
  researchRun: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/research`, 'run'),
  revisionProcessSection: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/revision`, 'process-section'),
  revisionFinalize: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/revision`, 'finalize'),
  revisionMarkFailed: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/revision`, 'mark-failed'),
  seoRun: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/seo`, 'run'),
  socialLinkedInRun: route(`${WORKER_INTERNAL_ROUTE_PREFIX}/social`, 'linkedin/run'),
} as const;
