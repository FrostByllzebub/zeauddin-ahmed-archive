import fs from "node:fs";

const siteUrl = (process.env.SITE_URL || "https://zeauddinahmed.com").replace(/\/$/, "");
const source = fs.readFileSync("lib/folderArticles.ts", "utf8");
const records = [...source.matchAll(/slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?publishedAt:\s*"([^"]+)"/g)]
  .map((match) => ({ slug: match[1], title: match[2], publishedAt: match[3] }))
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

if (records.length === 0) throw new Error("No folder article records found for live smoke test");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastError;

for (let attempt = 1; attempt <= 12; attempt += 1) {
  try {
    for (const article of records.slice(0, 3)) {
      const response = await fetch(`${siteUrl}/articles/${article.slug}`, {
        headers: { "cache-control": "no-cache" },
      });
      if (!response.ok) throw new Error(`${article.slug}: HTTP ${response.status}`);
      const html = await response.text();
      if (!html.includes(article.title)) throw new Error(`${article.slug}: title missing from live HTML`);
    }

    const archive = await fetch(`${siteUrl}/archive`, { headers: { "cache-control": "no-cache" } });
    if (!archive.ok) throw new Error(`/archive: HTTP ${archive.status}`);
    const archiveHtml = await archive.text();
    if (!archiveHtml.includes(records[0].title)) throw new Error("Latest article missing from live archive");

    console.log(`Live smoke test passed for ${records.slice(0, 3).map((article) => article.slug).join(", ")}`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(`Live smoke attempt ${attempt}/12 failed: ${error.message}`);
    if (attempt < 12) await sleep(10000);
  }
}

throw lastError;
