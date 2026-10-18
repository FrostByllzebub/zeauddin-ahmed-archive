import test from 'node:test';
import assert from 'node:assert/strict';
import { articles } from '../lib/articles';
import { withOnlinePublicationDate } from '../lib/publication-dates';
import { validateBengaliCopyEdits } from '../scripts/validate-bengali-copy-edits';
import dateReview from '../reports/publication-date-review.json' with { type: 'json' };

test('single online date removes printed-edition notes without changing the article', () => {
  const original = { publishedAt: '2024-06-15', publishedDateLabel: '১৫ জুন ২০২৪ (অনলাইনে; মুদ্রিত সংস্করণ ১৬ জুন)', body: ['অপরিবর্তিত পাঠ'] };
  assert.deepEqual(withOnlinePublicationDate(original), { ...original, publishedDateLabel: '১৫ জুন ২০২৪' });
  assert.equal(original.publishedDateLabel, '১৫ জুন ২০২৪ (অনলাইনে; মুদ্রিত সংস্করণ ১৬ জুন)');
});

test('explicit online dates handle month and year boundaries', () => {
  assert.deepEqual(withOnlinePublicationDate({ publishedAt: '2025-06-01', publishedDateLabel: '০১ জুন ২০২৫ (অনলাইনে ৩১ মে)' }), { publishedAt: '2025-05-31', publishedDateLabel: '৩১ মে ২০২৫' });
  assert.deepEqual(withOnlinePublicationDate({ publishedAt: '2025-01-01', publishedDateLabel: '১ জানুয়ারি ২০২৫ (অনলাইনে ৩১ ডিসেম্বর)' }), { publishedAt: '2024-12-31', publishedDateLabel: '৩১ ডিসেম্বর ২০২৪' });
  assert.throws(() => withOnlinePublicationDate({ publishedAt: '2025-03-01', publishedDateLabel: '১ মার্চ ২০২৫ (অনলাইনে ৩০ ফেব্রুয়ারি)' }));
});

test('all catalog dates omit edition annotations and preserve genuinely unknown days', () => {
  assert.equal(articles.length, dateReview.reviewed);
  for (const a of articles) assert(!/অনলাইনে|মুদ্রিত সংস্করণ|Facebook post identifies/.test(a.publishedDateLabel), a.slug);
  for (const slug of dateReview.unspecified) assert(articles.find(a => a.slug === slug)?.publishedDateLabel.includes('তারিখ অনির্দিষ্ট'), slug);
  for (const change of dateReview.changes) {
    const a = articles.find(a => a.slug === change.slug)!;
    assert.equal(a.publishedAt, change.after.publishedAt);
    assert.equal(a.publishedDateLabel, change.after.publishedDateLabel);
  }
});

test('date presentation approval cannot hide a later unrecorded date change', () => {
  const sample = articles.find(a => a.slug === dateReview.changes[0].slug)!;
  const original = sample.publishedAt;
  try {
    sample.publishedAt = '2000-01-01';
    assert.throws(validateBengaliCopyEdits, /Unrecorded publication date change/);
  } finally { sample.publishedAt = original; }
});
