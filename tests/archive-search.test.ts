import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchText, searchTokens } from '../lib/search-normalization';
import { matchingRecordIndexes, filterSearchRecords, readArchiveQuery, archiveUrl } from '../lib/archive-search';
import { pageMetadata } from '../lib/site-pages';

test('Bengali normalization preserves consonants and equivalent nukta forms', () => {
  assert.equal(normalizeSearchText('যুদ্ধ'), 'যুদ্ধ');
  assert.equal(normalizeSearchText('য় ড় ঢ়'), normalizeSearchText('য় ড় ঢ়'));
  assert.equal(normalizeSearchText('ইসরাইল'), normalizeSearchText('ইসরায়েল'));
  assert.equal(normalizeSearchText('২০২৬'), '2026');
  assert.deepEqual(searchTokens('বাংলাদেশ\u200d ব্যাংক'), ['বাংলাদেশ', 'ব্যাংক']);
});

test('multiword prefix search intersects postings and applies publication/year filters', () => {
  const record = (slug: string, publication: string, publishedAt: string) => ({ slug, publication, publishedAt, title: slug, excerpt: '', publishedDateLabel: '' });
  const shard = { records: [record('a', 'সংবাদ', '2026-01-01'), record('b', 'চরচা', '2025-01-01'), record('c', 'সংবাদ', '2026-02-01')], postings: { বাংলাদেশ: [0, 1], ব্যাংক: [0, 2] } };
  assert.deepEqual(matchingRecordIndexes(shard, 'বাংলাদেশ ব্যাং'), [0]);
  assert.deepEqual(matchingRecordIndexes(shard, 'nothing'), []);
  assert.deepEqual(matchingRecordIndexes(shard, ''), []);
  assert.deepEqual(filterSearchRecords(shard.records, 'সংবাদ', '2026').map(record => record.slug), ['a', 'c']);
  assert.deepEqual(filterSearchRecords(shard.records, 'চরচা', '2026'), []);
});

test('shared archive URLs preserve Bengali queries and selected filters', () => {
  const url = archiveUrl('বাংলাদেশ ব্যাংক', 'সংবাদ', '2026');
  const records = [{ publication: 'সংবাদ', publishedAt: '2026-01-01' }];
  const restored = readArchiveQuery(new URL(url, 'https://zeauddinahmed.com').searchParams, records);
  assert.deepEqual(restored, { query: 'বাংলাদেশ ব্যাংক', year: '2026', publication: 'সংবাদ' });
  assert.deepEqual(readArchiveQuery(new URLSearchParams('q=bank&year=2999&publication=unknown'), records),
    { query: 'bank', year: '', publication: '' });
  assert.equal(archiveUrl(''), '/archive');
});

test('distinct page metadata identifies the page and rejects unknown routes', () => {
  assert.equal(pageMetadata('/archive').alternates.canonical, '/archive');
  assert.notEqual(pageMetadata('/about').title, pageMetadata('/archive').title);
  assert.throws(() => pageMetadata('/unknown'));
});
