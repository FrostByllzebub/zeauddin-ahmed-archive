import { mkdir, writeFile } from "node:fs/promises";
import { articles } from "../lib/articles";

const groups = <T>(items: T[], key: (item: T) => string) => {
  const map = new Map<string, T[]>();
  for (const item of items) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return [...map.entries()].filter(([, values]) => values.length > 1);
};

const bodyText = (article: (typeof articles)[number]) => article.body.flatMap((section) => section.paragraphs).join(" ").replace(/\s+/g, " ").trim();
const duplicateTitles = groups(articles, (article) => article.title);
const duplicateBodies = groups(articles, bodyText);
const incompleteDates = articles.filter((article) => !/^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt) || /তারিখ অনির্দিষ্ট|অনির্দিষ্ট/.test(article.publishedDateLabel));
const missingSources = articles.filter((article) => !article.originalUrl);
const suspiciousSlugs = articles.filter((article) => !/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(article.slug));
const publicationCounts = [...new Set(articles.map((article) => article.publication))].sort((a, b) => a.localeCompare(b, "bn-BD"));
const corrections = await (async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile("lib/articles.ts", "utf8"));
  return (source.match(/replaceAll\(/g) ?? []).length;
})();

await mkdir("reports", { recursive: true });
await writeFile("reports/editorial-data-health.md", `# Editorial data health report

Generated: ${new Date().toISOString()}

| Check | Result |
| --- | ---: |
| Catalog records | ${articles.length} |
| Duplicate titles | ${duplicateTitles.length} groups |
| Duplicate bodies | ${duplicateBodies.length} groups |
| Incomplete or explicitly undated records | ${incompleteDates.length} |
| Missing original URL | ${missingSources.length} |
| Suspicious slugs | ${suspiciousSlugs.length} |

## Publication values

${publicationCounts.map((publication) => `- ${publication}`).join("\n")}

## Editorial review queues

${duplicateTitles.length ? duplicateTitles.map(([title, values]) => `- Duplicate title (${values.length}): ${title}`).join("\n") : "- No duplicate titles found."}
${duplicateBodies.length ? duplicateBodies.map(([, values]) => `- Duplicate body: ${values.map((article) => article.slug).join(", ")}`).join("\n") : "- No duplicate bodies found."}
${incompleteDates.length ? `- Undated or partially dated: ${incompleteDates.map((article) => article.slug).join(", ")}` : "- No incomplete dates found."}
${missingSources.length ? `- Missing source URLs: ${missingSources.length} records; see catalog and MISSING_ORIGINAL_URL_REVIEW.md.` : "- No missing source URLs found."}
` , "utf8");
await writeFile("reports/spelling-audit-summary.md", `# Spelling audit summary

Generated: ${new Date().toISOString()}

The catalog applies audited correction transforms before rendering. The current source contains ${corrections} correction-transform calls, and the editorial review history is retained in CONTENT_REVIEW_LOG.md. This report is a checkpoint, not a claim that every historical spelling decision is settled; new corrections should be recorded in the review log and catalog transform.
`, "utf8");
console.log(JSON.stringify({ records: articles.length, duplicateTitles: duplicateTitles.length, duplicateBodies: duplicateBodies.length, incompleteDates: incompleteDates.length, missingSources: missingSources.length, suspiciousSlugs: suspiciousSlugs.length, publications: publicationCounts.length, correctionTransforms: corrections }, null, 2));
