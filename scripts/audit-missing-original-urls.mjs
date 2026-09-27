import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "lib", "folderArticles.ts");
const csvPath = path.join(projectRoot, "MISSING_ORIGINAL_URL_REVIEW.csv");
const markdownPath = path.join(projectRoot, "MISSING_ORIGINAL_URL_REVIEW.md");
const source = fs.readFileSync(sourcePath, "utf8");

const records = [];
// Imported records use two formatting variants for the slug key. Start each
// block at its slug field; all audited scalar fields follow that field, so the
// next slug is a safe boundary even when the body contains nested objects.
const starts = [...source.matchAll(/(?:"slug"|slug)\s*:\s*"([^"]+)"/g)];
for (let index = 0; index < starts.length; index += 1) {
  const match = starts[index];
  const blockStart = match.index;
  const nextStart = index + 1 < starts.length ? starts[index + 1].index : source.length;
  // Use the next record's slug as the boundary. Looking for the last `{`
  // before it can land inside the current record's nested body object and
  // silently discard fields such as originalUrl that appear above body.
  const blockEnd = nextStart;
  const block = source.slice(blockStart, blockEnd);
  const field = (name) => {
    const value = block.match(new RegExp(`(?:"${name}"|${name})\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
    return value ? value[1].replaceAll('\\\\"', '"').replaceAll('\\\\n', "\\n") : "";
  };
  const originalUrl = field("originalUrl");
  const embeddedUrls = [...block.matchAll(/https?:\/\/[^\s"'\\]+/g)].map((item) => item[0]);
  records.push({
    slug: match[1],
    title: field("title"),
    publishedAt: field("publishedAt"),
    publishedDateLabel: field("publishedDateLabel"),
    publication: field("publication"),
    section: field("section"),
    rightsStatus: field("rightsStatus"),
    originalUrl,
    embeddedUrls: [...new Set(embeddedUrls)].join(" | "),
  });
}

const missing = records
  .filter((record) => !record.originalUrl.trim())
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title, "bn"));

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const headers = [
  "review_status",
  "slug",
  "title",
  "published_at",
  "published_date_label",
  "publication",
  "section",
  "rights_status",
  "original_url",
  "embedded_url_candidates",
  "review_note",
];
const csvRows = missing.map((record) => [
  "missing_original_url",
  record.slug,
  record.title,
  record.publishedAt,
  record.publishedDateLabel,
  record.publication,
  record.section,
  record.rightsStatus,
  "",
  record.embeddedUrls,
  "Original publication URL is not present in the archive record; investigate separately.",
]);
fs.writeFileSync(csvPath, "\uFEFF" + [headers, ...csvRows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n", "utf8");

const markdownRows = missing.map((record, index) => {
  const candidate = record.embeddedUrls || "—";
  return `${index + 1}. **${record.title}** — ${record.publishedDateLabel} — \`${record.slug}\` — embedded URL candidate: ${candidate}`;
});
const markdown = [
  "# Missing original publication URL review",
  "",
  `Generated from \`lib/folderArticles.ts\` on ${new Date().toISOString().slice(0, 10)}.`,
  "",
  `The archive contains ${records.length} folder-imported records. This report contains ${missing.length} records whose \`originalUrl\` field is empty. No URL was invented or inferred.`,
  "",
  "Each entry includes the stored title, date, slug, and any URL-like text already present in the record. URL-like text is only a review hint and has not been promoted to an original publication URL.",
  "",
  ...markdownRows,
  "",
].join("\n");
fs.writeFileSync(markdownPath, markdown, "utf8");

console.log(JSON.stringify({ totalFolderRecords: records.length, missingOriginalUrls: missing.length, csvPath, markdownPath }, null, 2));
