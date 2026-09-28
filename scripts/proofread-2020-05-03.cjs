const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-05-03-chiki-skder-atngk');
if (!article) throw new Error('3 May 2020 article not found');

const replacements = new Map([
  ['বাড়ীর', 'বাড়ির'],
  ['গাড়ী', 'গাড়ি'],
  ['আমদানী', 'আমদানি'],
  ['আক্রমনে', 'আক্রমণে'],
  ['বিলিন', 'বিলীন'],
  ['অচ্যুত', 'অচ্ছুত'],
  ['বেশী', 'বেশি'],
  ['পরিচ্ছনতা-কর্মী', 'পরিচ্ছন্নতা-কর্মী'],
  ['জরুরী', 'জরুরি'],
  ['কিন্ত', 'কিন্তু'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['বান্ছনীয়', 'বাঞ্ছনীয়'],
  ['স্বাস্থমন্ত্রণালয়ের', 'স্বাস্থ্য মন্ত্রণালয়ের'],
  ['প্রেক্টিশনারদের', 'প্র্যাকটিশনারদের'],
  ['সন্মান', 'সম্মান'],
  ['মূহুর্তে', 'মুহূর্তে'],
  ['স্বাস্থ সেবাকর্মী', 'স্বাস্থ্য সেবাকর্মী'],
  ['আক্রমন', 'আক্রমণ'],
  ['তরুন', 'তরুণ'],
  ['সংক্রমন', 'সংক্রমণ'],
  ['জীবানুর', 'জীবাণুর'],
  ['আবিস্কারের', 'আবিষ্কারের'],
  ['আশ্বস্থ', 'আশ্বস্ত'],
  ['অসর্তক', 'অসতর্ক'],
  ['পারষ্পরিক', 'পারস্পরিক'],
  ['দু:খের', 'দুঃখের'],
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
