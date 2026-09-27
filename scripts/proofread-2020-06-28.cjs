const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-06-28-allah-malik-kajemi');
if (!article) throw new Error('28 June 2020 article not found');

const replacements = new Map([
  ['চাকুরীতে', 'চাকরিতে'],
  ['উর্ধতন', 'ঊর্ধ্বতন'],
  ['রুহল', 'রুহুল'],
  ['চাকুরীচ্যুত', 'চাকরিচ্যুত'],
  ['তত্ত্ববধায়ক', 'তত্ত্বাবধায়ক'],
  ['চার্চ কমিটি', 'সার্চ কমিটি'],
  ['দৌঁড়াদৌঁড়ি', 'দৌড়াদৌড়ি'],
  ['মুহুর্ত', 'মুহূর্ত'],
  ['চেইঞ্জ', 'চেঞ্জ'],
  ['ম্যাজেনমেন্ট', 'ম্যানেজমেন্ট'],
  ['পুজিঁবাদী', 'পুঁজিবাদী'],
  ['সামন্জস্য', 'সামঞ্জস্য'],
  ['রুপান্তরযোগ্য', 'রূপান্তরযোগ্য'],
  ['আমদানীর', 'আমদানির'],
  ['ধর্ণা', 'ধর্না'],
  ['ডেভলপমেন্ট', 'ডেভেলপমেন্ট'],
  ['সুক্ষ্ম', 'সূক্ষ্ম'],
  ['শৈলি', 'শৈলী'],
  ['লিখেছিল্ন', 'লিখেছিলেন'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['জরুরী', 'জরুরি'],
  ['কেফাদুরস্ত', 'কেতাদুরস্ত'],
  ['ম্যাসেজ', 'মেসেজ'],
  ['কাজমী', 'কাজেমী'],
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
