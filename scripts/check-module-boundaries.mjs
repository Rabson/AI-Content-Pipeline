import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOTS = ['apps/worker/src', 'apps/dashboard/src'];
const CODE_EXTENSIONS = new Set(['.ts', '.tsx']);
const violations = [];

for (const root of ROOTS) {
  walk(root);
}

if (violations.length > 0) {
  console.error('Module boundary violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Module boundary check passed.');

function walk(target) {
  const stats = statSync(target, { throwIfNoEntry: false });
  if (!stats) {
    return;
  }

  if (stats.isDirectory()) {
    for (const entry of readdirSync(target)) {
      walk(join(target, entry));
    }
    return;
  }

  if (!CODE_EXTENSIONS.has(extname(target))) {
    return;
  }

  const source = readFileSync(target, 'utf8');
  if (/@aicp\/api\/|@api\/|apps\/api\/src|\.{1,2}\/.*api\/src/.test(source)) {
    violations.push(`${target} imports API app source or alias`);
  }
}
