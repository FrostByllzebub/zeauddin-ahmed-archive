const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-02-23-bhaskr-rashar-mujibbrsh');
if (!article) throw new Error('23 February 2020 article not found');

const replacements = new Map([
  ['ভাস্কার্য', 'ভাস্কর্য'],
  ['হাঁতুড়ি', 'হাতুড়ি'],
  ['বাঁটালের', 'বাটালির'],
  ['সূক্ষ্মতিসূক্ষ্ম', 'সূক্ষ্মাতিসূক্ষ্ম'],
  ['লেখাপড় করেছেন', 'লেখাপড়া করেছেন'],
  ['সন্মানজনকভাবে', 'সম্মানজনকভাবে'],
  ['ভাঙ্গার', 'ভাঙার'],
  ['ওয়ালামা', 'ওলামা'],
  ['আন্জুমান', 'আঞ্জুমান'],
  ['কুডাল', 'কোদাল'],
  ['অপারেজেয়', 'অপরাজেয়'],
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
