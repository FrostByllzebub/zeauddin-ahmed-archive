import { writeFile } from "node:fs/promises";
import { articles } from "../lib/articles";

const base = "https://zeauddinahmed.com";
const staticPaths = ["/", "/archive", "/memories", "/publications", "/about", "/policies"];
const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const urls = [...staticPaths.map((path) => ({ path })), ...articles.map((article) => ({ path: `/articles/${article.slug}`, lastmod: article.publishedAt }))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ path, lastmod }) => `  <url><loc>${escapeXml(`${base}${path}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;
await writeFile("public/sitemap.xml", sitemap, "utf8");
await writeFile("public/robots.txt", `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`, "utf8");
console.log(`Generated sitemap.xml (${urls.length} URLs) and robots.txt.`);
