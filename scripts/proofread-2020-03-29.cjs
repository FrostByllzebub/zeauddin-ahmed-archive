const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-03-29-kronabhairaser-kbirajgn');
if (!article) throw new Error('29 March 2020 article not found');

const replacements = new Map([
  ['আবিস্কার', 'আবিষ্কার'],
  ['আবিস্কৃত', 'আবিষ্কৃত'],
  ['জরুরী', 'জরুরি'],
  ['অনুয়ায়ী', 'অনুযায়ী'],
  ['ধর্ণা', 'ধর্না'],
  ['পরিস্কার', 'পরিষ্কার'],
  ['পোষাক', 'পোশাক'],
  ['আক্রমন', 'আক্রমণ'],
  ['মাহাত্ম', 'মাহাত্ম্য'],
  ['ছোঁয়াছে', 'ছোঁয়াচে'],
  ['দাবীর', 'দাবির'],
  ['বানী', 'বাণী'],
  ['মোমিনদের', 'মুমিনদের'],
  ['দুষণ', 'দূষণ'],
  ['মজজিদে', 'মসজিদে'],
  ['ঈমাম', 'ইমাম'],
  ['হয়েছ', 'হয়েছে'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['বেশী', 'বেশি'],
  ['সরন্জমাদি', 'সরঞ্জামাদি'],
  ['গণস্বাস্থ কেন্দ্র', 'গণস্বাস্থ্য কেন্দ্র'],
  ['সনাক্তকরণের', 'শনাক্তকরণের'],
  ['জারী', 'জারি'],
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
