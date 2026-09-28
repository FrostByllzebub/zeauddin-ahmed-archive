const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '..', 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');
const context = { result: null };
vm.runInNewContext(source, context);

const article = context.result.find((entry) => entry.slug === '2020-07-26-kronar-bhyaksin');
if (!article) throw new Error('26 July 2020 article not found');

const replacements = new Map([
  ['যাবত', 'যাবৎ'],
  ['ঘন্টার', 'ঘণ্টার'],
  ['আক্রমন', 'আক্রমণ'],
  ['সেক্সস্যুয়াল', 'সেক্সুয়াল'],
  ['স্বাস্থবিধি', 'স্বাস্থ্যবিধি'],
  ['দাঁড়তে', 'দাঁড়াতে'],
  ['কোরান', 'কোরআন'],
  ['বেশী', 'বেশি'],
  ['তান্ডবে', 'তাণ্ডবে'],
  ['বানী', 'বাণী'],
  ['মাহাত্ম', 'মাহাত্ম্য'],
  ['পদার্পনের', 'পদার্পণের'],
  ['যানমালের', 'জানমালের'],
  ['অবতারনা', 'অবতারণা'],
  ['মৃত্যুদন্ডে', 'মৃত্যুদণ্ডে'],
  ['দন্ডিত', 'দণ্ডিত'],
  ['বালামুছিবত', 'বালা-মুসিবত'],
  ['অস্টাদশ', 'অষ্টাদশ'],
  ['লৌহদন্ড', 'লৌহদণ্ড'],
  ['সন্মোহনী', 'সম্মোহনী'],
  ['চেচিয়ে', 'চেঁচিয়ে'],
  ['আবিস্কৃত', 'আবিষ্কৃত'],
  ['হয়েছ', 'হয়েছে'],
  ['সূফি', 'সুফি'],
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
