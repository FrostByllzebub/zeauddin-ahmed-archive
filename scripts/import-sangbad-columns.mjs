import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ids = [448, 1574, 2635, 3164, 3773, 4472, 5271, 5986, 7105, 7916, 8627, 9440, 10154, 10895, 11418, 11975, 12677, 13399, 14301, 14979, 15800, 16588, 17258, 18013];
const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&lsquo;|&rsquo;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function matchOne(html, expression, fallback = "") {
  return html.match(expression)?.[1] ?? fallback;
}

function toBengaliDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  return `${[day, months[Number(month) - 1], year].join(" ")}`.replace(/\d/g, (digit) => bengaliDigits[Number(digit)]);
}

function slugFor(id) {
  return `sangbad-${id}`;
}

async function downloadImage(url, id) {
  const response = await fetch(url, { headers: { "user-agent": "Zeauddin-Ahmed-Archive/1.0" } });
  if (!response.ok) throw new Error(`image ${response.status}: ${url}`);
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const fileName = `sangbad-${id}.${extension}`;
  await fs.writeFile(path.join(root, "public", "articles", fileName), Buffer.from(await response.arrayBuffer()));
  return `/articles/${fileName}`;
}

async function extractArticle(id) {
  const originalUrl = `https://sangbad.net/news/${id}/`;
  const response = await fetch(originalUrl, { headers: { "user-agent": "Zeauddin-Ahmed-Archive/1.0" } });
  if (!response.ok) throw new Error(`article ${response.status}: ${originalUrl}`);
  const html = await response.text();
  const title = decodeHtml(matchOne(html, /<meta property="og:title"[^>]+content="([^"]+)"/i)).replace(/\s*\|\s*সংবাদ\s*$/, "");
  const publishedAt = matchOne(html, /"datePublished"\s*:\s*"([^"]+)"/i).slice(0, 10);
  const imageUrl = matchOne(html, /"image"\s*:\s*"([^"]+)"/i);
  const start = html.indexOf('<div class="story-details');
  const end = html.indexOf('<div class="d-none tt-white fb-comment', start);
  if (start < 0 || end < 0) throw new Error(`article body not found: ${originalUrl}`);
  const bodyHtml = html.slice(start, end);
  const paragraphs = [...bodyHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => decodeHtml(match[1]))
    .filter((paragraph) => paragraph && !paragraph.startsWith("(লেখকের নিজস্ব মত)") && !paragraph.startsWith("[লেখক:"));

  let heroImage = await downloadImage(imageUrl, id);
  let heroCaption = "সংবাদে প্রকাশিত ছবি";
  let imageSourceUrl = originalUrl;
  let imageCredit = "সংবাদ · মূল প্রকাশনা";
  if (id === 18013) {
    heroImage = "/articles/brics-summit-2025.jpg";
    heroCaption = "ব্রিকস সম্মেলনে শান্তি, নিরাপত্তা ও বৈশ্বিক শাসনব্যবস্থা নিয়ে আলোচনা";
    imageSourceUrl = "https://commons.wikimedia.org/wiki/File:2025_BRICS_Summit.jpg";
    imageCredit = "Prime Minister’s Office, Government of India · GODL-India";
  }

  return {
    slug: slugFor(id),
    title,
    author: "জিয়াউদ্দীন আহমেদ",
    publication: "সংবাদ",
    section: "মতামত",
    publishedAt,
    publishedDateLabel: toBengaliDate(publishedAt),
    originalUrl,
    rightsStatus: "full_text_permitted",
    heroImage,
    heroCaption,
    imageSourceUrl,
    imageCredit,
    body: [{ paragraphs }],
    authorNote: "",
    authorCredit: "",
  };
}

const entries = [];
for (const id of ids) {
  entries.push(await extractArticle(id));
  console.log(`imported ${id}`);
}

const source = `export type ArchiveArticle = {
  slug: string;
  title: string;
  author: string;
  publication: string;
  section: string;
  publishedAt: string;
  publishedDateLabel: string;
  originalUrl: string;
  rightsStatus: "full_text_permitted" | "metadata_only";
  heroImage: string;
  heroCaption: string;
  imageSourceUrl: string;
  imageCredit: string;
  body: Array<{ heading?: string; paragraphs: string[] }>;
  authorNote: string;
  authorCredit: string;
};

export const articles: ArchiveArticle[] = ${JSON.stringify(entries, null, 2)};

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
`;
await fs.writeFile(path.join(root, "lib", "articles.ts"), source, "utf8");
