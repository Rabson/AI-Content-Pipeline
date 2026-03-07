import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOTS = ['apps', 'packages'];
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx']);
const IGNORED_PARTS = ['node_modules', '.next', '.next-docker', 'dist', 'coverage'];
const MAX_LINES = 100;
const config = JSON.parse(readFileSync('config/code-shape-exceptions.json', 'utf8'));

const maxLineExceptions = new Set(config.maxLines ?? []);
const mixedResponsibilityExceptions = new Set(config.mixedResponsibilities ?? []);
const violations = [];

for (const root of ROOTS) {
  visit(root);
}

if (violations.length) {
  console.error('Code shape violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Code shape check passed.');

function visit(target) {
  const stats = statSync(target, { throwIfNoEntry: false });
  if (!stats) {
    return;
  }

  if (stats.isDirectory()) {
    if (IGNORED_PARTS.some((part) => target.split('/').includes(part))) {
      return;
    }

    for (const entry of readdirSync(target)) {
      visit(join(target, entry));
    }
    return;
  }

  if (!ALLOWED_EXTENSIONS.has(extname(target))) {
    return;
  }

  const relPath = relative(process.cwd(), target).replace(/\\/g, '/');
  const source = readFileSync(target, 'utf8');
  const lineCount = source.split('\n').length;

  if (lineCount > MAX_LINES && !maxLineExceptions.has(relPath)) {
    violations.push(`${relPath} exceeds ${MAX_LINES} lines (${lineCount}).`);
  }

  if (!mixedResponsibilityExceptions.has(relPath)) {
    validateLayering(relPath, source);
  }
}

function validateLayering(relPath, source) {
  const hasPrisma = /PrismaService/.test(source);
  const hasQueue = /@InjectQueue|queue\.add\(|getJobCounts\(|WorkerHost/.test(source);
  const hasExternalIo = /fetch\(|@aws-sdk|S3Client|https:\/\/api\.openai\.com|https:\/\//.test(source);

  if (isController(relPath) && (hasPrisma || hasQueue || hasExternalIo)) {
    violations.push(`${relPath} mixes HTTP transport with persistence, queueing, or external IO.`);
  }

  if (isRepository(relPath) && (hasQueue || hasExternalIo)) {
    violations.push(`${relPath} mixes persistence with queueing or external IO.`);
  }

  if (isServiceLike(relPath) && hasPrisma && (hasQueue || hasExternalIo)) {
    violations.push(`${relPath} mixes business logic with direct persistence and queue/external IO.`);
  }
}

function isController(relPath) {
  return relPath.endsWith('.controller.ts');
}

function isRepository(relPath) {
  return relPath.includes('/repositories/') || relPath.endsWith('.repository.ts');
}

function isServiceLike(relPath) {
  return relPath.endsWith('.service.ts') || relPath.includes('/services/') || relPath.includes('/support/');
}
