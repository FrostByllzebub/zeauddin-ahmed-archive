const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-10-04-dhrshner-brbrta');
if (!article) throw new Error('4 October 2020 article not found');

const replacements = new Map([
  ['রিমাণ্ডে', 'রিমান্ডে'],
  ['তদের', 'তাদের'],
  ['জবাবদিহী', 'জবাবদিহি'],
  ['নখদর্পনে', 'নখদর্পণে'],
  ['জরুরী', 'জরুরি'],
  ['কেন্দ্রিয়', 'কেন্দ্রীয়'],
  ['আঠার', 'আঠারো'],
  ['গরীব', 'গরিব'],
  ['পৌরষত্ব', 'পৌরুষত্ব'],
  ['নিরবে', 'নীরবে'],
  ['হয়রানীর', 'হয়রানির'],
  ['এসিড', 'অ্যাসিড'],
  ['ঘন্টা', 'ঘণ্টা'],
  ['চাকুরী', 'চাকরি'],
  ['যানপ্রাণ', 'জানপ্রাণ'],
  ['মুহুর্তে', 'মুহূর্তে'],
  ['শ্রেষ্ট', 'শ্রেষ্ঠ'],
  ['দু:খজনক', 'দুঃখজনক'],
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
