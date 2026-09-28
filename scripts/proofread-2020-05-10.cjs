const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-05-10-gnsbasther-kit');
if (!article) throw new Error('10 May 2020 article not found');

const replacements = new Map([
  ['সনাক্তকরণে', 'শনাক্তকরণে'],
  ['গণস্বাস্থ কেন্দ্রের', 'গণস্বাস্থ্য কেন্দ্রের'],
  ['গণস্বাস্থের', 'গণস্বাস্থ্যের'],
  ['বাংলাদেশী', 'বাংলাদেশি'],
  ['আকাঙ্খা', 'আকাঙ্ক্ষা'],
  ['আমদানীকৃত', 'আমদানিকৃত'],
  ['আমদানীর', 'আমদানির'],
  ['এতবেশী', 'এত বেশি'],
  ['ঝাপিয়ে', 'ঝাঁপিয়ে'],
  ['পডেছে', 'পড়েছে'],
  ['সন্চালক', 'সঞ্চালক'],
  ['তখনি', 'তখনই'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['বিপদজনক', 'বিপজ্জনক'],
  ['স্বাস্থ সংস্থার', 'স্বাস্থ্য সংস্থার'],
  ['সক্রমন', 'সংক্রমণ'],
  ['ল্যাবরটরি', 'ল্যাবরেটরি'],
  ['বান্ছনীয়', 'বাঞ্ছনীয়'],
  ['তেলেসামাতি', 'তেলেসমাতি'],
  ['সামর্থ', 'সামর্থ্য'],
  ['গনস্বাস্থ্যের', 'গণস্বাস্থ্যের'],
]);

let changed = 0;
article.body = article.body.map((section) => ({
  ...section,
  paragraphs: section.paragraphs.map((paragraph) => {
    let next = paragraph;
    for (const [wrong, right] of replacements) next = next.split(wrong).join(right);
    next = next.replace(/(^|[^\u0980-\u09FF])য(?=$|[^\u0980-\u09FF])/g, '$1যে');
    if (next !== paragraph) changed += 1;
    return next;
  }),
}));

const output = `import type { ArchiveArticle } from './articles';\n\nexport const folderArticles: ArchiveArticle[] = ${JSON.stringify(context.result, null, 2)};\n`;
fs.writeFileSync(sourcePath, output, 'utf8');
console.log(`Corrected spelling in ${changed} paragraphs.`);
