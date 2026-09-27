const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-05-17-tratar-bhumikay-pulish-o-sshstrbahini');
if (!article) throw new Error('17 May 2020 article not found');

const replacements = new Map([
  ['সুবাধে', 'সুবাদে'],
  ['চাকুরী', 'চাকরি'],
  ['আধঘন্টার', 'আধঘণ্টার'],
  ['অনেকবেশী', 'অনেক বেশি'],
  ['পোষাক', 'পোশাক'],
  ['রন্জিত', 'রঞ্জিত'],
  ['ইত:পূর্বেও', 'ইতিপূর্বেও'],
  ['অগ্নিকান্ড', 'অগ্নিকাণ্ড'],
  ['পশ্চাৎপসারণ', 'পশ্চাদপসরণ'],
  ['ফেইসবুক', 'ফেসবুক'],
  ['প্রতিবন্ধি', 'প্রতিবন্ধী'],
  ['লবন', 'লবণ'],
  ['অকুতভয়ে', 'অকুতোভয়ে'],
  ['সবজী', 'সবজি'],
  ['এমন কী', 'এমনকি'],
  ['গরীব', 'গরিব'],
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
