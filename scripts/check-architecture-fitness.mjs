import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const CODE_EXTENSIONS = new Set(['.ts', '.tsx']);
const IGNORE_PARTS = ['node_modules', 'dist', '.next', '.next-docker', 'coverage'];
const violations = [];

const APP_IMPORT_RULES = {
  'apps/api/src': [/^@worker\//, /^@dashboard\//, /apps\/worker\/src/, /apps\/dashboard\/src/],
  'apps/worker/src': [/^@api\//, /^@dashboard\//, /apps\/api\/src/, /apps\/dashboard\/src/],
  'apps/dashboard/src': [/^@api\//, /^@worker\//, /apps\/api\/src/, /apps\/worker\/src/],
};

scanCodeBoundaries();
scanPackageDependencyDirection();

if (violations.length) {
  console.error('Architecture fitness violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Architecture fitness check passed.');

function scanCodeBoundaries() {
  for (const [root, forbiddenPatterns] of Object.entries(APP_IMPORT_RULES)) {
    walk(root, (filePath, source) => {
      const imports = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
      for (const match of imports) {
        const target = match[1];
        if (forbiddenPatterns.some((pattern) => pattern.test(target))) {
          violations.push(`${filePath} imports forbidden app boundary "${target}"`);
        }
      }
    });
  }

  walk('packages', (filePath, source) => {
    const imports = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
    for (const match of imports) {
      const target = match[1];
      if (/^@api\//.test(target) || /^@worker\//.test(target) || /^@dashboard\//.test(target)) {
        violations.push(`${filePath} imports app alias "${target}"`);
      }
      if (/apps\/(api|worker|dashboard)\/src/.test(target)) {
        violations.push(`${filePath} imports app source "${target}"`);
      }
    }
  });
}

function scanPackageDependencyDirection() {
  const workspaceManifests = [
    'packages/auth-core/package.json',
    'packages/backend-core/package.json',
    'packages/contracts/package.json',
    'packages/observability-core/package.json',
    'packages/queue-contracts/package.json',
    'packages/shared-config/package.json',
    'packages/workflow-core/package.json',
    'apps/api/package.json',
    'apps/worker/package.json',
    'apps/dashboard/package.json',
  ];

  const layers = {
    '@aicp/shared-config': 0,
    '@aicp/contracts': 0,
    '@aicp/queue-contracts': 0,
    '@aicp/auth-core': 1,
    '@aicp/workflow-core': 1,
    '@aicp/observability-core': 1,
    '@aicp/backend-core': 2,
    '@aicp/api': 3,
    '@aicp/worker': 3,
    '@aicp/dashboard': 3,
  };

  for (const manifestPath of workspaceManifests) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const packageName = String(manifest.name ?? '');
    const packageLayer = layers[packageName];
    const dependencies = allDependencies(manifest);

    for (const dependencyName of dependencies) {
      if (!(dependencyName in layers)) continue;
      const dependencyLayer = layers[dependencyName];
      if (dependencyLayer > packageLayer) {
        violations.push(`${packageName} depends on higher-layer package ${dependencyName}`);
      }
      if (manifestPath.startsWith('packages/') && dependencyName.startsWith('@aicp/') && dependencyLayer >= 3) {
        violations.push(`${packageName} must not depend on app package ${dependencyName}`);
      }
    }
  }
}

function allDependencies(manifest) {
  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
}

function walk(root, onFile) {
  const stats = statSync(root, { throwIfNoEntry: false });
  if (!stats) return;
  if (stats.isDirectory()) {
    if (IGNORE_PARTS.some((part) => root.split('/').includes(part))) return;
    for (const entry of readdirSync(root)) {
      walk(join(root, entry), onFile);
    }
    return;
  }

  if (!CODE_EXTENSIONS.has(extname(root))) return;
  const source = readFileSync(root, 'utf8');
  const relPath = relative(process.cwd(), root).replace(/\\/g, '/');
  onFile(relPath, source);
}
