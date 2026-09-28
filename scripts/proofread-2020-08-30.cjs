const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-08-30-manush-banche-manusher-jny');
if (!article) throw new Error('30 August 2020 article not found');

const replacements = new Map([
  ['স্বাস্থকর্মী', 'স্বাস্থ্যকর্মী'],
  ['পরিহনকর্মী', 'পরিবহনকর্মী'],
  ['মহত ব্যক্তি', 'মহৎ ব্যক্তি'],
  ['হাসাপাতাল', 'হাসপাতাল'],
  ['চাকুরী', 'চাকরি'],
  ['সবজী', 'সবজি'],
  ['ষাটোর্ধ', 'ষাটোর্ধ্ব'],
  ['নি:স্ব', 'নিঃস্ব'],
  ['বেশী', 'বেশি'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['পরষ্পরের', 'পরস্পরের'],
  ['মোকাবলায়', 'মোকাবিলায়'],
  ['অ্যামবুল্যান্স', 'অ্যাম্বুল্যান্স'],
  ['অসূচি', 'অশুচি'],
  ['আবিস্কারে', 'আবিষ্কারে'],
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
