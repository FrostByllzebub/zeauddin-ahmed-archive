import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { articles } from '../lib/articles.ts';
const manifest=JSON.parse(fs.readFileSync('preservation/manifest.json','utf8'));
const sources=articles.filter(a=>a.originalUrl);
assert.equal(manifest.catalogArticles,articles.length,'Catalog changed: refresh preservation audit');
assert.equal(manifest.records.length,sources.length,'Every catalog source needs an audit result');
const slugs=new Set();let captured=0;
for(const record of manifest.records){
 assert(!slugs.has(record.slug),'Duplicate preservation record');slugs.add(record.slug);
 assert.equal(sources.find(a=>a.slug===record.slug)?.originalUrl,record.url,'Original URL changed');
 assert(['captured','article_not_visible','blocked'].includes(record.status),'Unresolved capture failure');
 if(record.status!=='captured')continue;
 captured++;
 assert(record.screenshot&&record.pdf&&record.assets.length===3,'Capture pair or evidence missing');
 for(const asset of record.assets){
  const target=path.resolve(asset.path),root=path.resolve('preservation/originals')+path.sep;
  assert(target.startsWith(root),'Invalid preservation path');
  const bytes=fs.readFileSync(target);assert.equal(bytes.length,asset.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,`Changed source capture: ${asset.path}`);
 }
 assert(fs.readFileSync(record.pdf).subarray(0,5).equals(Buffer.from('%PDF-')),'Invalid PDF');
}
assert.equal(captured,manifest.summary.captured);
const live=JSON.parse(fs.readFileSync('public/source-preservation-status.json','utf8'));
assert.equal(live.preserved,captured);assert.equal(live.originalUrls,sources.length);
assert.equal(manifest.articlesWithoutOriginalUrl,articles.length-sources.length);
console.log(`Source preservation passed: ${captured} complete pairs, ${sources.length} URLs accounted for, SHA-256 verified.`);
