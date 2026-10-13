import test from 'node:test';
import assert from 'node:assert/strict';
import { articles } from '../lib/articles';
import { validateCatalog, validateArtifacts } from '../scripts/validate-website';

test('publication fails when generated search data is stale', () => {
  const expected = new Map([['public/search-manifest.json', '{"records":486}\n']]);
  assert.throws(() => validateArtifacts(expected, () => '{"records":485}\n'), /Stale generated output/);
  assert.doesNotThrow(() => validateArtifacts(expected, () => '{"records":486}\r\n'));
});

test('publication rejects missing image assets and future dates before generation', () => {
  const article = articles[0];
  const image = article.heroImage, date = article.publishedAt;
  try {
    article.heroImage = '/articles/nonexistent-quality-gate-fixture.png';
    assert.throws(validateCatalog, /Missing\/empty image/);
    article.heroImage = image;
    article.publishedAt = '2999-01-01';
    assert.throws(validateCatalog, /Future date requires editorial review/);
  } finally { article.heroImage = image; article.publishedAt = date; }
});

test('publication rejects duplicate canonical identities', () => {
  articles.push(articles[0]);
  try { assert.throws(validateCatalog, /Duplicate article slug/); }
  finally { articles.pop(); }
});
