#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create a supplementary page (Article 3 expanded scope) and insert it
after page 14 of the original 20-page proposal PDF.

Result: 21-page PDF saved as proposal.pdf
"""

import sys
import io
import os

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import fitz  # PyMuPDF


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = "C:/Users/lacoi/Desktop/hybrid-jury-system/public"
ORIGINAL_PDF = os.path.join(BASE_DIR, "proposal_original.pdf")
OUTPUT_PDF = os.path.join(BASE_DIR, "proposal_new.pdf")
FINAL_PDF = os.path.join(BASE_DIR, "proposal.pdf")
FONT_REGULAR = "C:/Windows/Fonts/HANBatang.ttf"
FONT_BOLD = "C:/Windows/Fonts/HANBatangB.ttf"

# ---------------------------------------------------------------------------
# Layout constants (A4: 595 x 841 pt)
# ---------------------------------------------------------------------------
PAGE_WIDTH = 595.0
PAGE_HEIGHT = 841.0
MARGIN_LEFT = 72.0
MARGIN_RIGHT = 72.0
MARGIN_TOP = 72.0
MARGIN_BOTTOM = 72.0
TEXT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT  # 451 pt

# Font sizes
TITLE_SIZE = 13.0
HEADING_SIZE = 10.0
BODY_SIZE = 10.0

# Line spacing
TITLE_LINE_HEIGHT = 18.0
HEADING_LINE_HEIGHT = 16.0
BODY_LINE_HEIGHT = 13.0
SECTION_GAP = 7.0  # extra gap between sections (articles)
PARAGRAPH_GAP = 4.0  # small gap between paragraphs within a section
INDENT_CLAUSE = 12.0  # indent for numbered sub-clauses (1. 2. 3. ...)
INDENT_PARA = 0.0  # indent for paragraph markers


# ---------------------------------------------------------------------------
# Content definition
# ---------------------------------------------------------------------------
TITLE = "보칙: 제3조 적용범위 확대 보충 규정"

# Each section is a dict with 'heading' and 'paragraphs'.
# Paragraphs can be plain text or indented clauses (prefixed with numbers).
SECTIONS = [
    {
        "heading": "제3조의2 (가정법원 사건 적용)",
        "paragraphs": [
            "① 이 법의 혼합재판부 제도는 가정법원이 관할하는 다음 각 호의 사건에 대하여 단계적으로 적용한다.",
            "  1. 친권 상실·정지 심판 사건",
            "  2. 양육권·면접교섭권 분쟁 사건",
            "  3. 성년후견 개시 심판 사건",
            "  4. 가정폭력 관련 보호처분 사건",
            "② 가정법원 혼합재판부는 직업법관 1명과 참심법관 2명으로 구성한다.",
            "③ 제1항의 적용은 이 법 시행 후 3년이 경과한 날부터 시행한다.",
        ],
    },
    {
        "heading": "제3조의3 (행정법원 사건 적용)",
        "paragraphs": [
            "① 이 법의 혼합재판부 제도는 행정법원이 관할하는 다음 각 호의 사건에 대하여 적용한다.",
            "  1. 대규모 환경영향 행정처분 취소소송",
            "  2. 도시계획·재개발 관련 행정소송",
            "  3. 대규모 공공계약 관련 분쟁",
            "  4. 기본권 침해가 중대한 행정처분 (영업정지, 면허취소 등)",
            "② 행정법원 혼합재판부는 직업법관 3명과 참심법관 4명으로 구성한다.",
            "③ 제1항의 적용은 이 법 시행 후 5년이 경과한 날부터 시행한다.",
        ],
    },
    {
        "heading": "제3조의4 (회생법원 사건 적용)",
        "paragraphs": [
            "① 이 법의 혼합재판부 제도는 회생법원이 관할하는 다음 각 호의 사건에 대하여 적용한다.",
            "  1. 자산규모 500억원 이상 기업의 회생 사건",
            "  2. 다수 채권자가 관련된 개인회생 사건",
            "  3. 파산 절차에서의 면책 결정 사건",
            "  4. 구조조정 관련 노동분쟁 수반 사건",
            "② 회생법원 혼합재판부는 직업법관 1명과 참심법관 2명으로 구성하며, 참심법관은 경영·회계·노동 분야 경험자를 우선 선발한다.",
            "③ 제1항의 적용은 이 법 시행 후 4년이 경과한 날부터 시행한다.",
        ],
    },
    {
        "heading": "제3조의5 (특허법원 사건 적용)",
        "paragraphs": [
            "① 이 법의 혼합재판부 제도는 특허법원이 관할하는 다음 각 호의 사건에 대하여 적용한다.",
            "  1. 특허 무효·등록 취소 심결 취소소송",
            "  2. 표준필수특허(SEP) 관련 FRAND 분쟁",
            "  3. 영업비밀 침해 소송",
            "  4. 소비자 인식이 중요한 디자인·상표 분쟁",
            "② 특허법원 혼합재판부는 직업법관 3명과 기술심리관 겸 참심법관 4명으로 구성한다. 참심법관은 해당 기술 분야의 석사 이상 학위 소지자 또는 해당 분야 10년 이상 실무 경험자로 한다.",
            "③ 제1항의 적용은 이 법 시행 후 6년이 경과한 날부터 시행한다.",
        ],
    },
    {
        "heading": "제3조의6 (행정심판 사건 적용)",
        "paragraphs": [
            "① 행정심판위원회의 다음 각 호의 심판 절차에 시민위원 참여제도를 도입한다.",
            "  1. 환경 관련 행정심판",
            "  2. 국민권익 관련 행정심판",
            "  3. 도시계획·건축 관련 행정심판",
            "② 시민위원은 비상임 위원 중 3분의 1을 무작위 선발된 시민으로 구성한다.",
            "③ 제1항의 적용은 이 법 시행 후 7년이 경과한 날부터 시행하며, 행정심판법 별도 개정에 의한다.",
        ],
    },
    {
        "heading": "제3조의7 (단계적 확대 평가)",
        "paragraphs": [
            "① 법원행정처장은 각 법원의 혼합재판부 운용 현황을 매년 국회에 보고하여야 한다.",
            "② 이 법 시행 후 10년이 경과한 날까지 전 법원 확대에 대한 종합평가를 실시하고, 그 결과에 따라 적용 확대 또는 축소를 결정한다.",
        ],
    },
]


# ---------------------------------------------------------------------------
# Helper: measure text width using the font object
# ---------------------------------------------------------------------------
def text_width(font, text, size):
    """Return the rendered width of *text* at *size* using *font*."""
    # fitz.Font.text_length returns width in points
    return font.text_length(text, fontsize=size)


def wrap_text(font, text, size, max_width):
    """
    Word-wrap *text* to fit within *max_width*.
    Korean text doesn't use spaces as consistently as English, so we wrap
    character-by-character when a space-based split doesn't work well.
    """
    # First try splitting by spaces
    words = text.split(' ')
    lines = []
    current_line = ""

    for word in words:
        test_line = (current_line + " " + word).strip() if current_line else word
        if text_width(font, test_line, size) <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            # If a single word is too long, break it character by character
            if text_width(font, word, size) > max_width:
                char_line = ""
                for ch in word:
                    test_ch = char_line + ch
                    if text_width(font, test_ch, size) <= max_width:
                        char_line = test_ch
                    else:
                        if char_line:
                            lines.append(char_line)
                        char_line = ch
                current_line = char_line
            else:
                current_line = word

    if current_line:
        lines.append(current_line)
    return lines


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("Opening original PDF...")
    doc = fitz.open(ORIGINAL_PDF)
    print(f"  Original page count: {len(doc)}")

    # Insert a new blank page after page index 14 (= after page 15 in 1-based)
    # This will be page index 15 in 0-based (page 16 in 1-based viewing,
    # but logically it's the new page 15 as described).
    new_page = doc.new_page(pno=14, width=PAGE_WIDTH, height=PAGE_HEIGHT)
    print(f"  Inserted blank page at index 14. New page count: {len(doc)}")

    # Load fonts
    font_regular = fitz.Font(fontfile=FONT_REGULAR)
    font_bold = fitz.Font(fontfile=FONT_BOLD)

    # Create a TextWriter for the new page
    tw = fitz.TextWriter(new_page.rect)

    y = MARGIN_TOP  # current vertical position

    # -----------------------------------------------------------------------
    # Title (bold, 13pt, centered)
    # -----------------------------------------------------------------------
    title_width = text_width(font_bold, TITLE, TITLE_SIZE)
    title_x = (PAGE_WIDTH - title_width) / 2.0
    tw.append((title_x, y), TITLE, font=font_bold, fontsize=TITLE_SIZE)
    y += TITLE_LINE_HEIGHT
    y += 7.0  # gap after title

    # -----------------------------------------------------------------------
    # Sections
    # -----------------------------------------------------------------------
    for sec_idx, section in enumerate(SECTIONS):
        # Section heading (bold, 10pt)
        heading = section["heading"]
        tw.append((MARGIN_LEFT, y), heading, font=font_bold, fontsize=HEADING_SIZE)
        y += HEADING_LINE_HEIGHT

        # Paragraphs
        for para in section["paragraphs"]:
            # Determine indent level
            stripped = para.lstrip()
            leading_spaces = len(para) - len(stripped)

            if leading_spaces >= 2:
                # Sub-clause (e.g., "  1. ...")
                indent = MARGIN_LEFT + INDENT_CLAUSE
                available_width = TEXT_WIDTH - INDENT_CLAUSE
                line_text = stripped
            else:
                indent = MARGIN_LEFT
                available_width = TEXT_WIDTH
                line_text = para

            # Wrap text
            lines = wrap_text(font_regular, line_text, BODY_SIZE, available_width)

            for line_idx, line in enumerate(lines):
                if y > PAGE_HEIGHT - MARGIN_BOTTOM:
                    # Safety: don't write below the bottom margin
                    print(f"  WARNING: Content exceeds page at y={y:.1f}")
                    break

                # For continuation lines of a wrapped paragraph, add a small
                # hanging indent so they align nicely
                x = indent
                if line_idx > 0 and leading_spaces < 2:
                    # continuation of a regular paragraph - indent slightly
                    x = indent + 10.0
                    cont_width = available_width - 10.0
                elif line_idx > 0:
                    x = indent + 10.0

                tw.append((x, y), line, font=font_regular, fontsize=BODY_SIZE)
                y += BODY_LINE_HEIGHT

        # Gap between sections
        if sec_idx < len(SECTIONS) - 1:
            y += SECTION_GAP

    # Write all text to page
    tw.write_text(new_page)

    print(f"  Content written. Final y position: {y:.1f} (page height: {PAGE_HEIGHT})")

    # Save to temporary file, then replace
    print(f"Saving to {OUTPUT_PDF}...")
    doc.save(OUTPUT_PDF)
    doc.close()

    # Replace the target file
    if os.path.exists(FINAL_PDF):
        os.remove(FINAL_PDF)
    os.rename(OUTPUT_PDF, FINAL_PDF)
    print(f"Saved final PDF to {FINAL_PDF}")

    # Verify
    verify_doc = fitz.open(FINAL_PDF)
    print(f"  Verification: {len(verify_doc)} pages")
    # Extract text from the new page (index 14) to verify
    new_page_text = verify_doc[14].get_text()
    verify_doc.close()

    if "가정법원" in new_page_text and "행정법원" in new_page_text:
        print("  Content verification: PASSED (found key terms)")
    else:
        print("  Content verification: WARNING - key terms not found in extracted text")

    if "가사법원" in new_page_text:
        print("  Terminology check: FAILED - found incorrect term '가사법원'")
    else:
        print("  Terminology check: PASSED (no incorrect '가사법원' found)")

    print("Done!")


if __name__ == "__main__":
    main()
