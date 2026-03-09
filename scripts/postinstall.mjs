import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const requiredFiles = [
  'packages/shared-config/env/readers.ts',
  'packages/auth-core/src/index.ts',
  'packages/backend-core/src/index.ts',
  'apps/api/src/prisma/schema.prisma',
  'prisma.config.ts',
];

const hasWorkspaceSources = requiredFiles.every((file) => existsSync(file));

if (!hasWorkspaceSources) {
  console.log(
    'Skipping postinstall shared build and Prisma generation because workspace sources are not fully available in this install context.',
  );
  process.exit(0);
}

run('npm', ['run', 'prisma:generate']);
run('npm', ['run', 'build:shared-packages']);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
