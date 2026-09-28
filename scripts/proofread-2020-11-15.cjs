const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-11-15-markin-yuktrashtrer-nirbachn');
if (!article) throw new Error('15 November 2020 article not found');

const replacements = new Map([
  ['প্রতারনার', 'প্রতারণার'],
  ['এররমধ্যে', 'এর মধ্যে'],
  ['বেশী', 'বেশি'],
  ['সনাক্ত', 'শনাক্ত'],
  ['আমেরিকাযর', 'আমেরিকার'],
  ['পরষ্পরের', 'পরস্পরের'],
  ['বিশ্বস্থ', 'বিশ্বস্ত'],
  ['জানুয়ারীর', 'জানুয়ারির'],
  ['পেরেছিলো', 'পেয়েছিল'],
  ['রমনীদের', 'রমণীদের'],
  ['একঘুয়েমি', 'একগুঁয়েমি'],
  ['অ্যায়োয়ার্ড', 'অ্যাওয়ার্ড'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['বিরাধিতা', 'বিরোধিতা'],
  ['বাঙ্গালীরা', 'বাঙালিরা'],
  ['ধ্বংসস্তুপে', 'ধ্বংসস্তূপে'],
  ['শ্লোগান', 'স্লোগান'],
  ['ইতোমধ্য', 'ইতোমধ্যে'],
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
