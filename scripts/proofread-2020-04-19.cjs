const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-04-19-basntir-prtyabrtner-pddhbni');
if (!article) throw new Error('19 April 2020 article not found');

const replacements = new Map([
  ['এক একাউন্ট', 'এক অ্যাকাউন্ট'],
  ['আরেক একাউন্টে', 'আরেক অ্যাকাউন্টে'],
  ['মাধ্যেমে', 'মাধ্যমে'],
  ['কোন পোস্ট', 'কোনো পোস্ট'],
  ['দারিদ্রের', 'দারিদ্র্যের'],
  ['দারিদ্র', 'দারিদ্র্য'],
  ['লবন', 'লবণ'],
  ['বিপর্যস্থ', 'বিপর্যস্ত'],
  ['গরীব', 'গরিব'],
  ['কর্মসূচী', 'কর্মসূচি'],
  ['প্রবীন', 'প্রবীণ'],
  ['নি:স্বদের', 'নিঃস্বদের'],
  ['খাদ্যশষ্য', 'খাদ্যশস্য'],
  ['জরুরী', 'জরুরি'],
  ['দাবী', 'দাবি'],
  ['শ্লোগান', 'স্লোগান'],
  ['মেম্বর', 'মেম্বার'],
  ['চেয়ারম্যনেরাও', 'চেয়ারম্যানেরাও'],
  ['পরবর্তিতে', 'পরবর্তীতে'],
  ['দন্ড', 'দণ্ড'],
  ['অপরাধি', 'অপরাধী'],
  ['সনাক্ত', 'শনাক্ত'],
  ['ভেঙ্গে', 'ভেঙে'],
  ['সামর্থ', 'সামর্থ্য'],
  ['মুহুর্তে', 'মুহূর্তে'],
  ['হত দরিদ্র', 'হতদরিদ্র'],
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
