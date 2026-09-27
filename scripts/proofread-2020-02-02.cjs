const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-02-02-kronabhairaser-chhobl');
if (!article) throw new Error('2 February 2020 article not found');

const replacements = new Map([
  ['সক্রামিত', 'সংক্রমিত'],
  ['কোন ওষুধ', 'কোনো ওষুধ'],
  ['জীবানু', 'জীবাণু'],
  ['ল্যাবরটরি', 'ল্যাবরেটরি'],
  ['খাদ্যাভাস', 'খাদ্যাভ্যাস'],
  ['কিছুক্ষণের', 'কিছুক্ষণের'],
  ['ভ্রুণ', 'ভ্রূণ'],
  ['কোলকাতায়', 'কলকাতায়'],
  ['মানব দেহে', 'মানবদেহে'],
  ['লক্ষ্মণ', 'লক্ষণ'],
  ['সনাক্ত', 'শনাক্ত'],
  ['জীবানুযুক্ত', 'জীবাণুযুক্ত'],
  ['অভ্যেস', 'অভ্যাস'],
  ['বিপদজনক', 'বিপজ্জনক'],
  ['কোন মানুষের', 'কোনো মানুষের'],
  ['পুরাপুরি', 'পুরোপুরি'],
  ['সপ্তাহ যাবত', 'সপ্তাহ যাবৎ'],
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
