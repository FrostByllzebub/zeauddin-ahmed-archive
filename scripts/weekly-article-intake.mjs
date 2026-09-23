#!/usr/bin/env node

/**
 * Read-only weekly intake gate for the Zeauddin Ahmed archive.
 *
 * Commands:
 *   node scripts/weekly-article-intake.mjs template <file.json>
 *   node scripts/weekly-article-intake.mjs check <file.json>
 *   node scripts/weekly-article-intake.mjs catalog
 *
 * The check command never edits article data. It validates the staged record,
 * compares it with the existing TypeScript catalog, and reports whether a
 * source-faithful PDF is supported by the available evidence.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = {
  workId: "2026-09-22-example-source",
  title: "প্রকাশিত শিরোনাম",
  author: "জিয়াউদ্দীন আহমেদ",
  publication: "সংবাদ",
  section: "মতামত",
  publishedAt: "2026-09-22",
  publishedDateLabel: "২২ সেপ্টেম্বর ২০২৬",
  originalUrl: "",
  sourceType: "newspaper",
  sourceReference: "C:\\path\\to\\source-or-post",
  sourceTextPath: "C:\\path\\to\\complete-source-text.txt",
  verificationStatus: "needs_review",
  dateConfidence: "exact",
  rightsStatus: "full_text_permitted",
  evidenceNotes: "Record what was checked and why the full text may be archived.",
  heroImage: "/articles/example-editorial-illustration.png",
  heroCaption: "আর্কাইভের জন্য তৈরি বিষয়ভিত্তিক সম্পাদকীয় ইলাস্ট্রেশন",
  imageCredit: "Archive-created editorial illustration",
  imageSourceUrl: "",
  body: ["প্রথম পূর্ণ অনুচ্ছেদ...", "পরের পূর্ণ অনুচ্ছেদ..."],
};

function usage() {
  console.log(`Usage:
  node scripts/weekly-article-intake.mjs template <file.json>
  node scripts/weekly-article-intake.mjs check <file.json>
  node scripts/weekly-article-intake.mjs catalog`);
}

function readScalar(block, name) {
  const match = block.match(new RegExp(`"${name}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  return match ? match[1].replaceAll('\\\\"', '"').replaceAll('\\\\n', "\\n") : "";
}

function readCatalogFile(file) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const pattern = /^  \{\r?\n    "slug":\s*"([^"]+)"([\s\S]*?)(?=^  \},\r?\n  \{|^  \}\r?\n\];)/gm;
  return [...source.matchAll(pattern)].map((match) => {
    const block = match[0];
    return {
      slug: match[1],
      title: readScalar(block, "title"),
      publishedAt: readScalar(block, "publishedAt"),
      originalUrl: readScalar(block, "originalUrl"),
      publication: readScalar(block, "publication"),
    };
  });
}

function catalog() {
  return [
    ...readCatalogFile("lib/articles.ts"),
    ...readCatalogFile("lib/folderArticles.ts"),
    ...readCatalogFile("lib/additionalArticles.ts"),
  ].filter((record, index, all) => all.findIndex((item) => item.slug === record.slug) === index);
}

function normalizeTitle(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("bn")
    .replace(/[\p{P}\p{S}\s]+/gu, "")
    .trim();
}

function normalizeUrl(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "/");
    return url.toString().toLowerCase();
  } catch {
    return text.toLowerCase().replace(/\/+$/, "");
  }
}

function asRecords(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.articles)) return value.articles;
  return [value];
}

function validate(record, existing) {
  const errors = [];
  const warnings = [];
  const required = ["workId", "title", "publication", "publishedAt", "publishedDateLabel", "sourceType", "rightsStatus", "verificationStatus"];
  for (const field of required) if (!String(record?.[field] ?? "").trim()) errors.push(`missing ${field}`);
  if (record?.publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(record.publishedAt)) errors.push("publishedAt must use YYYY-MM-DD");
  if (record?.rightsStatus === "full_text_permitted" && !String(record?.evidenceNotes ?? "").trim()) errors.push("full_text_permitted requires evidenceNotes");
  if (!["full_text_permitted", "excerpt_only", "metadata_only", "hold"].includes(record?.rightsStatus)) errors.push("rightsStatus is not recognized");
  if (record?.verificationStatus !== "verified") warnings.push("verificationStatus is not verified; do not publish yet");
  if (!Array.isArray(record?.body) || record.body.filter((item) => String(item).trim()).length === 0) errors.push("body must contain the complete article text");
  if (!String(record?.heroImage ?? "").trim() || !String(record?.heroCaption ?? "").trim() || !String(record?.imageCredit ?? "").trim()) errors.push("heroImage, heroCaption, and imageCredit are required");
  if (record?.imageSourceUrl && !/^https?:\/\//i.test(record.imageSourceUrl)) errors.push("imageSourceUrl must be an http(s) URL when supplied");
  if (record?.originalUrl && !/^https?:\/\//i.test(record.originalUrl)) errors.push("originalUrl must be an http(s) URL when supplied");

  const title = normalizeTitle(record?.title);
  const url = normalizeUrl(record?.originalUrl);
  const duplicates = existing.filter((item) =>
    (title && normalizeTitle(item.title) === title) ||
    (record?.publishedAt && item.publishedAt === record.publishedAt && title && normalizeTitle(item.title) === title) ||
    (url && normalizeUrl(item.originalUrl) === url),
  );
  if (duplicates.length) errors.push(`duplicate candidate(s): ${duplicates.map((item) => item.slug).join(", ")}`);

  const pdfMissing = [];
  if (!String(record?.originalUrl ?? "").trim()) pdfMissing.push("originalUrl");
  if (!String(record?.sourceReference ?? "").trim()) pdfMissing.push("sourceReference");
  if (!String(record?.sourceTextPath ?? "").trim()) pdfMissing.push("sourceTextPath");
  if (record?.rightsStatus !== "full_text_permitted") pdfMissing.push("full_text_permitted rights");
  if (!Array.isArray(record?.body) || record.body.length === 0) pdfMissing.push("complete body");
  return { errors, warnings, duplicates, pdfReady: pdfMissing.length === 0, pdfMissing };
}

function writeTemplate(file) {
  const target = path.resolve(process.cwd(), file);
  if (fs.existsSync(target)) throw new Error(`Refusing to overwrite existing file: ${target}`);
  fs.writeFileSync(target, `${JSON.stringify(template, null, 2)}\n`, "utf8");
  console.log(`Created intake template: ${target}`);
}

function check(file) {
  const source = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), file), "utf8"));
  const records = asRecords(source);
  const existing = catalog();
  let failed = false;
  for (const [index, record] of records.entries()) {
    const result = validate(record, existing);
    console.log(`\n${index + 1}. ${record.title || "(untitled)"}`);
    console.log(`   work_id: ${record.workId || "—"}`);
    console.log(`   duplicates: ${result.duplicates.length ? result.duplicates.map((item) => item.slug).join(", ") : "none found"}`);
    console.log(`   PDF: ${result.pdfReady ? "READY" : `SKIP (${result.pdfMissing.join(", ")})`}`);
    if (result.warnings.length) console.log(`   warnings: ${result.warnings.join("; ")}`);
    if (result.errors.length) {
      failed = true;
      console.log(`   errors: ${result.errors.join("; ")}`);
    }
  }
  console.log(`\nCatalog records checked: ${existing.length}`);
  console.log(failed ? "INTAKE RESULT: FAIL — resolve errors before import." : "INTAKE RESULT: PASS — continue with editorial review and the build gate.");
  if (records.some((record) => !validate(record, existing).pdfReady)) console.log("PDF RESULT: at least one record is missing source evidence; record it for later investigation instead of generating a speculative PDF.");
  process.exitCode = failed ? 1 : 0;
}

const [command, file] = process.argv.slice(2);
try {
  if (command === "template" && file) writeTemplate(file);
  else if (command === "check" && file) check(file);
  else if (command === "catalog") console.log(JSON.stringify({ records: catalog().length }, null, 2));
  else { usage(); process.exitCode = 1; }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
