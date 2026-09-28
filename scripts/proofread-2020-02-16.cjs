const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-02-16-jngner-opr-astha-nei');
if (!article) throw new Error('16 February 2020 article not found');

const replacements = new Map([
  ['ভোট জালিয়তি', 'ভোট জালিয়াতি'],
  ['কোন পদ্ধতিই', 'কোনো পদ্ধতিই'],
  ['কোন দলই', 'কোনো দলই'],
  ['লেবেল প্লেয়িং ফিল্ড', 'লেভেল প্লেয়িং ফিল্ড'],
  ['কোমর ভেঙ্গে গেছে', 'কোমর ভেঙে গেছে'],
  ['নিরব ভোট', 'নীরব ভোট'],
  ['দৃঢ?তার', 'দৃঢ়তার'],
  ['তত্ত্ববধায়ক', 'তত্ত্বাবধায়ক'],
  ['কা-জ্ঞান', 'কাণ্ডজ্ঞান'],
  ['ঠেঙ্গানোর', 'ঠ্যাঙানোর'],
  ['অঙ্গসংঠনের', 'অঙ্গসংগঠনের'],
  ['আঙ্গুলের', 'আঙুলের'],
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
