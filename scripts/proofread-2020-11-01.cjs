const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-11-01-ghrina-ghrinar-jnm-dey');
if (!article) throw new Error('1 November 2020 article not found');

const replacements = new Map([
  ['আহবান', 'আহ্বান'],
  ['বেশী', 'বেশি'],
  ['আক্রমন', 'আক্রমণ'],
  ['সত্ত্বার', 'সত্তার'],
  ['ফ্রন্সের', 'ফ্রান্সের'],
  ['বিধিনিষিধের', 'বিধিনিষেধের'],
  ['তল্লাসি', 'তল্লাশি'],
  ['বাংলাদেশী', 'বাংলাদেশি'],
  ['ব্যাঙ্গচিত্র', 'ব্যঙ্গচিত্র'],
  ['ইহুদী', 'ইহুদি'],
  ['ব্যাঙ্গাত্মক', 'ব্যঙ্গাত্মক'],
  ['আক্রমনে', 'আক্রমণে'],
  ['অ্যামেরিকা', 'আমেরিকা'],
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
