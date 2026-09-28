const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-06-07-ndbd-lkdaun');
if (!article) throw new Error('7 June 2020 article not found');

const replacements = new Map([
  ['নি:স্বদের', 'নিঃস্বদের'],
  ['সামগ্রি', 'সামগ্রী'],
  ['আবিস্কার', 'আবিষ্কার'],
  ['ঔৎসক্য', 'ঔৎসুক্য'],
  ['গরীব', 'গরিব'],
  ['নিন্মবিত্ত', 'নিম্নবিত্ত'],
  ['চাকুরী', 'চাকরি'],
  ['পাণীয়ের', 'পানীয়ের'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['স্বাস্থবিধি', 'স্বাস্থ্যবিধি'],
  ['আভ্যন্তরীণ', 'অভ্যন্তরীণ'],
  ['আমদানী', 'আমদানি'],
  ['সংস্হানের', 'সংস্থানের'],
  ['বাঙ্গালীদের', 'বাঙালিদের'],
  ['বরাাদ্দ', 'বরাদ্দ'],
  ['বরফাচ্ছিত', 'বরফাচ্ছন্ন'],
  ['জারী', 'জারি'],
  ['পোষাক', 'পোশাক'],
  ['ভীড়', 'ভিড়'],
  ['ছোঁয়াছে', 'ছোঁয়াচে'],
  ['জরুরী', 'জরুরি'],
  ['আর্থনীতি', 'অর্থনীতি'],
  ['সামর্থ', 'সামর্থ্য'],
]);

let changed = 0;
article.body = article.body.map((section) => ({
  ...section,
  paragraphs: section.paragraphs.map((paragraph) => {
    let next = paragraph;
    for (const [wrong, right] of replacements) next = next.split(wrong).join(right);
    next = next.replace(/(^|[^\u0980-\u09FF])ঝাপ(?=$|[^\u0980-\u09FF])/g, '$1ঝাঁপ');
    if (next !== paragraph) changed += 1;
    return next;
  }),
}));

const output = `import type { ArchiveArticle } from './articles';\n\nexport const folderArticles: ArchiveArticle[] = ${JSON.stringify(context.result, null, 2)};\n`;
fs.writeFileSync(sourcePath, output, 'utf8');
console.log(`Corrected spelling in ${changed} paragraphs.`);
