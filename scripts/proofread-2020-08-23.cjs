const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-08-23-krona-bhyaksin-abiskar');
if (!article) throw new Error('23 August 2020 article not found');

const replacements = new Map([
  ['আবিস্কারের', 'আবিষ্কারের'],
  ['আক্রমন করবে', 'আক্রমণ করবে'],
  ['সর্তক', 'সতর্ক'],
  ['বানী', 'বাণী'],
  ['আহবান', 'আহ্বান'],
  ['ভবিষ্যত বানী', 'ভবিষ্যদ্বাণী'],
  ['দীর্ঘদিন ব্যাপী', 'দীর্ঘদিনব্যাপী'],
  ['বাকী', 'বাকি'],
  ['নিষ্কৃয়', 'নিষ্ক্রিয়'],
  ['কোর প্রতিরক্ষা', 'কোনো প্রতিরক্ষা'],
  ['চুড়ান্ত', 'চূড়ান্ত'],
  ['অ্যাটাক্ট', 'অ্যাটাক'],
  ['সংক্রমন', 'সংক্রমণ'],
  ['ফার্মাসিটিক্যালসের', 'ফার্মাসিউটিক্যালসের'],
  ['এন্টিবডি', 'অ্যান্টিবডি'],
  ['চেচামেচি', 'চেঁচামেচি'],
  ['ঘন্টা', 'ঘণ্টা'],
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
