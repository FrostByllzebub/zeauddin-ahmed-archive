const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-12-13-murti-bnam-bhaskry');
if (!article) throw new Error('13 December 2020 article not found');

const replacements = new Map([
  ['যাবত', 'যাবৎ'],
  ['ভেঙ্গে', 'ভেঙে'],
  ['চত্ত্বর', 'চত্বর'],
  ['পুজার', 'পূজার'],
  ['ভাঙ্গার', 'ভাঙার'],
  ['আশ্চার্য', 'আশ্চর্য'],
  ['আবিস্কারের', 'আবিষ্কারের'],
  ['শষ্য', 'শস্য'],
  ['বেশী', 'বেশি'],
  ['হজ্বে', 'হজে'],
  ['বাধানো', 'বাঁধানো'],
  ['উপসনা', 'উপাসনা'],
  ['আয়াতুল্লা', 'আয়াতুল্লাহ'],
  ['বেহেস্তি', 'বেহেশতি'],
  ['ধর্ম নিরপেক্ষ', 'ধর্মনিরপেক্ষ'],
  ['উদ্ভুত', 'উদ্ভূত'],
]);

let changed = 0;
article.body = article.body.map((section) => ({
  ...section,
  paragraphs: section.paragraphs.map((paragraph) => {
    let next = paragraph;
    for (const [wrong, right] of replacements) next = next.split(wrong).join(right);
    if (next !== paragraph) changed += 1;
    return next;
  }),
}));

const output = `import type { ArchiveArticle } from './articles';\n\nexport const folderArticles: ArchiveArticle[] = ${JSON.stringify(context.result, null, 2)};\n`;
fs.writeFileSync(sourcePath, output, 'utf8');
console.log(`Corrected spelling in ${changed} paragraphs.`);
