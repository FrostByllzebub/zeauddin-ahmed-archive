const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-01-19-jj-miya-mane-sajano-natk');
if (!article) throw new Error('19 January 2020 article not found');

const replacements = new Map([
  ['হত্যাকা-', 'হত্যাকাণ্ড'],
  ['যে কোন', 'যেকোনো'],
  ['তত বার', 'ততবার'],
  ['মিরজাফরের', 'মীরজাফরের'],
  ['ধ্বংস স্তূপের', 'ধ্বংসস্তূপের'],
  ['সুযোগমত', 'সুযোগমতো'],
  ['কর্মকা-', 'কর্মকাণ্ড'],
  ['কিন্ত', 'কিন্তু'],
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
