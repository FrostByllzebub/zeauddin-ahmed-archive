const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-11-22-armeniya-ajarbaijaner-yuddh');
if (!article) throw new Error('22 November 2020 article not found');

const replacements = new Map([
  ['ভেঙ্গে', 'ভেঙে'],
  ['আর্মেনিয়ের', 'আর্মেনিয়ার'],
  ['দাবী', 'দাবি'],
  ['আর্মানিয়', 'আর্মেনীয়'],
  ['বিবাধের', 'বিবাদের'],
  ['স্বায়ত্বশাসন', 'স্বায়ত্তশাসন'],
  ['ভুখণ্ডটির', 'ভূখণ্ডটির'],
  ['বিচ্ছিন্নবাদীদের', 'বিচ্ছিন্নতাবাদীদের'],
  ['প্রজাতন্তের', 'প্রজাতন্ত্রের'],
  ['আক্রমন', 'আক্রমণ'],
  ['বেশী', 'বেশি'],
  ['আহবান', 'আহ্বান'],
  ['ভাংচুর', 'ভাঙচুর'],
  ['তুর্কদের', 'তুর্কিদের'],
  ['ঝর্ণা', 'ঝরনা'],
  ['মোঘল', 'মুঘল'],
  ['নিমে', 'নামে'],
  ['বহি:প্রকাশ', 'বহিঃপ্রকাশ'],
  ['অহঙ্কার', 'অহংকার'],
]);

let changed = 0;
article.body = article.body.map((section) => ({
  ...section,
  paragraphs: section.paragraphs.map((paragraph) => {
    let next = paragraph;
    for (const [wrong, right] of replacements) next = next.split(wrong).join(right);
    next = next.replace(/(^|[^\u0980-\u09FF])মধ্য(?=$|[^\u0980-\u09FF])/g, '$1মধ্যে');
    if (next !== paragraph) changed += 1;
    return next;
  }),
}));

const output = `import type { ArchiveArticle } from './articles';\n\nexport const folderArticles: ArchiveArticle[] = ${JSON.stringify(context.result, null, 2)};\n`;
fs.writeFileSync(sourcePath, output, 'utf8');
console.log(`Corrected spelling in ${changed} paragraphs.`);
