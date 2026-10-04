import { mkdir, writeFile } from "node:fs/promises";
import { articles } from "../lib/articles";
import { normalizeSearchText, searchTokens } from "../lib/search-normalization";

const metadata = articles.map(({ slug, title, publication, publishedAt, publishedDateLabel }) => ({
  slug,
  title,
  publication,
  publishedAt,
  publishedDateLabel,
}));

type SearchRecord = {
  slug: string;
  title: string;
  publication: string;
  publishedAt: string;
  publishedDateLabel: string;
  excerpt: string;
};

type SearchShard = {
  records: SearchRecord[];
  postings: Record<string, number[]>;
};

const shards = new Map<string, SearchShard>();

for (const article of articles) {
  const year = article.publishedAt.slice(0, 4) || "unknown";
  const shard = shards.get(year) ?? { records: [], postings: {} };
  const recordIndex = shard.records.length;
  const bodyText = article.body.flatMap((section) => [section.heading ?? "", ...section.paragraphs]).join(" ");
  const searchText = normalizeSearchText([
    article.title,
    article.author,
    article.publication,
    bodyText,
  ].join(" "));
  const record: SearchRecord = {
    slug: article.slug,
    title: article.title,
    publication: article.publication,
    publishedAt: article.publishedAt,
    publishedDateLabel: article.publishedDateLabel,
    excerpt: bodyText.replace(/\s+/g, " ").trim().slice(0, 260),
  };
  shard.records.push(record);
  for (const term of new Set(searchTokens(searchText))) {
    (shard.postings[term] ??= []).push(recordIndex);
  }
  shards.set(year, shard);
}

await mkdir("lib", { recursive: true });
await mkdir("public/search-shards", { recursive: true });
await writeFile("lib/archiveMetadata.ts", `export const archiveMetadata = ${JSON.stringify(metadata, null, 2)} as const;\n`, "utf8");
await writeFile("public/search-manifest.json", JSON.stringify({ format: 2, strategy: "exact-token-postings", years: [...shards.keys()].sort().reverse() }), "utf8");
for (const [year, shard] of shards) {
  await writeFile(`public/search-shards/${year}.json`, JSON.stringify(shard), "utf8");
}
console.log(`Generated ${shards.size} search shards for ${articles.length} articles.`);
