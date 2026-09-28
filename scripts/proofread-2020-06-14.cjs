const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-06-14-amra-sbai-brnchora-brnbadi');
if (!article) throw new Error('14 June 2020 article not found');

const replacements = new Map([
  ['শেতাঙ্গ', 'শ্বেতাঙ্গ'],
  ['নি:শ্বাস', 'নিঃশ্বাস'],
  ['বাঙ্গালী', 'বাঙালি'],
  ['নিরবতা', 'নীরবতা'],
  ['উপঠৌকন', 'উপঢৌকন'],
  ['উপঠোকন', 'উপঢৌকন'],
  ['আইনীভাবে', 'আইনিভাবে'],
  ['সহপাঠি', 'সহপাঠী'],
  ['শ্রেষ্ঠত্ববাদি', 'শ্রেষ্ঠত্ববাদী'],
  ['রংয়ের', 'রঙের'],
  ['খুনসুঁটি', 'খুনসুটি'],
  ['পরিস্কার', 'পরিষ্কার'],
  ['মোঘল', 'মুঘল'],
  ['এখনোও', 'এখনো'],
  ['বেশী', 'বেশি'],
  ['ক্রীম', 'ক্রিম'],
  ['কুৎসিৎ', 'কুৎসিত'],
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
