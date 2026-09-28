const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-07-12-takay-bagher-dudh-mele');
if (!article) throw new Error('12 July 2020 article not found');

const replacements = new Map([
  ['ভুইয়াকে', 'ভূঁইয়াকে'],
  ['যাদুমন্ত্রে', 'জাদুমন্ত্রে'],
  ['লক্ষীপুর', 'লক্ষ্মীপুর'],
  ['ঈমাম', 'ইমাম'],
  ['বেশী', 'বেশি'],
  ['সন্মান', 'সম্মান'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['হজ্বে', 'হজে'],
  ['বানী', 'বাণী'],
  ['চান্চল্যকর', 'চাঞ্চল্যকর'],
  ['খন্ডনের', 'খণ্ডনের'],
  ['বৃটিশ', 'ব্রিটিশ'],
  ['পন্চাশটি', 'পঞ্চাশটি'],
  ['কর্পোশনের', 'কর্পোরেশনের'],
  ['বাড়ী', 'বাড়ি'],
  ['ত্যাগি', 'ত্যাগী'],
  ['দীর্ঘ মেয়াদী', 'দীর্ঘমেয়াদি'],
  ['ঘন্টা', 'ঘণ্টা'],
  ['ভাংচুর', 'ভাঙচুর'],
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
