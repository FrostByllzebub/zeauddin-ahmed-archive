const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-07-19-shaheder-kishori-meyeo-bibrt');
if (!article) throw new Error('19 July 2020 article not found');

const replacements = new Map([
  ['স্বাস্থ অধিদপ্তরের', 'স্বাস্থ্য অধিদপ্তরের'],
  ['স্বাস্থ অধিদপ্তর', 'স্বাস্থ্য অধিদপ্তর'],
  ['স্বাস্থবিধি', 'স্বাস্থ্যবিধি'],
  ['স্বাস্থসেবা', 'স্বাস্থ্যসেবা'],
  ['যোগোযোগ', 'যোগাযোগ'],
  ['চাকুরী', 'চাকরি'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['কুশলিবদের', 'কুশীলবদের'],
  ['সন্মানজনক', 'সম্মানজনক'],
  ['দু:স্থ', 'দুঃস্থ'],
  ['গরীব', 'গরিব'],
  ['ল্যাবরটরির', 'ল্যাবরেটরির'],
  ['বেশী', 'বেশি'],
  ['চাকুরিজীবী', 'চাকরিজীবী'],
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
