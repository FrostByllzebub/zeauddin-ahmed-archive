import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareDeploymentAssets } from '../scripts/prepare-deployment-assets';

test('deployment keeps source originals, WebP media and a recoverable build copy', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-media-'));
  try {
    for (const dir of ['public/articles', 'dist/client/articles']) fs.mkdirSync(path.join(root, dir), { recursive: true });
    fs.writeFileSync(path.join(root, 'public/articles/sample.png'), 'original image');
    fs.writeFileSync(path.join(root, 'dist/client/articles/sample.png'), 'original image');
    fs.writeFileSync(path.join(root, 'dist/client/articles/sample.webp'), 'existing webp');
    fs.writeFileSync(path.join(root, 'dist/client/index.html'), '<img src="/articles/sample.webp">');
    assert.deepEqual(prepareDeploymentAssets(root, { '/articles/sample.png': '/articles/sample.webp' }, []), { retainedInSource: 1, omittedBuildCopies: 1 });
    assert.equal(fs.readFileSync(path.join(root, 'public/articles/sample.png'), 'utf8'), 'original image');
    assert.equal(fs.readFileSync(path.join(root, 'dist/client/articles/sample.webp'), 'utf8'), 'existing webp');
    const stash = fs.readdirSync(path.join(root, '.sites-runtime'))[0];
    assert.equal(fs.readFileSync(path.join(root, '.sites-runtime', stash, 'sample.png'), 'utf8'), 'original image');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('deployment refuses to omit a PNG used by the catalog or a rendered page', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-media-'));
  try {
    fs.mkdirSync(path.join(root, 'dist/client'), { recursive: true });
    const redirects = { '/articles/sample.png': '/articles/sample.webp' };
    fs.writeFileSync(path.join(root, 'dist/client/index.html'), '<img src="/articles/sample.png">');
    assert.throws(() => prepareDeploymentAssets(root, redirects, ['/articles/sample.png']), /Catalog still uses/);
    assert.throws(() => prepareDeploymentAssets(root, redirects, []), /Rendered page still uses/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
