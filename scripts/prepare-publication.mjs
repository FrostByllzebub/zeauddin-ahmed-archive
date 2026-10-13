import { spawnSync } from 'node:child_process';

function run(script, args = []) {
  const result = spawnSync(process.execPath, ['--import', './scripts/register-typescript.mjs', script, ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// Validate source before touching generated output; then verify all derived data.
run('scripts/validate-website.ts', ['--catalog-only']);
run('scripts/generate-publication.ts');
run('scripts/validate-website.ts');
