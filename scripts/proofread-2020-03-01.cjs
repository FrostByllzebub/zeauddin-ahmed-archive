const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-03-01-asusth-rajnitir-bikar');
if (!article) throw new Error('1 March 2020 article not found');

const replacements = new Map([
  ['নি:স্ব', 'নিঃস্ব'],
  ['পক্ষপাতি', 'পক্ষপাতী'],
  ['নামীদামী', 'নামীদামি'],
  ['বেশীরভাগ', 'বেশিরভাগ'],
  ['মালয়েশীয়া', 'মালয়েশিয়া'],
  ['ঘাষণা', 'ঘোষণা'],
  ['পুজারি', 'পূজারি'],
  ['পদ মর্যাদায়', 'পদমর্যাদায়'],
  ['আত্মঘাতি', 'আত্মঘাতী'],
  ['নুরজহানের', 'নুরজাহানের'],
  ['মধ্য বয়স্কা', 'মধ্যবয়স্কা'],
  ['কেন্দ্রিয়', 'কেন্দ্রীয়'],
  ['ঘেষার', 'ঘেঁষার'],
  ['সফরসঙ্গি', 'সফরসঙ্গী'],
  ['কর্মকান্ড', 'কর্মকাণ্ড'],
  ['পিননিকের', 'পিকনিকের'],
  ['সস্পাদক', 'সম্পাদক'],
  ['আক্রমন', 'আক্রমণ'],
  ['আমদানী', 'আমদানি'],
  ['সনাক্ত', 'শনাক্ত'],
  ['প্রাপ্ত বয়স্ক', 'প্রাপ্তবয়স্ক'],
  ['ম্রিয়মান', 'ম্রিয়মাণ'],
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
