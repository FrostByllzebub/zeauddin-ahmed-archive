const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-03-22-mujibbrsh');
if (!article) throw new Error('22 March 2020 article not found');

const replacements = new Map([
  ['কোন স্বচ্ছ ধারণা', 'কোনো স্বচ্ছ ধারণা'],
  ['মুক্তযুদ্ধকালীন', 'মুক্তিযুদ্ধকালীন'],
  ['ধোঁকা', 'ধোঁকা'],
  ['তেয়াত্তর', 'তিয়াত্তর'],
  ['যে কোন দুর্যোগে', 'যেকোনো দুর্যোগে'],
  ['অসম্প্রদায়িক', 'অসাম্প্রদায়িক'],
  ['অন্য কোন দেশের', 'অন্য কোনো দেশের'],
  ['প্রতি দিন', 'প্রতিদিন'],
  ['দুর্বোধ্য', 'দুর্বোধ্য'],
  ['নির্লোভ', 'নির্লোভ'],
  ['নিরহঙ্কারী', 'নিরহংকারী'],
  ['ক্ষুণœ', 'ক্ষুণ্ণ'],
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
