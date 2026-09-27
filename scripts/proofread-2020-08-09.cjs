const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-08-09-pshu-prem-o-manbikta');
if (!article) throw new Error('9 August 2020 article not found');

const replacements = new Map([
  ['আক্রমনে', 'আক্রমণে'],
  ['বেশী', 'বেশি'],
  ['কর্মকান্ডে', 'কর্মকাণ্ডে'],
  ['পশুপ্রেমি', 'পশুপ্রেমী'],
  ['পড়ালিখা', 'পড়ালেখা'],
  ['কোরবানী', 'কোরবানি'],
  ['কাঙ্কালসার', 'কঙ্কালসার'],
  ['মূহুর্তে', 'মুহূর্তে'],
  ['বনী', 'বনি'],
  ['অত্যাচারি', 'অত্যাচারী'],
  ['অহঙ্কারে', 'অহংকারে'],
  ['প্রাণির', 'প্রাণীর'],
  ['প্রচন্ড', 'প্রচণ্ড'],
  ['যন্ত্রনাদায়ক', 'যন্ত্রণাদায়ক'],
  ['বয়ষ্করা', 'বয়স্করা'],
  ['নিষ্ঠূর', 'নিষ্ঠুর'],
  ['খুনাখুনির', 'খুনোখুনির'],
  ['বান্ছনীয়', 'বাঞ্ছনীয়'],
  ['হেঁচড়ে', 'হিঁচড়ে'],
]);

let changed = 0;
article.body = article.body.map((section) => ({
  ...section,
  paragraphs: section.paragraphs.map((paragraph) => {
    let next = paragraph;
    for (const [wrong, right] of replacements) next = next.split(wrong).join(right);
    next = next.replace(/(^|[^\u0980-\u09FF])স্বাস্থ(?=$|[^\u0980-\u09FF])/g, '$1স্বাস্থ্য');
    if (next !== paragraph) changed += 1;
    return next;
  }),
}));

const output = `import type { ArchiveArticle } from './articles';\n\nexport const folderArticles: ArchiveArticle[] = ${JSON.stringify(context.result, null, 2)};\n`;
fs.writeFileSync(sourcePath, output, 'utf8');
console.log(`Corrected spelling in ${changed} paragraphs.`);
