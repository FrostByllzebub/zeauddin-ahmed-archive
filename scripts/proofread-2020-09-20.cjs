const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-09-20-msjide-bisforn');
if (!article) throw new Error('20 September 2020 article not found');

const replacements = new Map([
  ['মুসল্লী', 'মুসল্লি'],
  ['বিস্ফারণে', 'বিস্ফোরণে'],
  ['পরিস্কারে', 'পরিষ্কারে'],
  ['নক্সায়', 'নকশায়'],
  ['উপসনালয়', 'উপাসনালয়'],
  ['কান্ড', 'কাণ্ড'],
  ['নাইনের', 'লাইনের'],
  ['সচারাচর', 'সচরাচর'],
  ['দু:খের', 'দুঃখের'],
  ['বেশী', 'বেশি'],
  ['বাড়ী', 'বাড়ি'],
  ['নিরব', 'নীরব'],
  ['ধর্ণা', 'ধর্না'],
  ['শীতলক্ষা', 'শীতলক্ষ্যা'],
  ['আলমগণ', 'আলেমগণ'],
  ['ভাঙ্গতে', 'ভাঙতে'],
  ['পোষাক-পরিচ্ছদ', 'পোশাক-পরিচ্ছদ'],
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
