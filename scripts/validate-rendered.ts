import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { articles } from '../lib/articles';
import { siteOrigin, sitePages } from '../lib/site-pages';
import { legacyArticleSlugs } from '../lib/articleRedirects';

const directory = process.argv[process.argv.indexOf('--directory') + 1];
assert(directory && fs.existsSync(directory), 'A real built HTML directory is required');
const decode = (s: string) => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const routes = [...sitePages.map(page => ({ route: page.path, title: page.title })),
  ...articles.map(article => ({ route: `/articles/${article.slug}`, title: `${article.title} | জিয়ার কলাম` }))];
for (const { route, title } of routes) {
  const file = path.join(directory, route === '/' ? 'index.html' : route.slice(1) + '.html');
  assert(fs.existsSync(file), `Missing built route: ${route}`);
  const html = fs.readFileSync(file, 'utf8');
  const canonicalTags = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
  assert.equal(canonicalTags.length, 1, `Exactly one canonical required: ${route}`);
  const canonical = canonicalTags[0][0].match(/href="([^"]+)"/)?.[1];
  assert.equal(canonical?.replace(/\/$/, ''), (siteOrigin + route).replace(/\/$/, ''), `Wrong canonical: ${route}`);
  assert.equal(decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''), title, `Wrong title: ${route}`);
  const ogUrl = html.match(/<meta\b[^>]*property="og:url"[^>]*>/)?.[0].match(/content="([^"]+)"/)?.[1];
  assert.equal(ogUrl?.replace(/\/$/, ''), (siteOrigin + route).replace(/\/$/, ''), `Wrong share URL: ${route}`);
  for (const image of html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)) {
    if (image[1].startsWith('/')) {
      assert(fs.existsSync(path.join(directory, decode(image[1]).split('?')[0])), `Missing rendered image asset: ${route}: ${image[1]}`);
    }
  }
  if (route.startsWith('/articles/')) {
    const hero = html.match(/<figure class="article-hero">([\s\S]*?)<\/figure>/)?.[1] ?? '';
    assert(/\bwidth="\d+"/.test(hero) && /\bheight="\d+"/.test(hero), `Hero dimensions missing: ${route}`);
  }
}
if (directory === 'out') for (const [alias, canonical] of Object.entries(legacyArticleSlugs)) {
  const file = path.join(directory, 'articles', alias + '.html');
  assert(fs.existsSync(file), `Missing static legacy route: ${alias}`);
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes(`0;url=/articles/${canonical}`), `Missing static redirect: ${alias}`);
}
console.log(`Rendered HTML gate passed for all ${routes.length} canonical routes.`);
