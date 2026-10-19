import test from 'node:test';
import assert from 'node:assert/strict';
import { articles } from '../lib/articles';
import { applyCopyEdits } from '../lib/bengali-copy-edit';
import { validateBengaliCopyEdits } from '../scripts/validate-bengali-copy-edits';
import ledger from '../reports/bengali-spelling-review.json' with { type: 'json' };

test('recorded reviews preserve every unedited field and numerical sequence', () => {
  assert.doesNotThrow(validateBengaliCopyEdits);
});

test('review validation rejects unrecorded changes to an already reviewed column', () => {
  const sample = articles.find(article => article.slug === ledger.records[0].slug)!, original = sample.originalUrl;
  try {
    sample.originalUrl = 'https://example.invalid/unreviewed-source';
    assert.throws(validateBengaliCopyEdits, /Reviewed text changed/);
  } finally { sample.originalUrl = original; }
});

test('copy edits fail on source drift and cannot address factual metadata', () => {
  const sample = articles[0];
  const edit = { field: 'body.0.paragraphs.0', before: 'missing fixture text', after: 'সংশোধন', occurrences: 1, reason: 'test' };
  assert.throws(() => applyCopyEdits(sample, [edit]), /source drift/);
  assert.throws(() => applyCopyEdits(sample, [{ ...edit, field: 'publishedAt', before: sample.publishedAt }]), /Invalid copy edit/);
});

test('paragraph correction preserves the input, metadata and paragraph boundaries', () => {
  const sample = { ...articles[0], body: [{ heading: 'শিরোনাম', paragraphs: ['রিমাণ্ডে ১২ জন।', 'অপরিবর্তিত।'] }] };
  const result = applyCopyEdits(sample, [{ field: 'body.0.paragraphs.0', before: 'রিমাণ্ড', after: 'রিমান্ড', occurrences: 1, reason: 'বিদেশি শব্দে ন' }]);
  assert.equal(sample.body[0].paragraphs[0], 'রিমাণ্ডে ১২ জন।');
  assert.deepEqual(result.body, [{ heading: 'শিরোনাম', paragraphs: ['রিমান্ডে ১২ জন।', 'অপরিবর্তিত।'] }]);
  const { body: originalBody, ...originalMetadata } = sample;
  const { body: revisedBody, ...revisedMetadata } = result;
  assert.deepEqual(revisedMetadata, originalMetadata);
});
