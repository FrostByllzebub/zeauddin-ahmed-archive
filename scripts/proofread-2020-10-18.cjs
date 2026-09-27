const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-10-18-rshid-haydar-tini-ekjni');
if (!article) throw new Error('18 October 2020 article not found');

const replacements = new Map([
  ['দু:সাহসিক', 'দুঃসাহসিক'],
  ['ফ্রেব্রুয়ারি', 'ফেব্রুয়ারি'],
  ['উপচার্য', 'উপাচার্য'],
  ['সহপাঠি', 'সহপাঠী'],
  ['রোড়ের', 'রোডের'],
  ['শাড়ীর', 'শাড়ির'],
  ['পডিয়েছেন', 'পড়িয়েছেন'],
  ['রশিদ হায়দার', 'রশীদ হায়দার'],
  ['উর্ধশ্বাসে', 'ঊর্ধ্বশ্বাসে'],
  ['তার্থভূমি', 'তীর্থভূমি'],
  ['মুক্তযোদ্ধার', 'মুক্তিযোদ্ধার'],
  ['দারুন', 'দারুণ'],
  ['গ্লোগান', 'স্লোগান'],
  ['মুহুর্ত', 'মুহূর্ত'],
  ['ম্যাসেজ', 'মেসেজ'],
  ['নিরবে', 'নীরবে'],
  ['পরিস্ফূট', 'পরিস্ফুট'],
  ['বাঙ্গালী', 'বাঙালি'],
  ['জানুয়ারী', 'জানুয়ারি'],
  ['লণ্ডন', 'লন্ডন'],
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
