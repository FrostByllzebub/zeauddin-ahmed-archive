import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { articles } from '../lib/articles';
import aliases from '../lib/legacyImageRedirects.json' with { type: 'json' };

// Retain original media in source; deploy the WebP already used by the catalog.
export function prepareDeploymentAssets(root = process.cwd(), redirects: Record<string, string> = aliases, usedImages = articles.map(a => a.heroImage)) {
  const client = path.join(root, 'dist/client');
  const html: string[] = [];
  function readHtml(directory: string) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) readHtml(file);
      else if (entry.name.endsWith('.html')) html.push(fs.readFileSync(file, 'utf8'));
    }
  }
  readHtml(client);
  const moves: string[] = [];
  const hash = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  // Validate the entire plan before moving anything out of generated output.
  for (const [from, to] of Object.entries(redirects)) {
    assert(/^\/articles\/[a-z0-9-]+\.png$/.test(from), `Unsafe original image path: ${from}`);
    assert.equal(to, from.replace(/\.png$/, '.webp'));
    assert(!usedImages.includes(from), `Catalog still uses original PNG: ${from}`);
    assert(!html.some(text => text.includes(from.slice('/articles/'.length))), `Rendered page still uses original PNG: ${from}`);
    assert(fs.existsSync(path.join(client, to)), `Missing deployed WebP: ${to}`);
    const original = path.join(client, from);
    if (fs.existsSync(original)) {
      assert.equal(hash(original), hash(path.join(root, 'public', from)), `Original media changed: ${from}`);
      moves.push(from);
    }
  }
  if (moves.length) {
    const runtime = path.join(root, '.sites-runtime');
    fs.mkdirSync(runtime, { recursive: true });
    const stash = fs.mkdtempSync(path.join(runtime, 'deployment-originals-'));
    for (const from of moves) fs.renameSync(path.join(client, from), path.join(stash, path.basename(from)));
  }
  return { retainedInSource: Object.keys(redirects).length, omittedBuildCopies: moves.length };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/prepare-deployment-assets.ts')) {
  console.log('Deployment media:', JSON.stringify(prepareDeploymentAssets()));
}
