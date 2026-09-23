#!/usr/bin/env node

/**
 * Normalize archive slugs to YYYY-MM-DD-transliterated-title.
 * The generated alias map keeps previously published article URLs working.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = ["lib/articles.ts", "lib/folderArticles.ts"];
const titleSlugOverrides = { "গণতান্ত্রিক নির্বাচন": "gonotantrik-nirbachon" };
const bengaliMap = Object.fromEntries([
  ["অ", "a"], ["আ", "a"], ["ই", "i"], ["ঈ", "i"], ["উ", "u"], ["ঊ", "u"], ["ঋ", "ri"], ["এ", "e"], ["ঐ", "oi"], ["ও", "o"], ["ঔ", "ou"],
  ["ক", "k"], ["খ", "kh"], ["গ", "g"], ["ঘ", "gh"], ["ঙ", "ng"], ["চ", "ch"], ["ছ", "chh"], ["জ", "j"], ["ঝ", "jh"], ["ঞ", "n"],
  ["ট", "t"], ["ঠ", "th"], ["ড", "d"], ["ঢ", "dh"], ["ণ", "n"], ["ত", "t"], ["থ", "th"], ["দ", "d"], ["ধ", "dh"], ["ন", "n"],
  ["প", "p"], ["ফ", "f"], ["ব", "b"], ["ভ", "bh"], ["ম", "m"], ["য", "y"], ["র", "r"], ["ল", "l"], ["শ", "sh"], ["ষ", "sh"], ["স", "s"], ["হ", "h"],
  ["ড়", "r"], ["ঢ়", "rh"], ["য়", "y"], ["া", "a"], ["ি", "i"], ["ী", "i"], ["ু", "u"], ["ূ", "u"], ["ৃ", "ri"], ["ে", "e"], ["ৈ", "oi"], ["ো", "o"], ["ৌ", "ou"],
  ["ং", "ng"], ["ঃ", "h"], ["ঁ", "n"], ["়", ""], ["্", ""],
]);

function field(block, name) {
  const match = block.match(new RegExp(`"${name}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  return match ? match[1].replaceAll('\\\\"', '"').replaceAll('\\\\n', "\\n") : "";
}

function transliterate(value) {
  let result = "";
  for (const character of value.normalize("NFKC")) result += bengaliMap[character] ?? character;
  return result
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 72)
    .replace(/-+$/g, "") || "article";
}

function hash(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 8);
}

const records = [];
for (const file of files) {
  const absolute = path.join(root, file);
  const source = fs.readFileSync(absolute, "utf8");
  const pattern = /^  \{\r?\n    "slug":\s*"([^"]+)"([\s\S]*?)(?=^  \},\r?\n  \{|^  \}\r?\n\];)/gm;
  for (const match of source.matchAll(pattern)) {
    records.push({ file, absolute, oldSlug: match[1], title: field(match[0], "title"), publishedAt: field(match[0], "publishedAt") });
  }
}

const used = new Set();
const aliases = {};
for (const record of records) {
  const base = `${record.publishedAt}-${titleSlugOverrides[record.title] ?? transliterate(record.title)}`;
  let canonical = base;
  if (used.has(canonical)) canonical = `${base}-${hash(record.oldSlug)}`;
  used.add(canonical);
  record.newSlug = canonical;
  if (record.oldSlug !== canonical) aliases[record.oldSlug] = canonical;
}

for (const file of files) {
  const absolute = path.join(root, file);
  let source = fs.readFileSync(absolute, "utf8");
  const fileRecords = records.filter((record) => record.file === file);
  for (const record of fileRecords) {
    source = source.replace(`"slug": "${record.oldSlug}"`, `"slug": "${record.newSlug}"`);
  }
  fs.writeFileSync(absolute, source, "utf8");
}

const aliasLines = Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b)).map(([oldSlug, newSlug]) => `  ${JSON.stringify(oldSlug)}: ${JSON.stringify(newSlug)},`);
fs.writeFileSync(path.join(root, "lib", "slugAliases.ts"), `export const legacySlugMap: Record<string, string> = {\n${aliasLines.join("\n")}\n};\n`, "utf8");
console.log(JSON.stringify({ records: records.length, changed: Object.keys(aliases).length, aliases: path.join(root, "lib", "slugAliases.ts") }, null, 2));
