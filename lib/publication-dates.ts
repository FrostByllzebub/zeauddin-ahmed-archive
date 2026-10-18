type PublicationDate = { publishedAt: string; publishedDateLabel: string };
const bnDigits = '০১২৩৪৫৬৭৮৯';
const ascii = (s: string) => s.replace(/[০-৯]/g, d => String(bnDigits.indexOf(d)));
const months: Record<string, number> = { 'জানুয়ারি': 1, 'জানুয়ারি': 1, 'ফেব্রুয়ারি': 2, 'ফেব্রুয়ারি': 2, 'মার্চ': 3, 'এপ্রিল': 4, 'মে': 5, 'জুন': 6, 'জুলাই': 7, 'আগস্ট': 8, 'সেপ্টেম্বর': 9, 'অক্টোবর': 10, 'নভেম্বর': 11, 'ডিসেম্বর': 12 };

export const publicationDateNotice = 'এই আর্কাইভে প্রকাশের তারিখ হিসেবে অনলাইন সংস্করণের তারিখ দেখানো হয়। অধিকাংশ কলামের মুদ্রিত সংবাদপত্রের সংস্করণ একই দিন বা পরদিন প্রকাশিত হয়েছে। সুনির্দিষ্ট তারিখ জানা না থাকলে তা অনির্দিষ্ট হিসেবে উল্লেখ করা হয়েছে।';

export function withOnlinePublicationDate<T extends PublicationDate>(article: T): T {
  const match = /\(অনলাইনে\s+([০-৯0-9]{1,2})\s+([^\s)]+)(?:\s+([০-৯0-9]{4}))?\)/u.exec(article.publishedDateLabel);
  if (match) {
    const month = months[match[2]];
    if (!month) throw new Error(`Unknown online-publication month: ${match[2]}`);
    const day = Number(ascii(match[1]));
    const printedYear = Number(article.publishedAt.slice(0, 4));
    const year = match[3] ? Number(ascii(match[3])) : printedYear - (month > Number(article.publishedAt.slice(5, 7)) ? 1 : 0);
    const publishedAt = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (new Date(publishedAt + 'T00:00:00Z').toISOString().slice(0, 10) !== publishedAt) throw new Error('Invalid online-publication date');
    const yearLabel = String(year).replace(/\d/g, d => bnDigits[Number(d)]);
    return { ...article, publishedAt, publishedDateLabel: `${match[1]} ${match[2]} ${yearLabel}` };
  }
  const publishedDateLabel = article.publishedDateLabel.replace(/\s*\((?:অনলাইনে[^)]*|মুদ্রিত সংস্করণ[^)]*|Facebook post identifies publication date)\)/gu, '').trim();
  return publishedDateLabel === article.publishedDateLabel ? article : { ...article, publishedDateLabel };
}
