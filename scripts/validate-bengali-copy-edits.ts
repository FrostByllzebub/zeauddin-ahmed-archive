import { createHash } from 'node:crypto';
import { articles, type ArchiveArticle } from '../lib/articles';
import ledger from '../reports/bengali-spelling-review.json' with { type: 'json' };
import dateReview from '../reports/publication-date-review.json' with { type: 'json' };

type FieldEvidence = { field: string; before: string; after: string };
type Review = { number: number; slug: string; status: string; beforeSha256: string; reviewedSha256?: string; fields?: FieldEvidence[]; uncertain?: string[] };
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function validateBengaliCopyEdits() {
  let reviewed = 0, corrected = 0;
  const bySlug = new Map(articles.map(article => [article.slug, article]));
  for (const review of ledger.records as Review[]) {
    if (!review.status.startsWith('REVIEWED')) continue;
    const currentArticle = bySlug.get(review.slug);
    const approvedDate = dateReview.changes.find(change => change.slug === review.slug);
    if (currentArticle && approvedDate && (currentArticle.publishedAt !== approvedDate.after.publishedAt || currentArticle.publishedDateLabel !== approvedDate.after.publishedDateLabel)) throw new Error(`Unrecorded publication date change: column ${review.number}`);
    // Keep the completed spelling review immutable across the owner's later date-only request.
    const article = currentArticle && approvedDate ? { ...currentArticle, ...approvedDate.before } : currentArticle;
    if (!article || hash(article) !== review.reviewedSha256) throw new Error(`Reviewed text changed: column ${review.number}`);
    const restored: ArchiveArticle = { ...article, body: article.body.map(section => ({ ...section, paragraphs: [...section.paragraphs] })) };
    for (const evidence of review.fields ?? []) {
      // Numerical claims must stay byte-for-byte equivalent through copy edits.
      const numbers = (text: string) => text.match(/[0-9০-৯]+/g) ?? [];
      if (JSON.stringify(numbers(evidence.before)) !== JSON.stringify(numbers(evidence.after))) throw new Error(`Numerical text changed: column ${review.number}`);
      const match = /^body\.(\d+)\.paragraphs\.(\d+)$/.exec(evidence.field);
      if (match) {
        const section = restored.body[Number(match[1])];
        if (section?.paragraphs[Number(match[2])] !== evidence.after) throw new Error(`Paragraph evidence mismatch: column ${review.number}`);
        section.paragraphs[Number(match[2])] = evidence.before;
      } else if (evidence.field === 'title' || evidence.field === 'heroCaption') {
        if (restored[evidence.field] !== evidence.after) throw new Error(`Field evidence mismatch: column ${review.number}`);
        restored[evidence.field] = evidence.before;
      } else throw new Error(`Protected field in copy edits: column ${review.number}`);
    }
    if (hash(restored) !== review.beforeSha256) throw new Error(`Unrecorded change or metadata drift: column ${review.number}`);
    reviewed++;
    if (review.status === 'REVIEWED — CORRECTED') corrected++;
  }
  const unresolvedColumns = (ledger.records as Review[])
    .filter(review => (review.uncertain?.length ?? 0) > 0)
    .map(review => review.number);
  return { reviewed, corrected, remaining: ledger.total - reviewed, unresolvedColumns, readyForPublication: reviewed === ledger.total && unresolvedColumns.length === 0 };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/validate-bengali-copy-edits.ts')) {
  console.log('Bengali copy review:', JSON.stringify(validateBengaliCopyEdits()));
}
