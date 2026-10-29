import { retiredSitePaths } from "../lib/site-redirects";
import { createHash } from 'node:crypto';
import { articles } from '../lib/articles';
import { legacyArticleSlugs } from '../lib/articleRedirects';
import { searchTokens } from '../lib/search-normalization';
import { siteOrigin, sitePages } from '../lib/site-pages';
import type { SearchShard } from '../lib/archive-search';
import { imageDimensions } from './image-dimensions';
import { editorialCovers } from '../lib/editorialCovers';

export function publicationArtifacts() {
  const output = new Map<string, string>();
  const metadata = articles.map(({ slug, title, publication, publishedAt, publishedDateLabel }) => ({ slug, title, publication, publishedAt, publishedDateLabel }));
  output.set('lib/archiveMetadata.ts', `export const archiveMetadata = ${JSON.stringify(metadata, null, 2)} as const;\n`);
  const dimensions = Object.fromEntries([...new Set([...articles.map(article => article.heroImage), ...Object.values(editorialCovers).map(cover => cover.src)])]
    .sort().map(image => [image, imageDimensions('public' + image)]));
  output.set('lib/articleImages.ts', `export const articleImages: Record<string, { width: number; height: number }> = ${JSON.stringify(dimensions, null, 2)};\n`);
  const shards = new Map<string, SearchShard>();
  for (const article of articles) {
    const year = article.publishedAt.slice(0, 4);
    const shard = shards.get(year) ?? { records: [], postings: Object.create(null) as Record<string, number[]> };
    const index = shard.records.length;
    const body = article.body.flatMap(section => [section.heading ?? '', ...section.paragraphs]).join(' ');
    shard.records.push({ slug: article.slug, title: article.title, publication: article.publication, publishedAt: article.publishedAt,
      publishedDateLabel: article.publishedDateLabel, excerpt: body.replace(/\s+/g, ' ').trim().slice(0, 260) });
    for (const term of new Set(searchTokens([article.title, article.author, article.publication, body].join(' ')))) {
      (shard.postings[term] ??= []).push(index);
    }
    shards.set(year, shard);
  }
  const revisions: Record<string, string> = {};
  for (const [year, shard] of shards) {
    const json = JSON.stringify(shard);
    revisions[year] = createHash('sha256').update(json).digest('hex').slice(0, 16);
    output.set(`public/search-shards/${year}.json`, json + '\n');
  }
  output.set('public/search-manifest.json', JSON.stringify({ format: 3, strategy: 'prefix-token-postings',
    years: [...shards.keys()].sort().reverse(), revisions, records: articles.length }) + '\n');
  const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  const urls: Array<{ path: string; lastmod?: string }> = [...sitePages.map(page => ({ path: page.path })),
    ...articles.map(article => ({ path: `/articles/${article.slug}`, lastmod: article.publishedAt }))];
  output.set('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ path, lastmod }) => `  <url><loc>${escape(siteOrigin + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
  output.set('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteOrigin}/sitemap.xml\n`);
  output.set('public/_redirects', [...retiredSitePaths.map(route => `${route} /archive 301`), ...Object.entries(legacyArticleSlugs).map(([legacy, canonical]) => `/articles/${legacy} /articles/${canonical} 301`)].join('\n') + '\n');
  return output;
}
