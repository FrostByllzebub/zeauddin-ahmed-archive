const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-01-26-bu-pitanor-adhikar');
if (!article) throw new Error('26 January 2020 article not found');

const replacements = new Map([
  ['যে কোনমুহুর্তে', 'যেকোনো মুহূর্তে'],
  ['গাড়ী', 'গাড়ি'],
  ['পন্চম', 'পঞ্চম'],
  ['দৌঁড়ে', 'দৌড়ে'],
  ['ভীড়', 'ভিড়'],
  ['বাড়ীতে', 'বাড়িতে'],
  ['বেশী', 'বেশি'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['সমাজতত্ত্বিক', 'সমাজতাত্ত্বিক'],
  ['আরবী', 'আরবি'],
  ['সুষ্পষ্ট', 'সুস্পষ্ট'],
  ['হাদি-২১২৭', 'হাদিস-২১২৭'],
  ['প্রধানধর্মগ্রন্থ', 'প্রধান ধর্মগ্রন্থ'],
  ['সুক্ষ্ম', 'সূক্ষ্ম'],
  ['প্রতিবাধে', 'প্রতিবাদে'],
  ['পারষ্পরিক', 'পারস্পরিক'],
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
