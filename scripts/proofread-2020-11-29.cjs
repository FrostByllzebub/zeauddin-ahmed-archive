const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-11-29-munirujjman-asamprdayik-chetnar-prtibhu');
if (!article) throw new Error('29 November 2020 article not found');

const replacements = new Map([
  ['সংবাদিক', 'সাংবাদিক'],
  ['ছোট', 'ছোট'],
  ['প্রকৌশলী', 'প্রকৌশলী'],
  ['গনঅভ্যুত্থানে', 'গণঅভ্যুত্থানে'],
  ['প্রাইমারী', 'প্রাইমারি'],
  ['শামছুদ্দিন', 'শামসুদ্দিন'],
  ['ঘন্টা', 'ঘণ্টা'],
  ['এগারটায়', 'এগারোটায়'],
  ['গুণি', 'গুণী'],
  ['প্রমূখ', 'প্রমুখ'],
  ['লেখনি', 'লেখনী'],
  ['স্পষটবাদী', 'স্পষ্টবাদী'],
  ['আমৃত্য', 'আমৃত্যু'],
  ['বাঙ্গালী', 'বাঙালি'],
  ['বেশী', 'বেশি'],
  ['আপোষহীন', 'আপসহীন'],
  ['মুনিরুজ্জামান', 'মুনীরুজ্জামান'],
  ['মনিরুজ্জমান', 'মুনীরুজ্জামান'],
  ['শামছুর রাহমান', 'শামসুর রাহমান'],
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
