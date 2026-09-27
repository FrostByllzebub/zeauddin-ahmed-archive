const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-04-06-mrite-chahi-na-ami-sundr-bhubne');
if (!article) throw new Error('6 April 2020 article not found');

const replacements = new Map([
  ['মুহুর্তে', 'মুহূর্তে'],
  ['যে কোন চ্যানেলে', 'যেকোনো চ্যানেলে'],
  ['আক্রমন', 'আক্রমণ'],
  ['আক্তান্ত', 'আক্রান্ত'],
  ['বেশী', 'বেশি'],
  ['বৃটিশ', 'ব্রিটিশ'],
  ['দাবী', 'দাবি'],
  ['হজ্ব', 'হজ'],
  ['মালয়েশীয়ায়', 'মালয়েশিয়ায়'],
  ['সন্চয়', 'সঞ্চয়'],
  ['জেহাদি', 'জিহাদি'],
  ['অখন্ড', 'অখণ্ড'],
  ['উপসনালয়ে', 'উপাসনালয়ে'],
  ['দু:খ', 'দুঃখ'],
  ['মুখামুখি', 'মুখোমুখি'],
  ['দৌঁড়ে', 'দৌড়ে'],
  ['দৌঁডে', 'দৌড়ে'],
  ['নি:শ্বাস', 'নিঃশ্বাস'],
  ['ধ্বংসস্তুপ', 'ধ্বংসস্তূপ'],
  ['সামর্থ', 'সামর্থ্য'],
  ['হতাশাব্যন্জক', 'হতাশাব্যঞ্জক'],
  ['সত্বেও', 'সত্ত্বেও'],
  ['মুন্ডপাত', 'মুণ্ডপাত'],
  ['টাঙ্গিয়ে', 'টাঙিয়ে'],
  ['বানী', 'বাণী'],
  ['মৃত্যুদন্ড', 'মৃত্যুদণ্ড'],
  ['পোষাক-পরিচ্ছদ', 'পোশাক-পরিচ্ছদ'],
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
