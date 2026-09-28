const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-09-06-bhart-bangladesh-chin');
if (!article) throw new Error('6 September 2020 article not found');

const replacements = new Map([
  ['ঘন্টা ব্যাপী', 'ঘণ্টাব্যাপী'],
  ['ঔৎসক্য', 'ঔৎসুক্য'],
  ['আমদানী', 'আমদানি'],
  ['বেশী', 'বেশি'],
  ['পশ্চিম বঙ্গ', 'পশ্চিমবঙ্গ'],
  ['বাংলাদেশী', 'বাংলাদেশি'],
  ['কোনঠাসা', 'কোণঠাসা'],
  ['বাঙ্গালী', 'বাঙালি'],
  ['সনাক্ত', 'শনাক্ত'],
  ['বন্টনে', 'বণ্টনে'],
  ['দাবী', 'দাবি'],
  ['শ্লোগান', 'স্লোগান'],
  ['বাংলাদেশর', 'বাংলাদেশের'],
  ['বাকবিতন্ডা', 'বাকবিতণ্ডা'],
  ['শ্রীলংকায়', 'শ্রীলঙ্কায়'],
  ['আষ্টে-পৃষ্টে', 'আষ্টেপৃষ্ঠে'],
  ['ভূটানে', 'ভুটানে'],
  ['কর্মকান্ডের', 'কর্মকাণ্ডের'],
  ['বংলাদেশের', 'বাংলাদেশের'],
  ['পররাস্ট্র', 'পররাষ্ট্র'],
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
