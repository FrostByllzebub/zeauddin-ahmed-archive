import type { ArchiveArticle } from './articles';
import reviews from '../reports/article-maintenance.json' with { type: 'json' };

// Later owner-approved maintenance supplements the frozen historical review.
// Exact before/after text prevents it from concealing unrelated content changes.
export function applyArticleMaintenance(article: ArchiveArticle): ArchiveArticle {
  const review = reviews.find(item => item.oldSlug === article.slug);
  if (!review) return article;
  const result = { ...article, slug: review.newSlug, printedPublishedAt: review.printedPublishedAt,
    ...(review.hideOriginalSource ? { hideOriginalSource: true } : {}),
    body: article.body.map(section => ({ ...section, paragraphs: [...section.paragraphs] })) };
  for (const edit of review.edits) {
    if (result.body[edit.section]?.paragraphs[edit.paragraph] !== edit.before) throw new Error(`Maintenance source drift: ${article.slug}`);
    result.body[edit.section].paragraphs[edit.paragraph] = edit.after;
  }
  return result;
}

export function restoreArticleMaintenance(article: ArchiveArticle): ArchiveArticle {
  const review = reviews.find(item => item.newSlug === article.slug);
  if (!review) return article;
  if (article.printedPublishedAt !== review.printedPublishedAt) throw new Error(`Unrecorded printed date change: ${article.slug}`);
  if (article.hideOriginalSource !== review.hideOriginalSource) throw new Error(`Unrecorded source visibility change: ${article.slug}`);
  const { printedPublishedAt, hideOriginalSource, ...original } = article;
  const result = { ...original, slug: review.oldSlug,
    body: article.body.map(section => ({ ...section, paragraphs: [...section.paragraphs] })) };
  for (const edit of review.edits) {
    if (result.body[edit.section]?.paragraphs[edit.paragraph] !== edit.after) throw new Error(`Reviewed maintenance text changed: ${article.slug}`);
    result.body[edit.section].paragraphs[edit.paragraph] = edit.before;
  }
  return result;
}
