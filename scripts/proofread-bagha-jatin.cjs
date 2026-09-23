const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-12-27-bagha-ytiner-bhaskry');
if (!article) throw new Error('Bagha Jatin article not found');

const replacements = new Map([
  ['বাঙ্গালী', 'বাঙালি'],
  ['মাদারিপুরের', 'মাদারীপুরের'],
  ['পৈত্রিক', 'পৈতৃক'],
  ['বাজী', 'বাজি'],
  ['বিনোদবালাকে', 'বিনোদবালাকে'],
  ['কমাণ্ডেই', 'কমান্ডেই'],
  ['আক্রমন', 'আক্রমণ'],
  ['আক্রমনে', 'আক্রমণে'],
  ['দেশী', 'দেশি'],
  ['হাল্কা', 'হালকা'],
  ['ইংল্যাণ্ডের', 'ইংল্যান্ডের'],
  ['তল্লাশীর', 'তল্লাশির'],
  ['বেশী', 'বেশি'],
  ['অভ্যুথানের', 'অভ্যুত্থানের'],
  ['বৃটিশ', 'ব্রিটিশ'],
  ['গেইটে', 'গেটে'],
  ['ভাংচুর', 'ভাঙচুর'],
  ['গাড়ীটি', 'গাড়িটি'],
  ['হয়রাণী', 'হয়রানি'],
  ['সিসি ক্যামরার', 'সিসি ক্যামেরার'],
  ['নজরদারী', 'নজরদারি'],
  ['স্কোয়্যারে', 'স্কোয়ারে'],
  ['প্রত্যাখান', 'প্রত্যাখ্যান'],
  ['যতীতের', 'যতীনের'],
  ['বাহাদুরী', 'বাহাদুরি'],
  ['বাঙ্গালীর', 'বাঙালির'],
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
