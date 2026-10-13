import { spawnSync } from 'node:child_process';
function run(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(['scripts/prepare-publication.mjs']);
run(['--import', './scripts/register-typescript.mjs', '--test', 'tests/*.test.ts']);
// Static hosts need HTML aliases; Sites middleware supplies real 301 redirects.
run(['node_modules/next/dist/bin/next', 'build'], { ...process.env, ARCHIVE_STATIC_EXPORT: '1' });
run(['--import', './scripts/register-typescript.mjs', 'scripts/validate-rendered.ts', '--directory', 'out']);
