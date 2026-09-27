const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-01-05-deshe-deshe-nipidit-sngkhyalghu');
if (!article) throw new Error('5 January 2020 article not found');

const replacements = new Map([
  ['যে কোন', 'যেকোনো'],
  ['ভেঙ্গে', 'ভেঙে'],
  ['উদ্বাস্ত', 'উদ্বাস্তু'],
  ['খোঁজা', 'খোঁজা'],
  ['অক্ষুণ্ন', 'অক্ষুণ্ণ'],
  ['মূঘল', 'মুঘল'],
  ['উদ্যোমে', 'উদ্যমে'],
  ['হাজেরা শিয়া', 'হাজারা শিয়া'],
  ['সর্বোচ্চ', 'সর্বোচ্চ'],
  ['লক্ষ্মণ', 'লক্ষণ'],
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
