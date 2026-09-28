const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-12-06-sakiber-kshma-prarthna');
if (!article) throw new Error('6 December 2020 article not found');

const replacements = new Map([
  ['কালীপুজার', 'কালীপূজার'],
  ['পুজামণ্ডপে', 'পূজামণ্ডপে'],
  ['পুজাটির', 'পূজাটির'],
  ['পুজার', 'পূজার'],
  ['ভেঙ্গেছে', 'ভেঙেছে'],
  ['পাকিস্তানী', 'পাকিস্তানি'],
  ['শশ্রুমণ্ডিত', 'শ্মশ্রুমণ্ডিত'],
  ['হাজ্বী', 'হাজি'],
  ['ঘুর্ণয়মান', 'ঘূর্ণায়মান'],
  ['ক্ষুন্ন', 'ক্ষুণ্ণ'],
  ['বাঙ্গালীর', 'বাঙালির'],
  ['না কারা', 'না করা'],
  ['সন্মানীয়', 'সম্মানীয়'],
  ['ম্যারোডোনা', 'ম্যারাডোনা'],
  ['যাদুকরী', 'জাদুকরী'],
  ['আবিস্কারের', 'আবিষ্কারের'],
  ['বানী', 'বাণী'],
  ['আবিস্কৃত', 'আবিষ্কৃত'],
  ['সাহিত্যিগণ', 'সাহিত্যিকগণ'],
  ['মাহাত্ম', 'মাহাত্ম্য'],
  ['ইদের', 'ঈদের'],
  ['ফেইসবুক', 'ফেসবুক'],
  ['আক্রমন', 'আক্রমণ'],
  ['বেশী', 'বেশি'],
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
