const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-12-20-chor-dhoreo-chor-hoye-jachchi');
if (!article) throw new Error('20 December 2020 article not found');

const replacements = new Map([
  ['রীতিমত', 'রীতিমতো'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['আপোষহীন', 'আপসহীন'],
  ['অর্থ যোগান', 'অর্থ জোগান'],
  ['খুশী', 'খুশি'],
  ['নির্ঝাট', 'নির্ঝঞ্ঝাট'],
  ['বৃটিশ', 'ব্রিটিশ'],
  ['ধরা ছোঁয়ার', 'ধরাছোঁয়ার'],
  ['উর্ধতন', 'ঊর্ধ্বতন'],
  ['উদঘাটনের', 'উদ্ঘাটনের'],
  ['অনির্ষ্টকাল', 'অনির্দিষ্টকাল'],
  ['কারনবাজার', 'কারণবাজার'],
  ['টেন্ডারবাজী', 'টেন্ডারবাজি'],
  ['গাড়ী', 'গাড়ি'],
  ['বদলী', 'বদলি'],
  ['পাহাদার', 'পাহারাদার'],
  ['আসামী', 'আসামি'],
  ['স্বাস্থখাতের', 'স্বাস্থ্যখাতের'],
  ['স্বাস্থমন্ত্রীর', 'স্বাস্থ্যমন্ত্রীর'],
  ['হুশিয়ারি', 'হুঁশিয়ারি'],
  ['ভাঙ্গতে', 'ভাঙতে'],
  ['পর্যালাচনা', 'পর্যালোচনা'],
  ['দাগী', 'দাগি'],
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
