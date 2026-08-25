from __future__ import annotations

import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image as ReportImage,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "bao-cao-do-an-rabbitcv.md"
OUTPUT = ROOT / "output" / "pdf" / "Bao_cao_do_an_tot_nghiep_RabbitCV.pdf"
DIAGRAM_DIR = ROOT / "docs" / "diagrams"

VIOLET = colors.HexColor("#7C3AED")
VIOLET_DARK = colors.HexColor("#5B21B6")
VIOLET_PALE = colors.HexColor("#F5F3FF")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#475569")
LINE = colors.HexColor("#D8DEE9")
SOFT = colors.HexColor("#F8FAFC")


def register_fonts() -> None:
    font_dir = Path(r"C:\Windows\Fonts")
    pdfmetrics.registerFont(TTFont("TimesVN", str(font_dir / "times.ttf")))
    pdfmetrics.registerFont(TTFont("TimesVN-Bold", str(font_dir / "timesbd.ttf")))
    pdfmetrics.registerFont(TTFont("TimesVN-Italic", str(font_dir / "timesi.ttf")))
    pdfmetrics.registerFont(TTFont("TimesVN-BoldItalic", str(font_dir / "timesbi.ttf")))
    pdfmetrics.registerFont(TTFont("CourierVN", str(font_dir / "cour.ttf")))
    pdfmetrics.registerFontFamily(
        "TimesVN",
        normal="TimesVN",
        bold="TimesVN-Bold",
        italic="TimesVN-Italic",
        boldItalic="TimesVN-BoldItalic",
    )


class ReportDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, **kwargs):
        super().__init__(filename, **kwargs)
        self._heading_number = 0

    def beforeDocument(self):
        self._heading_number = 0

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name in {"Heading1", "Heading2", "Heading3"}:
                level = {"Heading1": 0, "Heading2": 1, "Heading3": 2}[style_name]
                text = flowable.getPlainText()
                key = f"heading-{self._heading_number}"
                self._heading_number += 1
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page, key))


def make_styles():
    base = getSampleStyleSheet()
    styles = {}
    styles["Body"] = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="TimesVN",
        fontSize=12,
        leading=18,
        alignment=TA_JUSTIFY,
        textColor=INK,
        spaceAfter=7,
        firstLineIndent=0.85 * cm,
        allowWidows=0,
        allowOrphans=0,
    )
    styles["BodyNoIndent"] = ParagraphStyle(
        "BodyNoIndent",
        parent=styles["Body"],
        firstLineIndent=0,
    )
    styles["Heading1"] = ParagraphStyle(
        "Heading1",
        parent=base["Heading1"],
        fontName="TimesVN-Bold",
        fontSize=17,
        leading=22,
        alignment=TA_CENTER,
        textColor=VIOLET_DARK,
        spaceBefore=4,
        spaceAfter=16,
        keepWithNext=True,
    )
    styles["Heading2"] = ParagraphStyle(
        "Heading2",
        parent=base["Heading2"],
        fontName="TimesVN-Bold",
        fontSize=14,
        leading=18,
        textColor=INK,
        spaceBefore=12,
        spaceAfter=7,
        keepWithNext=True,
    )
    styles["Heading3"] = ParagraphStyle(
        "Heading3",
        parent=base["Heading3"],
        fontName="TimesVN-BoldItalic",
        fontSize=12.5,
        leading=17,
        textColor=VIOLET_DARK,
        spaceBefore=9,
        spaceAfter=5,
        keepWithNext=True,
    )
    styles["Bullet"] = ParagraphStyle(
        "Bullet",
        parent=styles["BodyNoIndent"],
        leftIndent=0.65 * cm,
        firstLineIndent=-0.35 * cm,
        bulletIndent=0.15 * cm,
        spaceAfter=4,
    )
    styles["Number"] = ParagraphStyle(
        "Number",
        parent=styles["Bullet"],
    )
    styles["Caption"] = ParagraphStyle(
        "Caption",
        parent=styles["BodyNoIndent"],
        fontName="TimesVN-Italic",
        fontSize=10.5,
        leading=14,
        alignment=TA_CENTER,
        textColor=MUTED,
        spaceBefore=4,
        spaceAfter=9,
    )
    styles["Code"] = ParagraphStyle(
        "Code",
        fontName="CourierVN",
        fontSize=7.2,
        leading=9.2,
        textColor=INK,
        leftIndent=0.22 * cm,
        rightIndent=0.22 * cm,
        spaceBefore=4,
        spaceAfter=8,
        backColor=SOFT,
        borderColor=LINE,
        borderWidth=0.5,
        borderPadding=7,
    )
    styles["Quote"] = ParagraphStyle(
        "Quote",
        parent=styles["BodyNoIndent"],
        fontName="TimesVN-Italic",
        leftIndent=0.7 * cm,
        rightIndent=0.4 * cm,
        borderColor=VIOLET,
        borderWidth=0,
        borderLeftWidth=2,
        borderPadding=7,
        backColor=VIOLET_PALE,
    )
    styles["Small"] = ParagraphStyle(
        "Small",
        parent=styles["BodyNoIndent"],
        fontSize=9.2,
        leading=12,
    )
    styles["Reference"] = ParagraphStyle(
        "Reference",
        parent=styles["Small"],
        fontSize=9.2,
        leading=11.3,
        leftIndent=0.5 * cm,
        firstLineIndent=-0.5 * cm,
        spaceAfter=4,
        alignment=TA_JUSTIFY,
    )
    return styles


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def inline(text: str) -> str:
    text = esc(text.strip())
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`(.+?)`", r"<font name='CourierVN' size='9'>\1</font>", text)
    text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", text)
    return text


def cover_story(styles):
    story = [Spacer(1, 0.15 * cm)]
    center = ParagraphStyle(
        "CoverCenter",
        parent=styles["BodyNoIndent"],
        alignment=TA_CENTER,
        fontName="TimesVN-Bold",
        fontSize=13,
        leading=18,
    )
    title = ParagraphStyle(
        "CoverTitle",
        parent=center,
        fontSize=22,
        leading=29,
        textColor=VIOLET_DARK,
        spaceAfter=10,
    )
    subtitle = ParagraphStyle(
        "CoverSubtitle",
        parent=center,
        fontSize=16,
        leading=22,
        textColor=INK,
    )
    story.extend(
        [
            Paragraph("ĐẠI HỌC QUỐC GIA THÀNH PHỐ HỒ CHÍ MINH", center),
            Paragraph("TRƯỜNG ĐẠI HỌC BÁCH KHOA", center),
            Paragraph("KHOA KHOA HỌC VÀ KỸ THUẬT MÁY TÍNH", center),
            Spacer(1, 0.35 * cm),
            HRFlowable(width="72%", thickness=1.2, color=VIOLET, hAlign="CENTER"),
            Spacer(1, 1.65 * cm),
            Paragraph("BÁO CÁO ĐỒ ÁN TỐT NGHIỆP", title),
            Spacer(1, 0.35 * cm),
            Paragraph("RABBITCV - NỀN TẢNG HỖ TRỢ VIẾT CV<br/>VÀ TÌM KIẾM VIỆC LÀM", subtitle),
            Spacer(1, 1.65 * cm),
        ]
    )
    info = [
        [Paragraph("Sinh viên thực hiện:", styles["BodyNoIndent"]), Paragraph("Nguyễn Thành Vinh", styles["BodyNoIndent"])],
        [Paragraph("Mã số sinh viên:", styles["BodyNoIndent"]), Paragraph("................................", styles["BodyNoIndent"])],
        [Paragraph("Ngành:", styles["BodyNoIndent"]), Paragraph("Khoa học Máy tính", styles["BodyNoIndent"])],
        [Paragraph("Giảng viên hướng dẫn:", styles["BodyNoIndent"]), Paragraph("ThS. Mai Đức Trung", styles["BodyNoIndent"])],
    ]
    table = Table(info, colWidths=[5.0 * cm, 7.8 * cm], hAlign="CENTER")
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "TimesVN"),
        ("FONTNAME", (1, 0), (1, -1), "TimesVN-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 12.5),
        ("LEADING", (0, 0), (-1, -1), 18),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.extend([table, Spacer(1, 2.45 * cm), Paragraph("THÀNH PHỐ HỒ CHÍ MINH, 2026", center)])
    return story


def make_table(rows, styles, available_width=16.2 * cm):
    cols = max(len(row) for row in rows)
    normalized = [row + [""] * (cols - len(row)) for row in rows]
    data = []
    for row_index, row in enumerate(normalized):
        cell_style = ParagraphStyle(
            f"TableCell{row_index}",
            parent=styles["Small"],
            fontName="TimesVN-Bold" if row_index == 0 else "TimesVN",
            textColor=colors.white if row_index == 0 else INK,
            leading=11.3,
        )
        data.append([Paragraph(inline(cell), cell_style) for cell in row])
    widths = [available_width / cols] * cols
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), VIOLET_DARK),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SOFT]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def parse_markdown(text: str, styles):
    lines = text.replace("\r\n", "\n").split("\n")
    story = []
    paragraph_buffer = []
    mermaid_index = 0
    i = 0

    def flush_paragraph():
        if paragraph_buffer:
            joined = " ".join(item.strip() for item in paragraph_buffer).strip()
            if joined:
                story.append(Paragraph(inline(joined), styles["Body"]))
            paragraph_buffer.clear()

    while i < len(lines):
        raw = lines[i]
        line = raw.strip()
        if not line:
            flush_paragraph()
            i += 1
            continue
        if line == "[PAGEBREAK]":
            flush_paragraph()
            story.append(PageBreak())
            i += 1
            continue
        if line == "[TOC]":
            flush_paragraph()
            toc = TableOfContents()
            toc.levelStyles = [
                ParagraphStyle("TOC0", fontName="TimesVN-Bold", fontSize=10.5, leading=13.5, leftIndent=0, firstLineIndent=0, spaceBefore=2, textColor=INK),
                ParagraphStyle("TOC1", fontName="TimesVN", fontSize=9.4, leading=11.8, leftIndent=0.45 * cm, firstLineIndent=0, textColor=MUTED),
                ParagraphStyle("TOC2", fontName="TimesVN-Italic", fontSize=8.5, leading=10.5, leftIndent=0.9 * cm, firstLineIndent=0, textColor=MUTED),
            ]
            story.append(toc)
            i += 1
            continue
        if line.startswith("```"):
            flush_paragraph()
            language = line[3:].strip()
            code = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i].rstrip())
                i += 1
            if language == "mermaid":
                mermaid_index += 1
                diagram_path = DIAGRAM_DIR / f"report-{mermaid_index:02d}.png"
                if diagram_path.exists():
                    diagram = ReportImage(str(diagram_path))
                    scale = min(
                        (16.2 * cm) / diagram.imageWidth,
                        (14.0 * cm) / diagram.imageHeight,
                    )
                    diagram.drawWidth = diagram.imageWidth * scale
                    diagram.drawHeight = diagram.imageHeight * scale
                    diagram.hAlign = "CENTER"
                    story.extend([Spacer(1, 0.15 * cm), diagram, Spacer(1, 0.1 * cm)])
                else:
                    story.append(Paragraph("<b>Sơ đồ Mermaid</b>", styles["Caption"]))
                    chunks = [code[j:j + 35] for j in range(0, len(code), 35)] or [[]]
                    for chunk in chunks:
                        story.append(Preformatted("\n".join(chunk), styles["Code"], maxLineLength=100))
            else:
                story.append(Paragraph("<b>Đoạn mã</b>", styles["Caption"]))
                chunks = [code[j:j + 35] for j in range(0, len(code), 35)] or [[]]
                for chunk in chunks:
                    story.append(Preformatted("\n".join(chunk), styles["Code"], maxLineLength=100))
            i += 1
            continue
        if line.startswith("|") and line.endswith("|"):
            flush_paragraph()
            rows = []
            while i < len(lines):
                candidate = lines[i].strip()
                if not (candidate.startswith("|") and candidate.endswith("|")):
                    break
                cells = [cell.strip() for cell in candidate.strip("|").split("|")]
                if not all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
                    rows.append(cells)
                i += 1
            story.extend([make_table(rows, styles), Spacer(1, 0.25 * cm)])
            continue
        heading_match = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading_match:
            flush_paragraph()
            level = len(heading_match.group(1))
            story.append(Paragraph(inline(heading_match.group(2)), styles[f"Heading{level}"]))
            i += 1
            continue
        if line.startswith("> "):
            flush_paragraph()
            story.append(Paragraph(inline(line[2:]), styles["Quote"]))
            i += 1
            continue
        bullet_match = re.match(r"^[-*]\s+(.+)$", line)
        if bullet_match:
            flush_paragraph()
            story.append(Paragraph(inline(bullet_match.group(1)), styles["Bullet"], bulletText="-"))
            i += 1
            continue
        number_match = re.match(r"^(\d+)\.\s+(.+)$", line)
        if number_match:
            flush_paragraph()
            story.append(Paragraph(inline(number_match.group(2)), styles["Number"], bulletText=number_match.group(1) + "."))
            i += 1
            continue
        if re.match(r"^\[\d+\]\s+", line):
            flush_paragraph()
            story.append(Paragraph(inline(line), styles["Reference"]))
            i += 1
            continue
        if line.startswith("*Hình ") or line.startswith("*Bảng "):
            flush_paragraph()
            story.append(Paragraph(inline(line.strip("*")), styles["Caption"]))
            i += 1
            continue
        paragraph_buffer.append(line)
        i += 1
    flush_paragraph()
    return story


def first_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VIOLET)
    canvas.rect(0, A4[1] - 0.38 * cm, A4[0], 0.38 * cm, stroke=0, fill=1)
    canvas.setFillColor(VIOLET_PALE)
    canvas.rect(0, 0, A4[0], 0.25 * cm, stroke=0, fill=1)
    canvas.restoreState()


def later_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.45)
    canvas.line(2.35 * cm, height - 1.45 * cm, width - 2.05 * cm, height - 1.45 * cm)
    canvas.setFont("TimesVN-Italic", 9)
    canvas.setFillColor(MUTED)
    canvas.drawString(2.35 * cm, height - 1.17 * cm, "RabbitCV - Báo cáo đồ án tốt nghiệp")
    canvas.drawRightString(width - 2.05 * cm, 1.15 * cm, f"Trang {doc.page}")
    canvas.line(2.35 * cm, 1.45 * cm, width - 2.05 * cm, 1.45 * cm)
    canvas.restoreState()


def build() -> Path:
    register_fonts()
    styles = make_styles()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = ReportDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=2.35 * cm,
        rightMargin=2.05 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.75 * cm,
        title="Báo cáo đồ án tốt nghiệp RabbitCV",
        author="Nguyễn Thành Vinh",
        subject="Nền tảng hỗ trợ viết CV và tìm kiếm việc làm",
    )
    cover_frame = Frame(2.1 * cm, 1.6 * cm, A4[0] - 4.2 * cm, A4[1] - 3.2 * cm, id="cover")
    body_frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="body")
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=first_page),
        PageTemplate(id="Body", frames=[body_frame], onPage=later_page),
    ])
    story = cover_story(styles)
    story.extend([NextPageTemplate("Body"), PageBreak()])
    story.extend(parse_markdown(SOURCE.read_text(encoding="utf-8"), styles))
    doc.multiBuild(story)
    return OUTPUT


if __name__ == "__main__":
    try:
        result = build()
        print(result)
    except Exception as exc:
        print(f"Không thể tạo báo cáo: {exc}", file=sys.stderr)
        raise
