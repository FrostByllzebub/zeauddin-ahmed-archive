const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-10-25-allahr-duniyay-jmir-abhab-nei');
if (!article) throw new Error('25 October 2020 article not found');

const replacements = new Map([
  ['মানুষেরী', 'মানুষের'],
  ['বেশী', 'বেশি'],
  ['উপসনালয়ের', 'উপাসনালয়ের'],
  ['প্রামাণের', 'প্রমাণের'],
  ['বৈচিত্রের', 'বৈচিত্র্যের'],
  ['ভূমিপুজা', 'ভূমিপূজা'],
  ['নৃতত্ববিদরা', 'নৃতত্ত্ববিদরা'],
  ['দেব দেবী', 'দেবদেবী'],
  ['স্থায়ীত্ব', 'স্থায়িত্ব'],
  ['ভেঙ্গে', 'ভেঙে'],
  ['জুম্মার', 'জুমার'],
  ['উপসনার', 'উপাসনার'],
  ['রিপাবলিকানে', 'রিপাবলিকে'],
  ['ধর্মাবলম্বাদের', 'ধর্মাবলম্বীদের'],
  ['গুড়িয়ে', 'গুঁড়িয়ে'],
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
