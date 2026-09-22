"""Generate readable Bengali PDF preservation copies using Edge's print engine.

Chromium performs Bengali shaping correctly, so this is intentionally browser-based
instead of drawing Bengali glyphs directly with ReportLab.
"""

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "lib" / "articles.ts"
OUTPUT = Path(r"G:\My Drive\05 Reference Library\Articles\Zeauddin Ahmed's Columns")
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
VERSION = "0d20ec7"

source = SOURCE.read_text(encoding="utf-8")
start = source.index("export const articles")
array_start = source.index("=", start) + 1
end = source.index("export function getArticle", array_start)
json_text = re.sub(r",(\s*[\]}])", r"\1", source[array_start:end].strip().rstrip(";"))
articles = json.loads(json_text)

OUTPUT.mkdir(parents=True, exist_ok=True)

def article_id(article):
    return article["slug"].replace("sangbad-", "")

for article in articles:
    ident = article_id(article)
    if article["slug"] == "brics-sommelon-o-bangladesher-koutnoitik-hisab":
        filename = "2026-09-19 - BRICS Summit and Bangladesh Diplomatic Calculus - Sangbad.pdf"
    else:
        filename = f"{article['publishedAt']} - Sangbad - {ident} - Zeauddin Ahmed.pdf"
    output = OUTPUT / filename
    url = f"https://zeauddinahmed.com/articles/{article['slug']}/?pdf=1&v={VERSION}"
    subprocess.run([
        str(EDGE),
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=10000",
        f"--print-to-pdf={output}",
        url,
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(output)
