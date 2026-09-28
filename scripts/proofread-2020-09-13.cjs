const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-09-13-siti-krporeshner-sarmeyniti');
if (!article) throw new Error('13 September 2020 article not found');

const replacements = new Map([
  ['কর্পোরেশন', 'কর্পোরেশন'],
  ['প্রাণিতে', 'পানিতে'],
  ['প্রাণি', 'প্রাণী'],
  ['উদ্যোমে', 'উদ্যমে'],
  ['কান্ড', 'কাণ্ড'],
  ['ধারালো', 'ধারালো'],
  ['গন্ধগোকুল', 'গন্ধগোকুল'],
  ['কালো', 'কালো'],
  ['ভাল্লুক', 'ভালুক'],
  ['ঘোষণা', 'ঘোষণা'],
  ['লোকালয়ে', 'লোকালয়ে'],
  ['সুযোগ', 'সুযোগ'],
  ['বেশী', 'বেশি'],
  ['গরীব', 'গরিব'],
  ['বাড়ীর', 'বাড়ির'],
  ['সনাক্তকরণের', 'শনাক্তকরণের'],
  ['সিন্ধুক', 'সিন্দুক'],
  ['কোটি', 'কোটি'],
  ['পশু-পাখী', 'পশু-পাখি'],
  ['কখনোই', 'কখনোই'],
  ['আপনি আপনি', 'আপনা-আপনি'],
  ['দৌঁড়াদৌঁড়ি', 'দৌড়াদৌড়ি'],
  ['ফেইসবুক', 'ফেসবুক'],
  ['আক্রমন', 'আক্রমণ'],
  ['বন্ধু সুলভ', 'বন্ধুসুলভ'],
  ['লক ডাউনে', 'লকডাউনে'],
  ['হয়েছ', 'হয়েছে'],
  ['ভন্ডদের', 'ভণ্ডদের'],
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
