const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-10-11-dhrshne-bipryst-bangladesh');
if (!article) throw new Error('11 October 2020 article not found');

const replacements = new Map([
  ['বাড়ী', 'বাড়ি'],
  ['চাচী', 'চাচি'],
  ['গরীব', 'গরিব'],
  ['গাড়ী', 'গাড়ি'],
  ['অহঙ্কার', 'অহংকার'],
  ['আশির্বাদ', 'আশীর্বাদ'],
  ['সন্মানিত', 'সম্মানিত'],
  ['অপাঙ্তেয়', 'অপাঙ্ক্তেয়'],
  ['লিপিস্টিক', 'লিপস্টিক'],
  ['পোষাক', 'পোশাক'],
  ['ঝাপিয়ে', 'ঝাঁপিয়ে'],
  ['বাঙ্গালী', 'বাঙালি'],
  ['অধরাধীর', 'অপরাধীর'],
  ['চাকুরী', 'চাকরি'],
  ['দাবী', 'দাবি'],
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
