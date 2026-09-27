const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-04-26-maolana-ansarir-janaja');
if (!article) throw new Error('26 April 2020 article not found');

const replacements = new Map([
  ['মরণঘাতি', 'মরণঘাতী'],
  ['সংক্রমন', 'সংক্রমণ'],
  ['জনাসমাগমে', 'জনসমাগমে'],
  ['তাওয়াব', 'তাওয়াফ'],
  ['হজ্ব', 'হজ'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['ম্যাসেজ', 'মেসেজ'],
  ['জড় করা', 'জড়ো করা'],
  ['গোয়ার্তুমি', 'গোঁয়ার্তুমি'],
  ['বেশী', 'বেশি'],
  ['আকাঙ্খা', 'আকাঙ্ক্ষা'],
  ['উদাসিনতার', 'উদাসীনতার'],
  ['আক্রমনাত্মক', 'আক্রমণাত্মক'],
  ['রাহ্মণবাড়িয়া', 'ব্রাহ্মণবাড়িয়া'],
  ['রাহ্মণবাড়িয়ায়', 'ব্রাহ্মণবাড়িয়ায়'],
  ['ডিগ্রী', 'ডিগ্রি'],
  ['পন্ডিত', 'পণ্ডিত'],
  ['বাড়ীও', 'বাড়িও'],
  ['স্বাধ্যবিধি', 'স্বাস্থ্যবিধি'],
  ['গাফলতির', 'গাফিলতির'],
  ['গতায়তে', 'যাতায়াতে'],
  ['ঝাপিয়ে', 'ঝাঁপিয়ে'],
  ['পোষাক', 'পোশাক'],
  ['বিস্কিট', 'বিস্কুট'],
  ['কারনবাজার', 'কারওয়ান বাজার'],
  ['সবজী', 'সবজি'],
  ['কর্মচারি', 'কর্মচারী'],
  ['সক্রমন', 'সংক্রমণ'],
  ['বংশোদভূত', 'বংশোদ্ভূত'],
  ['কালিপুজা', 'কালীপূজা'],
  ['ডাব্লিও', 'ডব্লিউ'],
  ['বানী', 'বাণী'],
  ['ভূখন্ড', 'ভূখণ্ড'],
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
