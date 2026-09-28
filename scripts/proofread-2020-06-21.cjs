const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-06-21-lkdaune-mansik-dushchinta');
if (!article) throw new Error('21 June 2020 article not found');

const replacements = new Map([
  ['বারন্দা', 'বারান্দা'],
  ['মুহুর্তে', 'মুহূর্তে'],
  ['এতদসত্বেও', 'এতদসত্ত্বেও'],
  ['বেশী', 'বেশি'],
  ['পরিস্কার', 'পরিষ্কার'],
  ['পেচিয়ে', 'পেঁচিয়ে'],
  ['জরুরী', 'জরুরি'],
  ['অন লাইনে', 'অনলাইনে'],
  ['গাড়ী', 'গাড়ি'],
  ['দুষিত', 'দূষিত'],
  ['বাইর', 'বাইরে'],
  ['যাটোর্ধ', 'ষাটোর্ধ্ব'],
  ['দু:খজনক', 'দুঃখজনক'],
  ['স্বাস্থ মন্ত্রণালয়ের', 'স্বাস্থ্য মন্ত্রণালয়ের'],
  ['স্বাস্থকর্মীদের', 'স্বাস্থ্যকর্মীদের'],
  ['এন্টিবাইওটিক', 'অ্যান্টিবায়োটিক'],
  ['ভুত', 'ভূত'],
  ['মৈত্রি', 'মৈত্রী'],
  ['অহেলায়', 'অবহেলায়'],
  ['নারায়নগন্জের', 'নারায়ণগঞ্জের'],
  ['ম্যাসেন্জারে', 'মেসেঞ্জারে'],
  ['ফার্মাসি', 'ফার্মেসি'],
  ['প্রেসক্রিপশান', 'প্রেসক্রিপশন'],
  ['সত্তরোর্ধ', 'সত্তরোর্ধ্ব'],
  ['ল্যাবরটরির', 'ল্যাবরেটরির'],
  ['বাঙ্গালী', 'বাঙালি'],
  ['বানী', 'বাণী'],
  ['নিস্কৃতি', 'নিষ্কৃতি'],
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
