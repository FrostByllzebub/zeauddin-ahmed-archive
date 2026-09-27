const fs = require('node:fs');

const file = 'lib/folderArticles.ts';
const source = fs.readFileSync(file, 'utf8');
const start = source.indexOf('export const folderArticles: ArchiveArticle[] = ') + 'export const folderArticles: ArchiveArticle[] = '.length;
const end = source.lastIndexOf('\n];') + 3;
if (start < 0 || end < 0) throw new Error('folderArticles export boundaries not found');

const articles = JSON.parse(source.slice(start, end).trim().replace(/;$/, ''));
const existing = articles.find((article) => article.slug === '2021-12-23-amerikake-tusht-rakha-kthin');
if (!existing) throw new Error('source article not found');

const slug = '2021-12-23-amerikake-tusht-rakha-kthin-samprotik-deshkal';
if (articles.some((article) => article.slug === slug)) {
  console.log('ALREADY_STAGED', slug);
  process.exit(0);
}

articles.unshift({
  ...existing,
  slug,
  publication: 'সাম্প্রতিক দেশকাল',
  publishedAt: '2021-12-23',
  publishedDateLabel: '২৩ ডিসেম্বর ২০২১',
  originalUrl: '',
  heroImage: '/articles/archive-editorial-default.svg',
  heroCaption: 'এই লেখার জন্য সংরক্ষণ-শৈলীর চিত্র',
  imageSourceUrl: '',
  imageCredit: 'জিয়ার কলাম আর্কাইভ',
});

const next = `${source.slice(0, start)}${JSON.stringify(articles, null, 2)}${source.slice(end)}`;
fs.writeFileSync(file, next, 'utf8');
console.log('STAGED', slug);
