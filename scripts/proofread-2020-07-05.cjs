const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-07-05-mnda-arthnitir-kble-byangk');
if (!article) throw new Error('5 July 2020 article not found');

const replacements = new Map([
  ['রাষ্ট্রায়ত্ত্ব', 'রাষ্ট্রায়ত্ত'],
  ['সামর্থও', 'সামর্থ্যও'],
  ['সামর্থ', 'সামর্থ্য'],
  ['পুননিশ্চয়তার', 'পুনর্নিশ্চয়তার'],
  ['রুপালী', 'রূপালী'],
  ['কর্মসংস্হান', 'কর্মসংস্থান'],
  ['পোষাক', 'পোশাক'],
  ['দৌঁড়াদৌঁড়ি', 'দৌড়াদৌড়ি'],
  ['স্বাস্থ মন্ত্রণালয়ে', 'স্বাস্থ্য মন্ত্রণালয়ে'],
  ['পুরণ', 'পূরণ'],
  ['মালয়েশীয়া', 'মালয়েশিয়া'],
  ['গাড়ীর', 'গাড়ির'],
  ['গরীব', 'গরিব'],
  ['আরাম-আয়াস', 'আরাম-আয়েশ'],
  ['গর্ভনর', 'গভর্নর'],
  ['বেশী', 'বেশি'],
  ['পরিত্যজ্য', 'পরিত্যাজ্য'],
  ['জরুরী', 'জরুরি'],
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
