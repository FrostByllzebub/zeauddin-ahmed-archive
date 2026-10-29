import { mkdir, writeFile } from "node:fs/promises";
import { retiredSitePaths } from "../lib/site-redirects";
import { sitePages } from "../lib/site-pages";
import { articles } from "../lib/articles";
import { legacyArticleSlugs } from "../lib/articleRedirects";

const origin = process.env.SITE_ORIGIN ?? "https://zeauddinahmed.com";
const timeoutMs = 12000;
const internalPaths = sitePages.map(page => page.path);
const articlePaths = articles.map((article) => `/articles/${article.slug}`);
const legacyPaths = [...retiredSitePaths, ...Object.keys(legacyArticleSlugs).map((slug) => `/articles/${slug}`)];
const sourceUrls = [...new Set(articles.map((article) => article.originalUrl).filter(Boolean))];

async function checkUrl(url: string, expected: "internal" | "source") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "manual", signal: controller.signal, headers: { "user-agent": "ZeauddinArchiveLinkChecker/1.0" } });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: "GET", redirect: "manual", signal: controller.signal, headers: { "user-agent": "ZeauddinArchiveLinkChecker/1.0" } });
    }
    const ok = expected === "internal" ? response.status >= 200 && response.status < 400 : response.status >= 200 && response.status < 400;
    return { url, status: response.status, ok, category: expected };
  } catch (error) {
    return { url, status: 0, ok: false, category: expected, error: error instanceof Error ? error.name : "unknown" };
  } finally {
    clearTimeout(timer);
  }
}

async function checkInBatches(urls: string[], category: "internal" | "source") {
  const results: Array<Awaited<ReturnType<typeof checkUrl>>> = [];
  for (let index = 0; index < urls.length; index += 16) {
    results.push(...await Promise.all(urls.slice(index, index + 16).map((path) => checkUrl(path.startsWith("http") ? path : `${origin}${path}`, category))));
  }
  return results;
}

const internal = await checkInBatches([...internalPaths, ...articlePaths], "internal");
const legacy = await checkInBatches(legacyPaths, "internal");
const source = await checkInBatches(sourceUrls, "source");
const report = {
  checkedAt: new Date().toISOString(),
  origin,
  summary: {
    internal: { total: internal.length, broken: internal.filter((item) => !item.ok).length },
    legacy: { total: legacy.length, redirectFailures: legacy.filter((item) => !(item.status >= 300 && item.status < 400)).length },
    source: { total: source.length, broken: source.filter((item) => !item.ok).length },
  },
  internal,
  legacy,
  source,
};
await mkdir("reports", { recursive: true });
await writeFile("reports/link-check-latest.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.summary, null, 2));
if (report.summary.internal.broken || report.summary.legacy.redirectFailures) process.exitCode = 1;
