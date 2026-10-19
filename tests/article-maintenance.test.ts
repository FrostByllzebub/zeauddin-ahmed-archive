import test from 'node:test';
import assert from 'node:assert/strict';
import { articles } from '../lib/articles';
import { restoreArticleMaintenance } from '../lib/article-maintenance';
import { legacyArticleSlugs } from '../lib/articleRedirects';

test('corrected slug retains its alias, online date and separate Sunday print date', () => {
  const oldSlug = '2023-12-23-bijoyer-anondo-amake-sprsh-kore-na';
  const article = articles.find(item => item.slug === legacyArticleSlugs[oldSlug])!;
  assert.equal(article.slug, '2023-12-23-bijoyer-anondo-amake-sporsho-kore-na');
  assert.equal(article.publishedAt, '2023-12-23');
  assert.equal(article.publishedDateLabel, '২৩ ডিসেম্বর ২০২৩');
  assert.equal(article.printedPublishedAt, '2023-12-24');
  assert.equal(new Date(`${article.printedPublishedAt}T12:00:00Z`).getUTCDay(), 0);
  assert.throws(() => restoreArticleMaintenance({ ...article, printedPublishedAt: '2023-12-25' }), /Unrecorded printed date/);
  const changed = { ...article, body: article.body.map(section => ({ ...section, paragraphs: [...section.paragraphs] })) };
  changed.body[0].paragraphs[0] += ' অযাচাইকৃত।';
  assert.throws(() => restoreArticleMaintenance(changed), /Reviewed maintenance text changed/);
});

test('hidden source retains its exact URL and separate next-day print date', () => {
  const oldSlug = '2023-12-16-transgender-o-samajer-drishtibhongi';
  const article = articles.find(item => item.slug === legacyArticleSlugs[oldSlug])!;
  assert.equal(article.slug, '2023-12-16-transgender-o-shomajer-drishtibhongi');
  assert.equal(article.originalUrl, 'https://sangbad.net.bd/opinion/post-editorial/111580/');
  assert.equal(article.hideOriginalSource, true);
  assert.equal(article.publishedAt, '2023-12-16');
  assert.equal(article.printedPublishedAt, '2023-12-17');
  assert.equal(new Date(`${article.printedPublishedAt}T12:00:00Z`).getUTCDay(), 0);
  assert.throws(() => restoreArticleMaintenance({ ...article, hideOriginalSource: false }), /Unrecorded source visibility/);
});
