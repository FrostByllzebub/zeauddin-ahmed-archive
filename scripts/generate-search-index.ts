import { mkdir, writeFile } from "node:fs/promises";
import { articles } from "../lib/articles";
import { normalizeSearchText } from "../lib/search-normalization";

const metadata = articles.map(({ slug, title, publication, publishedAt, publishedDateLabel }) => ({
  slug,
  title,
  publication,
  publishedAt,
  publishedDateLabel,
}));

const searchIndex = articles.map((article) => {
  const searchText = normalizeSearchText([
    article.title,
    article.author,
    article.publication,
    article.body.flatMap((section) => [section.heading ?? "", ...section.paragraphs]).join(" "),
  ].join(" "));
  // Keep one copy of each normalized term. Search remains accent/variant
  // tolerant while avoiding a second copy of every full article body in the
  // downloaded index.
  return { slug: article.slug, searchText: [...new Set(searchText.split(" "))].join(" ") };
});

await mkdir("lib", { recursive: true });
await mkdir("public", { recursive: true });
await writeFile("lib/archiveMetadata.ts", `export const archiveMetadata = ${JSON.stringify(metadata, null, 2)} as const;\n`, "utf8");
await writeFile("public/search-index.json", JSON.stringify(searchIndex), "utf8");
console.log(`Generated archive metadata and search index for ${articles.length} articles.`);
