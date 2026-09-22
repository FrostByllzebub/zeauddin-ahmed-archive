"""Create cleaned preservation PDFs from the original Sangbad article records.

The PDFs intentionally do not print the archive website. They reconstruct only the
original article material: Sangbad masthead, article date, original URL, original
featured image, headline, byline, and full write-up. Advertisements and unrelated
newspaper-page elements are excluded. Edge is used for Bengali shaping and printing.
"""

import html
import json
import re
import subprocess
from urllib.request import Request, urlopen
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "lib" / "articles.ts"
OUTPUT = Path(r"G:\My Drive\05 Reference Library\Articles\Zeauddin Ahmed's Columns")
TEMP = ROOT / "tmp" / "source-pdf-html"
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")

source = SOURCE.read_text(encoding="utf-8")
start = source.index("export const articles")
array_start = source.index("=", start) + 1
end = source.index("export function getArticle", array_start)
json_text = re.sub(r",(\s*[\]}])", r"\1", source[array_start:end].strip().rstrip(";"))
articles = json.loads(json_text)

OUTPUT.mkdir(parents=True, exist_ok=True)
TEMP.mkdir(parents=True, exist_ok=True)

def article_id(article):
    return article["slug"].replace("sangbad-", "")

def original_image(article):
    """Fetch the original article's featured image from Sangbad's og:image."""
    target = TEMP / f"original-{article_id(article)}.jpg"
    request = Request(article["originalUrl"], headers={"User-Agent": "Mozilla/5.0"})
    page = urlopen(request, timeout=30).read().decode("utf-8", errors="replace")
    match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', page, re.I)
    if not match:
        match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', page, re.I)
    if not match:
        raise RuntimeError(f"No original og:image found for {article['originalUrl']}")
    image_request = Request(match.group(1), headers={"User-Agent": "Mozilla/5.0"})
    target.write_bytes(urlopen(image_request, timeout=30).read())
    return target

def source_filename(article):
    ident = article_id(article)
    if article["slug"] == "brics-sommelon-o-bangladesher-koutnoitik-hisab":
        return "2026-09-19 - BRICS Summit and Bangladesh Diplomatic Calculus - Sangbad.pdf"
    return f"{article['publishedAt']} - Sangbad - {ident} - Zeauddin Ahmed.pdf"

def paragraph_html(text):
    return f"<p>{html.escape(text)}</p>"

for article in articles:
    image = original_image(article)
    image_uri = image.as_uri()
    sections = []
    for section in article["body"]:
        if section.get("heading"):
            sections.append(f"<h2>{html.escape(section['heading'])}</h2>")
        sections.extend(paragraph_html(p) for p in section["paragraphs"])
    document = f"""<!doctype html>
<html lang="bn"><head><meta charset="utf-8"><title>{html.escape(article['title'])}</title>
<style>
@page {{ size: A4; margin: 14mm 16mm 18mm; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; color: #171717; background: #fff; font-family: "Kalpurush", "Nirmala UI", "Noto Serif Bengali", serif; }}
.masthead {{ border-top: 2px solid #171717; border-bottom: 1px solid #cfcfcf; padding: 5mm 0 3mm; display: flex; justify-content: space-between; align-items: end; }}
.paper-name {{ font-family: "Noto Serif Bengali", "Kalpurush", serif; font-size: 37px; font-weight: 700; letter-spacing: .02em; }}
.date {{ font-size: 16px; color: #242424; }}
.url {{ margin: 3mm 0 7mm; padding-bottom: 3mm; border-bottom: 1px solid #d8d8d8; font-family: "Nirmala UI", "Kalpurush", sans-serif; font-size: 10px; color: #444; }}
.url a {{ color: #365c7d; text-decoration: underline; }}
.section {{ color: #b44e35; font-size: 13px; margin: 0 0 3mm; }}
h1 {{ font-family: "Kalpurush", "Nirmala UI", serif; font-size: 29px; line-height: 1.3; font-weight: 700; margin: 0 0 3mm; }}
.byline {{ font-size: 14px; margin: 0 0 4mm; }}
.published {{ font-size: 12px; color: #555; margin: 0 0 5mm; }}
.hero {{ width: 100%; max-height: 105mm; object-fit: contain; display: block; margin: 2mm 0 1mm; }}
.caption {{ font-size: 10px; color: #555; text-align: center; margin: 0 0 6mm; }}
.article-body {{ border-top: 2px solid #b44e35; padding-top: 5mm; }}
.article-body p {{ font-size: 15px; line-height: 2; text-align: justify; margin: 0 0 4mm; }}
.article-body h2 {{ font-size: 18px; line-height: 1.5; margin: 6mm 0 3mm; }}
</style></head><body>
<header class="masthead"><div class="paper-name">সংবাদ</div><div class="date">প্রকাশের তারিখ: {html.escape(article['publishedDateLabel'])}</div></header>
<div class="url">মূল URL: <a href="{html.escape(article['originalUrl'])}">{html.escape(article['originalUrl'])}</a></div>
<div class="section">{html.escape(article['section'])}</div>
<h1>{html.escape(article['title'])}</h1>
<p class="byline">লেখক: {html.escape(article['author'])}</p>
<p class="published">প্রকাশিত: {html.escape(article['publishedDateLabel'])}</p>
<img class="hero" src="{image_uri}" alt="">
<p class="caption">মূল প্রকাশনার ছবি</p>
<main class="article-body">{''.join(sections)}</main>
</body></html>"""
    html_path = TEMP / f"{article['slug']}.html"
    html_path.write_text(document, encoding="utf-8")
    output = OUTPUT / source_filename(article)
    subprocess.run([
        str(EDGE), "--headless=new", "--disable-gpu", "--allow-file-access-from-files",
        "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=10000", f"--print-to-pdf={output}", html_path.as_uri(),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(output)
