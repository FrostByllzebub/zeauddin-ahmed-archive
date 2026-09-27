const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-05-31-pshu-pakhi-htya');
if (!article) throw new Error('31 May 2020 article not found');

const replacements = new Map([
  ['ফেইসবুকে', 'ফেসবুকে'],
  ['পশু-পাখীর', 'পশু-পাখির'],
  ['বাসাবাড়ীতে', 'বাসাবাড়িতে'],
  ['বাসাবাড়ী', 'বাসাবাড়ি'],
  ['কান্দি', 'কাঁদি'],
  ['রোপন', 'রোপণ'],
  ['পশুপাখী', 'পশুপাখি'],
  ['অন্চলে', 'অঞ্চলে'],
  ['মালয়েশীয়া', 'মালয়েশিয়া'],
  ['মৃত্যুদন্ডে', 'মৃত্যুদণ্ডে'],
  ['দন্ডিত', 'দণ্ডিত'],
  ['হাড়ি', 'হাঁড়ি'],
  ['বেশী', 'বেশি'],
  ['মুরগীর', 'মুরগির'],
  ['বিপদজনক', 'বিপজ্জনক'],
  ['জড় হতে', 'জড়ো হতে'],
  ['বিষ্টা', 'বিষ্ঠা'],
  ['রীতিমত', 'রীতিমতো'],
  ['দু:খ', 'দুঃখ'],
  ['ভেঙ্গে', 'ভেঙে'],
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
