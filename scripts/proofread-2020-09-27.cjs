const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-09-27-khichudi-niye-matm');
if (!article) throw new Error('27 September 2020 article not found');

const replacements = new Map([
  ['বাবত', 'বাবদ'],
  ['চট্রগ্রাম', 'চট্টগ্রাম'],
  ['রাজী', 'রাজি'],
  ['বেশী', 'বেশি'],
  ['জরুরী', 'জরুরি'],
  ['প্রশিক্ষণর', 'প্রশিক্ষণের'],
  ['শ্রেনীর', 'শ্রেণির'],
  ['টেণ্ডারবাজি', 'টেন্ডারবাজি'],
  ['বৃটিশ', 'ব্রিটিশ'],
  ['বায়ুদুষণ', 'বায়ুদূষণ'],
  ['কম্পুনেন্ট', 'কম্পোনেন্ট'],
  ['আনবিক', 'আণবিক'],
  ['টেবল', 'টেবিল'],
  ['পর্যন্তকোন', 'পর্যন্ত কোন'],
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
