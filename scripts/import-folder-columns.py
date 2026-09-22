from __future__ import annotations

import hashlib
import re
import shutil
import zipfile
from datetime import date
from pathlib import Path
from xml.etree import ElementTree as ET


SOURCE_ROOT = Path(r"C:\Users\taarn\OneDrive\Zeauddin Ahmed's Columns")
REPO_ROOT = Path(__file__).resolve().parents[1]
IMAGE_ROOT = REPO_ROOT / "public" / "articles" / "folder"
OUTPUT = REPO_ROOT / "lib" / "folderArticles.ts"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
BENGALI_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
MONTHS = {
    1: "জানুয়ারি", 2: "ফেব্রুয়ারি", 3: "মার্চ", 4: "এপ্রিল", 5: "মে", 6: "জুন",
    7: "জুলাই", 8: "আগস্ট", 9: "সেপ্টেম্বর", 10: "অক্টোবর", 11: "নভেম্বর", 12: "ডিসেম্বর",
}


def text_from_docx(path: Path) -> tuple[list[str], list[str]]:
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
        paragraphs = []
        for paragraph in root.findall(".//w:p", NS):
            value = "".join(node.text or "" for node in paragraph.findall(".//w:t", NS))
            value = re.sub(r"\s+", " ", value).strip()
            if value:
                paragraphs.append(value)
        media = [name for name in archive.namelist() if name.startswith("word/media/")]
    return paragraphs, media


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def hash_text(paragraphs: list[str]) -> str:
    return hashlib.sha1("\n".join(normalize(p).lower() for p in paragraphs).encode("utf-8")).hexdigest()


def parse_date(text: str, year: int) -> tuple[str, str]:
    digits = text.translate(BENGALI_DIGITS)
    patterns = [
        r"(?P<day>\d{1,2})\s*[/.-]\s*(?P<month>\d{1,2})\s*[/.-]\s*(?P<year>20\d{2})",
        r"(?P<day>\d{1,2})\s+(?P<month>জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)\s*,?\s*(?P<year>20\d{2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, digits)
        if not match:
            continue
        day = int(match.group("day"))
        raw_month = match.group("month")
        month = next((number for number, name in MONTHS.items() if name == raw_month), None) if not raw_month.isdigit() else int(raw_month)
        try:
            parsed = date(int(match.group("year")), int(month), day)
        except (TypeError, ValueError):
            continue
        iso = parsed.isoformat()
        return iso, f"{parsed.day} {MONTHS[parsed.month]} {parsed.year}".translate(str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯"))
    return f"{year:04d}-01-01", f"{year} (তারিখ অনির্দিষ্ট)".translate(str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯"))


def slug(title: str, digest: str) -> str:
    ascii_part = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"folder-{ascii_part or 'article'}-{digest[:8]}"


def ts(value: str) -> str:
    return value.replace("\\", "\\\\").replace("`", "\\`")


def main() -> None:
    if not SOURCE_ROOT.exists():
        raise SystemExit(f"Source folder not found: {SOURCE_ROOT}")
    IMAGE_ROOT.mkdir(parents=True, exist_ok=True)
    seen: set[str] = set()
    entries = []
    skipped = []
    for path in sorted(SOURCE_ROOT.rglob("*.docx")):
        if path.parent.name == "بাবাকে নিয়ে লেখা":
            skipped.append((path.name, "non-column biography"))
            continue
        paragraphs, media = text_from_docx(path)
        if not paragraphs:
            skipped.append((path.name, "no extracted text"))
            continue
        digest = hash_text(paragraphs)
        if digest in seen:
            continue
        seen.add(digest)
        year_match = re.search(r"20\d{2}", str(path.parent))
        if not year_match:
            continue
        year = int(year_match.group())
        title = path.stem.strip()
        published_at, date_label = parse_date("\n".join(paragraphs), year)
        urls = list(dict.fromkeys(re.findall(r"https?://[^\s<>\"']+", "\n".join(paragraphs))))
        body = paragraphs[:]
        if body and normalize(body[0]).rstrip(" :") == normalize(title).rstrip(" :"):
            body = body[1:]
        image_path = "/articles/archive-editorial-default.svg"
        image_source = ""
        image_credit = "জিয়ার কলাম আর্কাইভ"
        if media:
            with zipfile.ZipFile(path) as archive:
                source_name = media[0]
                extension = Path(source_name).suffix.lower() or ".jpg"
                target_name = f"{slug(title, digest)}{extension}"
                target = IMAGE_ROOT / target_name
                target.write_bytes(archive.read(source_name))
            image_path = f"/articles/folder/{target_name}"
            image_source = ""
            image_credit = "সংরক্ষিত উৎস নথি"
        entries.append({
            "slug": slug(title, digest),
            "title": title,
            "author": "জিয়াউদ্দীন আহমেদ",
            "publication": "সংবাদ",
            "section": "মতামত",
            "publishedAt": published_at,
            "publishedDateLabel": date_label,
            "originalUrl": urls[0] if urls else "",
            "rightsStatus": "full_text_permitted",
            "heroImage": image_path,
            "heroCaption": "বিষয়ভিত্তিক সংরক্ষণ চিত্র" if media else "এই লেখার জন্য সংরক্ষণ-শৈলীর চিত্র",
            "imageSourceUrl": image_source,
            "imageCredit": image_credit,
            "body": [{"paragraphs": body}],
            "authorNote": "",
            "authorCredit": "",
        })
    entries.sort(key=lambda item: (item["publishedAt"], item["title"]), reverse=True)
    OUTPUT.write_text(
        "import type { ArchiveArticle } from './articles';\n\n"
        f"export const folderArticles: ArchiveArticle[] = {__import__('json').dumps(entries, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8",
    )
    print(f"IMPORTED {len(entries)} unique columns")
    print(f"WITH_URL {sum(bool(item['originalUrl']) for item in entries)}")
    print(f"WITH_EXTRACTED_IMAGE {sum(item['heroImage'].startswith('/articles/folder/') for item in entries)}")
    print(f"DATE_EXACT {sum('অনির্দিষ্ট' not in item['publishedDateLabel'] for item in entries)}")
    print(f"SKIPPED {len(skipped)}")


if __name__ == "__main__":
    main()
