#!/usr/bin/env node

/** Build-time integrity gate for the complete article catalog. */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = ["lib/articles.ts", "lib/folderArticles.ts"];

function readScalar(block, name) {
  const match = block.match(new RegExp(`"${name}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  return match ? match[1].replaceAll('\\\\"', '"').replaceAll('\\\\n', "\\n") : "";
}

function readFile(file) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const pattern = /^  \{\r?\n    "slug":\s*"([^"]+)"([\s\S]*?)(?=^  \},\r?\n  \{|^  \}\r?\n\];)/gm;
  return [...source.matchAll(pattern)].map((match) => {
    const block = match[0];
    return {
      file,
      slug: match[1],
      title: readScalar(block, "title"),
      publication: readScalar(block, "publication"),
      publishedAt: readScalar(block, "publishedAt"),
      originalUrl: readScalar(block, "originalUrl"),
    };
  });
}

function normalizeTitle(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase("bn").replace(/[\p{P}\p{S}\s]+/gu, "").trim();
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

function normalizePublication(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase("bn").replace(/[\p{P}\p{S}\s]+/gu, "").trim();
}

function duplicateGroups(records, key) {
  const groups = new Map();
  for (const record of records) {
    const value = key(record);
    if (!value) continue;
    const group = groups.get(value) ?? [];
    group.push(record);
    groups.set(value, group);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

const records = files.flatMap(readFile);
const checks = {
  duplicateSlugs: duplicateGroups(records, (record) => record.slug),
  duplicateTitleDates: duplicateGroups(records, (record) => `${normalizeTitle(record.title)}|${record.publishedAt}|${normalizePublication(record.publication)}`),
  duplicateSourceUrls: duplicateGroups(records, (record) => normalizeUrl(record.originalUrl)),
};
const failures = Object.entries(checks).filter(([, groups]) => groups.length);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, records: records.length, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, records: records.length, duplicates: 0 }, null, 2));
}
