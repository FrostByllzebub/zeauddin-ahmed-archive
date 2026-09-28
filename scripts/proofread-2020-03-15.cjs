const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-03-15-kronay-bishbayn-bipryst');
if (!article) throw new Error('15 March 2020 article not found');

const replacements = new Map([
  ['আবিস্কার', 'আবিষ্কার'],
  ['স্বৈরচারের', 'স্বৈরাচারের'],
  ['করেদিয়েছে', 'করে দিয়েছে'],
  ['রেঁস্তোরা', 'রেস্তোরাঁ'],
  ['ধুমপড়ার', 'ধুম পড়ার'],
  ['কোন মনোবিজ্ঞানীও', 'কোনো মনোবিজ্ঞানীও'],
  ['অন্য কোন দেশে', 'অন্য কোনো দেশে'],
  ['যাবত', 'যাবৎ'],
  ['রেমিটেন্স', 'রেমিট্যান্স'],
  ['পর্যালাচনা', 'পর্যালোচনা'],
  ['একসাচ্চা', 'এক সাচ্চা'],
  ['আপগ্রেডেট', 'আপগ্রেডেড'],
  ['কোন ঈমানদার মুসলমান', 'কোনো ঈমানদার মুসলমান'],
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
