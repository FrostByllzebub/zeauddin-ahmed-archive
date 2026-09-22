import json
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "lib" / "articles.ts"
OUTPUT = Path(r"G:\My Drive\05 Reference Library\Articles\Zeauddin Ahmed's Columns")
FONT = Path(r"C:\Windows\Fonts\kalpurush.ttf")

source = SOURCE.read_text(encoding="utf-8")
start = source.index("export const articles")
array_start = source.index("=", start) + 1
end = source.index("export function getArticle", array_start)
json_text = source[array_start:end].strip().rstrip(";")
json_text = re.sub(r",(\s*[\]}])", r"\1", json_text)
articles = json.loads(json_text)

OUTPUT.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont("Kalpurush", str(FONT)))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Kicker", fontName="Kalpurush", fontSize=11, leading=16, textColor=colors.HexColor("#ad452b"), spaceAfter=4))
styles.add(ParagraphStyle(name="TitleBn", fontName="Kalpurush", fontSize=22, leading=30, textColor=colors.HexColor("#171719"), spaceAfter=10))
styles.add(ParagraphStyle(name="MetaBn", fontName="Kalpurush", fontSize=10, leading=15, textColor=colors.HexColor("#4c5c68"), spaceAfter=3))
styles.add(ParagraphStyle(name="BodyBn", fontName="Kalpurush", fontSize=11, leading=19, textColor=colors.HexColor("#202022"), alignment=TA_LEFT, spaceAfter=10))
styles.add(ParagraphStyle(name="FooterBn", fontName="Kalpurush", fontSize=8, leading=10, textColor=colors.HexColor("#777777")))

def safe_id(article):
    return re.sub(r"[^a-z0-9-]", "-", article["slug"].replace("sangbad-", ""), flags=re.I)

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#d7d0c4"))
    canvas.line(18 * mm, 17 * mm, 192 * mm, 17 * mm)
    canvas.setFont("Kalpurush", 8)
    canvas.setFillColor(colors.HexColor("#777777"))
    canvas.drawString(18 * mm, 10 * mm, "জিয়াউদ্দীন আহমেদ · সংবাদ কলাম আর্কাইভ")
    canvas.drawRightString(192 * mm, 10 * mm, f"{doc.page}")
    canvas.restoreState()

for article in articles:
    if article["slug"] == "brics-sommelon-o-bangladesher-koutnoitik-hisab":
        continue
    filename = f"{article['publishedAt']} - Sangbad - {safe_id(article)} - Zeauddin Ahmed.pdf"
    output = OUTPUT / filename
    image_path = ROOT / "public" / article["heroImage"].lstrip("/")
    doc = SimpleDocTemplate(str(output), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=18 * mm, bottomMargin=23 * mm, title=article["title"], author=article["author"], subject="Full-text preservation copy")
    story = [Paragraph(article["publication"], styles["Kicker"]), Paragraph(article["title"], styles["TitleBn"]), Paragraph(f"{article['author']} · {article['publishedDateLabel']}", styles["MetaBn"]), Paragraph(f"মূল প্রকাশনার URL: <link href='{article['originalUrl']}' color='#365c7d'><u>{article['originalUrl']}</u></link>", styles["MetaBn"]), Spacer(1, 4 * mm)]
    if image_path.exists():
        story.extend([Image(str(image_path), width=174 * mm, height=98 * mm), Spacer(1, 3 * mm), Paragraph(article.get("heroCaption", ""), styles["MetaBn"]), Spacer(1, 3 * mm)])
    for section in article["body"]:
        if section.get("heading"):
            story.append(Paragraph(section["heading"], styles["Kicker"]))
        for paragraph in section["paragraphs"]:
            story.append(Paragraph(paragraph, styles["BodyBn"]))
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(output)
