const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-08-17-khal-o-jlabddhtar-rajniti');
if (!article) throw new Error('17 August 2020 article not found');

const replacements = new Map([
  ['পরিস্কারে', 'পরিষ্কারে'],
  ['স্তুপাকারে', 'স্তূপাকারে'],
  ['দু:সহ', 'দুঃসহ'],
  ['শীতলক্ষা', 'শীতলক্ষ্যা'],
  ['বেশীরভাগ', 'বেশিরভাগ'],
  ['ভলিয়্যুমে', 'ভলিউমে'],
  ['উদাসিনতা', 'উদাসীনতা'],
  ['আবিস্কারের', 'আবিষ্কারের'],
  ['দৌঁড়ে', 'দৌড়ে'],
  ['চাকুরী', 'চাকরি'],
  ['ঔৎসক্য', 'ঔৎসুক্য'],
  ['ফেইসবুকে', 'ফেসবুকে'],
  ['বেশী', 'বেশি'],
  ['ভাঙ্গছে', 'ভাঙছে'],
  ['নির্গমণ', 'নির্গমন'],
  ['দাবী', 'দাবি'],
  ['দুষণমুক্ত', 'দূষণমুক্ত'],
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
