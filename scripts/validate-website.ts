import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { articles } from '../lib/articles';
import { archiveMetadata } from '../lib/archiveMetadata';
import { legacyArticleSlugs } from '../lib/articleRedirects';
import { searchTokens } from '../lib/search-normalization';
import { matchingRecordIndexes, filterSearchRecords } from '../lib/archive-search';
import type { SearchShard } from '../lib/archive-search';
import { pageMetadata, sitePages } from '../lib/site-pages';
import { publicationArtifacts } from './publication-artifacts';
import { editorialCovers } from '../lib/editorialCovers';
import { imageDimensions } from './image-dimensions';

export function validateCatalog() {
  const slugs = new Set<string>();
  const identities = new Set<string>();
  const sourceUrls = new Set<string>();
  const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, '');
  const publicRoot = path.resolve('public');
  for (const article of articles) {
    assert(!slugs.has(article.slug), `Duplicate article slug: ${article.slug}`);
    slugs.add(article.slug);
    assert(article.title.trim() && article.publication.trim() && article.author.trim(), `Missing identity: ${article.slug}`);
    const identity = `${normalize(article.title)}|${article.publishedAt}|${normalize(article.publication)}`;
    assert(!identities.has(identity), `Duplicate title/date/publication: ${article.slug}`);
    identities.add(identity);
    if (article.originalUrl) {
      const url = new URL(article.originalUrl);
      assert(['http:', 'https:'].includes(url.protocol), `Invalid source URL: ${article.slug}`);
      url.hash = '';
      const source = url.href.replace(/\/$/, '').toLowerCase();
      assert(!sourceUrls.has(source), `Duplicate original source URL: ${article.slug}`);
      sourceUrls.add(source);
    }
    assert(article.rightsStatus === 'full_text_permitted', `Full-text publication not approved: ${article.slug}`);
    assert(article.body.some(section => section.paragraphs.some(paragraph => paragraph.trim())), `Empty article: ${article.slug}`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt)
      && !Number.isNaN(Date.parse(article.publishedAt))
      && new Date(article.publishedAt).toISOString().slice(0, 10) === article.publishedAt, `Invalid date: ${article.slug}`);
    assert(article.publishedAt <= new Date().toISOString().slice(0, 10), `Future date requires editorial review: ${article.slug}`);
    assert(article.heroImage.startsWith('/articles/'), `Image must be a local article asset: ${article.slug}`);
    const image = path.resolve(publicRoot, '.' + article.heroImage);
    assert(image.startsWith(publicRoot + path.sep) && fs.existsSync(image) && fs.statSync(image).size > 0, `Missing/empty image: ${article.slug}: ${article.heroImage}`);
  }
  for (const [alias, target] of Object.entries(legacyArticleSlugs)) {
    assert(!slugs.has(alias), `Alias collides with canonical article: ${alias}`);
    assert(slugs.has(target), `Redirect has no canonical target: ${alias} -> ${target}`);
  }
  for (const [slug, cover] of Object.entries(editorialCovers)) {
    assert(slugs.has(slug), `Cover has no canonical article: ${slug}`);
    assert(cover.src.startsWith('/articles/') && !cover.src.includes('..'), `Invalid cover path: ${slug}`);
    assert(cover.alt && cover.disclosure, `Missing cover provenance: ${slug}`);
    assert.deepEqual(imageDimensions('public' + cover.src), { width: cover.width, height: cover.height }, `Incorrect cover dimensions: ${slug}`);
  }
}

export function validateArtifacts(expectedFiles: Map<string, string>, read: (file: string) => string) {
  for (const [file, expected] of expectedFiles) {
    assert.equal(read(file).replaceAll('\r\n', '\n'), expected, `Stale generated output: ${file}; run npm run prepare:publication`);
  }
}

export function validateWebsite() {
  validateCatalog();
  // Compare every generated output against freshly computed canonical content.
  // CRLF differences are portable; semantic or ordering changes fail publication.
  validateArtifacts(publicationArtifacts(), file => {
    assert(fs.existsSync(file), `Missing generated output: ${file}`);
    return fs.readFileSync(file, 'utf8');
  });
  const manifest = JSON.parse(fs.readFileSync('public/search-manifest.json', 'utf8'));
  const shards: SearchShard[] = manifest.years.map((year: string) => JSON.parse(fs.readFileSync(`public/search-shards/${year}.json`, 'utf8')));
  assert.equal(shards.reduce((n, shard) => n + shard.records.length, 0), articles.length);
  assert.deepEqual(archiveMetadata.map(article => article.slug), articles.map(article => article.slug));
  const expectedShardFiles = new Set(manifest.years.map((year: string) => year + '.json'));
  for (const file of fs.readdirSync('public/search-shards')) assert(expectedShardFiles.has(file), `Unreferenced search shard: ${file}; review before removing`);
  const sourceTexts = articles.map(article => searchTokens([article.title, article.author, article.publication,
    ...article.body.flatMap(section => [section.heading ?? '', ...section.paragraphs])].join(' ')));
  for (const query of ['বাংলাদেশ ব্যাংক', 'ইসরাইল', 'অর্থনীতি', 'যুদ্ধ', '২০২৬', 'zzzznosuchword']) {
    const tokens = searchTokens(query);
    const expected = articles.filter((_, index) => tokens.every(token => sourceTexts[index].some(term => term.startsWith(token)))).map(article => article.slug).sort();
    const found = shards.flatMap(shard => matchingRecordIndexes(shard, query).map(index => shard.records[index]));
    assert.deepEqual(found.map(record => record.slug).sort(), expected, `Search mismatch: ${query}`);
    if (query === 'বাংলাদেশ ব্যাংক') assert(found.length > 0, 'Bengali bank search must have results');
    for (const year of manifest.years) for (const publication of new Set(articles.map(article => article.publication))) {
      assert.deepEqual(filterSearchRecords(found, publication, year).map(record => record.slug).sort(),
        articles.filter(article => expected.includes(article.slug) && article.publication === publication && article.publishedAt.startsWith(year + '-')).map(article => article.slug).sort(),
        `Filter mismatch: ${query}, ${publication}, ${year}`);
    }
  }
  for (const page of sitePages) {
    const metadata = pageMetadata(page.path);
    assert.equal(metadata.alternates.canonical, page.path);
    assert.equal(metadata.openGraph.url, page.path);
    assert(metadata.title && metadata.description);
  }
  console.log(`Website gate passed: ${articles.length} articles, ${manifest.years.length} shards, ${sitePages.length} page identities, all local hero assets and ${Object.keys(legacyArticleSlugs).length} redirects.`);
}

if (process.argv.includes('--catalog-only')) validateCatalog();
else validateWebsite();
