const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-11-08-unmtt-jntar-unmadna');
if (!article) throw new Error('8 November 2020 article not found');

const replacements = new Map([
  ['অসাবধনাতাবশত', 'অসাবধানতাবশত'],
  ['বিয়ষটিও', 'বিষয়টিও'],
  ['ফেইসবুকে', 'ফেসবুকে'],
  ['জড় হয়ে', 'জড়ো হয়ে'],
  ['বাড়ী', 'বাড়ি'],
  ['উদ্যোগকে', 'উদ্যোগকে'],
  ['পান্জাবী', 'পাঞ্জাবি'],
  ['খ্রীষ্টান', 'খ্রিস্টান'],
  ['খৃস্টান', 'খ্রিস্টান'],
  ['এতোটা', 'এতটা'],
  ['বিজ্ঞান সম্মত', 'বিজ্ঞানসম্মত'],
  ['মুসমানদের', 'মুসলমানদের'],
  ['সষ্টি', 'সৃষ্টি'],
  ['ভাংচুর', 'ভাঙচুর'],
  ['অগ্নি সংযোগে', 'অগ্নিসংযোগে'],
  ['ইন্ধন যুগিয়েছে', 'ইন্ধন জুগিয়েছে'],
  ['উম্মাদনা', 'উন্মাদনা'],
  ['উম্মাদ', 'উন্মাদ'],
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
