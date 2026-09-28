const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-04-12-amader-chritrer-bichitr-rup');
if (!article) throw new Error('12 April 2020 article not found');

const replacements = new Map([
  ['আর কোন পথ', 'আর কোনো পথ'],
  ['মালয়েশীয়া', 'মালয়েশিয়া'],
  ['এখনোমাঝে', 'এখনো মাঝে'],
  ['করেবিশ্বাস', 'করে বিশ্বাস'],
  ['মাধ্যেম', 'মাধ্যমে'],
  ['তা-ব', 'তাণ্ডব'],
  ['আবিস্কার', 'আবিষ্কার'],
  ['পেছনেইহুদি', 'পেছনে ইহুদি'],
  ['বজায়রেখে', 'বজায় রেখে'],
  ['বেশী', 'বেশি'],
  ['করেনাভাইরাস', 'করোনাভাইরাস'],
  ['ঠেঙ্গাচ্ছে', 'ঠ্যাঙাচ্ছে'],
  ['দেয়াবন্ধ', 'দেয়া বন্ধ'],
  ['মুসলিমদেশ', 'মুসলিম দেশ'],
  ['প্রার্থনারতাৎপর্য', 'প্রার্থনার তাৎপর্য'],
  ['গোঁড়া', 'গোঁড়া'],
  ['উপসনালয়ে', 'উপাসনালয়ে'],
  ['দৃঢ়বিশ্বাসের', 'দৃঢ় বিশ্বাসের'],
  ['গোয়ার্তুমি', 'গোঁয়ার্তুমি'],
  ['মুন্ডপাত', 'মুণ্ডপাত'],
  ['স্বাস্থ সংস্থার', 'স্বাস্থ্য সংস্থার'],
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
