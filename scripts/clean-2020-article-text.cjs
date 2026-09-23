const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'lib', 'folderArticles.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.slice(source.indexOf('export const folderArticles'));
source = source.replace('export const folderArticles: ArchiveArticle[] =', 'result =');

const context = { result: null };
vm.runInNewContext(source, context);
const articles = context.result;
const author = 'জিয়াউদ্দীন আহমেদ';
const emailPattern = /(?:ahmedzeauddin0|ahmedzeauddin|zeauddinahmed)@gmail\.com/i;
const isBio = (value) => value.includes('বাংলাদেশ ব্যাংকের সাবেক নির্বাহী')
  || value.includes('সিকিউরিটি প্রিন্টিং')
  || value.trim().startsWith('[লেখক')
  || value.trim().startsWith('লেখক');

let changed = 0;
for (const article of articles.filter((entry) => entry.publishedAt.startsWith('2020-'))) {
  const paragraphs = article.body.flatMap((block) => block.paragraphs);
  if (paragraphs.length < 1) throw new Error(`Unexpectedly empty article: ${article.slug}`);

  const intro = paragraphs[0] || '';
  const title = paragraphs[1] || '';
  const authorLine = paragraphs[2] || '';
  const hasIntro = intro.length < 250
    && /(দৈনিক|সংবাদ|উপসম্পাদকীয়|উপ সম্পাদকীয়|উপ-সম্পাদকীয়|প্রকাশিত)/.test(intro);
  if (hasIntro) {
    const normalizeTitle = (value) => value.replace(/[‘’“”"':]/g, '').replace(/\s+/g, '').trim();
    if (normalizeTitle(title) !== normalizeTitle(article.title)) {
      throw new Error(`Title mismatch in ${article.slug}: ${title}`);
    }
    if (authorLine !== author) throw new Error(`Author line mismatch in ${article.slug}: ${authorLine}`);
  }

  let cleaned = hasIntro ? paragraphs.slice(3) : paragraphs;
  while (cleaned.length) {
    const last = cleaned[cleaned.length - 1];
    if (!emailPattern.test(last) && !isBio(last)) break;
    cleaned.pop();
  }
  article.body = [{ paragraphs: cleaned }];
  changed += 1;
}

const output = `import type { ArchiveArticle } from './articles';\n\nexport const folderArticles: ArchiveArticle[] = ${JSON.stringify(articles, null, 2)};\n`;
fs.writeFileSync(sourcePath, output, 'utf8');
console.log(`Cleaned ${changed} 2020 articles.`);
