const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-01-12-smr-bishard-soleimani');
if (!article) throw new Error('12 January 2020 article not found');

const replacements = new Map([
  ['হযেছে', 'হয়েছে'],
  ['হত্যাকা-', 'হত্যাকাণ্ড'],
  ['খোমেনি', 'খামেনি'],
  ['যে কোন', 'যেকোনো'],
  ['ভাংচুর', 'ভাঙচুর'],
  ['সর্বোচ্চ', 'সর্বোচ্চ'],
  ['হিজবুল্লা', 'হিজবুল্লাহ'],
  ['দাবী', 'দাবি'],
  ['ব্যালেস্টিক', 'ব্যালিস্টিক'],
  ['আক্রমনে', 'আক্রমণে'],
  ['ধর্ণা', 'ধর্না'],
  ['ভূখন্ড', 'ভূখণ্ড'],
  ['পরষ্পর', 'পরস্পর'],
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
