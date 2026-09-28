const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-02-09-ami-bhot-diyechhi');
if (!article) throw new Error('9 February 2020 article not found');

const replacements = new Map([
  ['ফর্মূলায়', 'ফর্মুলায়'],
  ['কোন পদ্ধতিই', 'কোনো পদ্ধতিই'],
  ['জালিয়তি', 'জালিয়াতি'],
  ['নিরবে', 'নীরবে'],
  ['নিরব', 'নীরব'],
  ['যে সব', 'যেসব'],
  ['কোন বিকল্প', 'কোনো বিকল্প'],
  ['চ্যান্সলর', 'চ্যান্সেলর'],
  ['খোঁজ', 'খোঁজ'],
  ['ছাডা', 'ছাড়া'],
  ['আঙ্গুলের', 'আঙুলের'],
  ['সফটওয়ার', 'সফটওয়্যার'],
  ['কা-জ্ঞানহীন', 'কাণ্ডজ্ঞানহীন'],
  ['ম্যানুয়্যাল', 'ম্যানুয়াল'],
  ['আর্বজনা', 'আবর্জনা'],
  ['ম্যানুয়ালী', 'ম্যানুয়ালি'],
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
