import type { ArchiveArticle } from './articles';
import reviewedEdits from './bengaliCopyEdits.json' with { type: 'json' };

export type BengaliCopyEdit = {
  field: string;
  before: string;
  after: string;
  occurrences: number;
  reason: string;
};

// Corrections are approved per article and paragraph. Fail closed if source text
// changes, rather than silently applying an editorial decision to new wording.
export function applyCopyEdits(article: ArchiveArticle, edits: BengaliCopyEdit[]): ArchiveArticle {
  if (!edits.length) return article;
  const result = { ...article, body: article.body.map(section => ({ ...section, paragraphs: [...section.paragraphs] })) };
  for (const edit of edits) {
    const match = /^body\.(\d+)\.paragraphs\.(\d+)$/.exec(edit.field);
    const paragraph = match ? result.body[Number(match[1])]?.paragraphs[Number(match[2])] : undefined;
    const text = match ? paragraph : edit.field === 'title' ? result.title : edit.field === 'heroCaption' ? result.heroCaption : undefined;
    if (text === undefined || !edit.before || edit.before === edit.after || !Number.isInteger(edit.occurrences) || edit.occurrences < 1) {
      throw new Error(`Invalid copy edit: ${article.slug}/${edit.field}`);
    }
    const count = text.split(edit.before).length - 1;
    if (count !== edit.occurrences) throw new Error(`Copy edit source drift: ${article.slug}/${edit.field}; expected ${edit.occurrences}, found ${count}`);
    const corrected = text.split(edit.before).join(edit.after);
    if (match) result.body[Number(match[1])].paragraphs[Number(match[2])] = corrected;
    else if (edit.field === 'title') result.title = corrected;
    else result.heroCaption = corrected;
  }
  return result;
}

export function applyBengaliCopyEdits(article: ArchiveArticle): ArchiveArticle {
  return applyCopyEdits(article, (reviewedEdits as Record<string, BengaliCopyEdit[]>)[article.slug] ?? []);
}
