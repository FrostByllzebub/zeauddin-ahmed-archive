from __future__ import annotations

import csv
import hashlib
import re
import subprocess
import unicodedata
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(r"C:\Users\taarn\OneDrive\Zeauddin Ahmed's Columns")
OUTPUT = ROOT / "ARTICLE_COMPILATION_INDEX.csv"
UNIQUE_OUTPUT = ROOT / "ARTICLE_COMPILATION_UNIQUE.csv"
MARKDOWN_OUTPUT = ROOT / "ARTICLE_COMPILATION_UNIQUE.md"
DOCX_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def docx_paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    paragraphs = []
    for paragraph in document.findall(".//w:p", DOCX_NS):
        text = "".join(node.text or "" for node in paragraph.findall(".//w:t", DOCX_NS))
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            paragraphs.append(text)
    return paragraphs


def pdf_paragraphs(path: Path) -> list[str]:
    try:
        text = subprocess.check_output(
            ["pdftotext", str(path), "-"], text=True, errors="ignore", timeout=30
        )
    except Exception:
        return []
    return [line.strip() for line in text.splitlines() if line.strip()]


def normalized(text: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", text).lower()).strip()


def date_mentions(text: str) -> str:
    month = r"জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর"
    patterns = [
        rf"[^\n]{{0,20}}(?:{month})[^\n]{{0,20}}(?:19|20)\d{{2}}",
        r"[০-৯\d]{1,2}\s*/\s*[০-৯\d]{1,2}\s*/\s*[০-৯\d]{4}",
        r"[০-৯\d]{1,2}\s*[./-]\s*[০-৯\d]{1,2}\s*[./-]\s*[০-৯\d]{4}",
        r"(?:19|20)\d{2}",
    ]
    matches = []
    for pattern in patterns:
        for match in re.findall(pattern, text):
            value = re.sub(r"\s+", " ", match).strip()
            if value and value not in matches:
                matches.append(value)
    return " | ".join(matches[:8])


def main() -> None:
    if not ROOT.exists():
        raise SystemExit(f"Folder not found: {ROOT}")

    rows = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.name == OUTPUT.name or path.suffix.lower() not in {".docx", ".pdf"}:
            continue
        paragraphs = docx_paragraphs(path) if path.suffix.lower() == ".docx" else pdf_paragraphs(path)
        text = "\n".join(paragraphs)
        digest = hashlib.sha1(normalized(text).encode("utf-8")).hexdigest()[:16] if text else ""
        urls = list(dict.fromkeys(re.findall(r"https?://[^\s<>\"']+", text)))
        years = re.findall(r"\b20\d{2}\b", str(path.parent))
        rows.append(
            {
                "title_from_filename": path.stem,
                "date_mentions": date_mentions(text),
                "original_urls_found": " | ".join(urls),
                "year_folder": years[0] if years else "",
                "file_type": path.suffix.lower()[1:],
                "source_file": str(path),
                "content_hash": digest,
                "text_characters": len(text),
                "status": "text_extracted" if text else "no_text_extracted",
            }
        )

    group_sizes = Counter(row["content_hash"] for row in rows if row["content_hash"])
    for row in rows:
        size = group_sizes.get(row["content_hash"], 1) if row["content_hash"] else 1
        row["duplicate_group_size"] = size
        row["duplicate_status"] = "duplicate_content" if size > 1 else "unique_content"

    fields = list(rows[0]) + ["duplicate_group_size", "duplicate_status"]
    temp = OUTPUT.with_suffix(".tmp.csv")
    with temp.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    temp.replace(OUTPUT)

    grouped = {}
    for row in rows:
        key = row["content_hash"] or f"file:{row['source_file']}"
        if key not in grouped:
            grouped[key] = dict(row)
            grouped[key]["source_files"] = row["source_file"]
            grouped[key]["source_file_count"] = 1
        else:
            grouped[key]["source_files"] += " | " + row["source_file"]
            grouped[key]["source_file_count"] += 1
    unique_fields = [
        "title_from_filename", "date_mentions", "original_urls_found", "year_folder",
        "file_type", "source_files", "source_file_count", "content_hash",
        "text_characters", "status", "duplicate_group_size", "duplicate_status",
    ]
    unique_temp = UNIQUE_OUTPUT.with_suffix(".tmp.csv")
    with unique_temp.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=unique_fields)
        writer.writeheader()
        writer.writerows({field: row.get(field, "") for field in unique_fields} for row in grouped.values())
    unique_temp.replace(UNIQUE_OUTPUT)

    with MARKDOWN_OUTPUT.open("w", encoding="utf-8") as handle:
        handle.write("# Zeauddin Ahmed article compilation\n\n")
        handle.write("This is a compilation index, not a publication or verification ledger. Duplicate files are grouped by content hash.\n\n")
        handle.write(f"Total source files: {len(rows)}  \nDeduplicated records: {len(grouped)}\n\n")
        for year in sorted({row.get("year_folder", "") for row in grouped.values()}):
            label = year or "Unclassified"
            items = [row for row in grouped.values() if row.get("year_folder", "") == year]
            handle.write(f"## {label}\n\n")
            for row in items:
                title = row["title_from_filename"].replace("|", "-")
                date = row["date_mentions"] or "date not found in text"
                url = row["original_urls_found"] or "original URL not found in text"
                handle.write(f"- **{title}** — date: {date}; URL: {url}; source files: {row['source_file_count']}\n")
            handle.write("\n")

    print(f"WROTE {OUTPUT}")
    print(f"WROTE {UNIQUE_OUTPUT}")
    print(f"WROTE {MARKDOWN_OUTPUT}")
    print(f"RECORDS {len(rows)}")
    print(f"UNIQUE_CONTENT {sum(row['duplicate_status'] == 'unique_content' for row in rows)}")
    print(f"WITH_URL {sum(bool(row['original_urls_found']) for row in rows)}")
    print(f"WITH_DATES {sum(bool(row['date_mentions']) for row in rows)}")
    print(f"NO_TEXT {sum(row['status'] == 'no_text_extracted' for row in rows)}")
    print(f"DEDUPLICATED_ARTICLES {len(grouped)}")


if __name__ == "__main__":
    main()
