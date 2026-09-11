# -*- coding: utf-8 -*-
"""
빈 PRINTFORM 슬롯(대사 미작성 자리)을 전량 스캔해
사용자가 대사만 채우면 되는 엑셀(.xlsx)로 추출한다.

사용법:
    python tools/fill-list/build_fill_list.py
"""
import os
import re
import sys

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ERB_DIR = os.path.join(ROOT, "에라마왕 개조판 1.28", "ERB")
OUT_XLSX = os.path.join(ROOT, "에라마왕 개조판 1.28", "_작성필요_대사목록.xlsx")

EMPTY_FORM = re.compile(
    r"^(PRINTFORMW|PRINTFORML|PRINTFORMLC|PRINTFORMC|PRINTFORMK|PRINTFORMD|PRINTSINGLEFORM|PRINTFORM)\s*$"
)
DIVIDER = re.compile(r"^;[-=\s]*$")

CATEGORY = [
    ("KOJO_MESSAGE_COM", "조교 커맨드 대사", "성적"),
    ("DOG_KOJO", "수간(견화) 조교 대사", "성적"),
    ("COLOSSEUM_KOJO", "투기장 조교 대사", "성적/일반"),
    ("KOJO_MESSAGE_PALAMCNG", "파라미터 변화 반응", "혼합"),
    ("KOJO_MESSAGE_MARKCNG", "각인 변화 반응", "혼합"),
    ("SELF_KOJO", "자위 조교 대사", "성적"),
    ("DUNGEON_RYOUZYOKU", "던전 능욕", "성적"),
    ("BENKI_KOUJO", "변기 조교", "성적/스캇"),
    ("DUNGEON_VICTORY", "던전 전투 승리", "일반"),
    ("DUNGEON_ATTACK", "던전 전투", "일반"),
    ("NTR_KOUJO", "NTR", "성적"),
    ("EXUCUTION_KOUJO", "처형", "일반/고어"),
    ("MUSEUM_KOUJO", "박물관(전시)", "일반"),
    ("BANISHMENT_KOUJO", "추방", "일반"),
    ("PUBLIC_EXUCUTION", "공개 처형", "일반/고어"),
    ("GROTESQUE_KOUJO", "그로테스크/고어", "고어"),
    ("GOHOUBI", "포상", "성적/일반"),
    ("OSIOKI_KOUJO", "징벌", "성적/일반"),
    ("ENTERENEMY", "적대화", "일반"),
    ("GOBI_KOUJO", "어미(말버릇)", "일반"),
]


def categorize(func):
    f = func.lstrip("@")
    for key, label, owner in CATEGORY:
        if f.startswith(key):
            return label, owner
    for key, label, owner in CATEGORY:
        if key in f:
            return label, owner
    return "기타", "확인필요"


CHAR_RE = re.compile(r"EVENT_(K\d+)_(.+?)\.ERB$")


def char_of(fname):
    m = CHAR_RE.search(fname)
    return f"{m.group(1)} {m.group(2)}" if m else ""


def clean_comment(s):
    return s.lstrip(";").strip()


def scan_file(path):
    with open(path, "rb") as f:
        raw = f.read()
    lines = raw.decode("utf-8-sig").split("\n")

    fname = os.path.basename(path)
    character = char_of(fname)

    rows = []
    ordinal = 0
    func = ""
    section = ""
    last_comment = ""
    prev_kind = ""          # 'divider' | 'comment' | 'code' | 'blank'
    prev_comment_text = ""
    cond_stack = []
    last_written = ""

    for i, raw_line in enumerate(lines):
        line = raw_line.rstrip("\r")
        stripped = line.strip()

        if not stripped:
            prev_kind = "blank"
            continue

        if stripped.startswith(";"):
            if DIVIDER.match(stripped):
                # 배너 = 구분선 사이에 낀 주석 → 커맨드/장면으로 승격
                if prev_kind == "comment" and prev_comment_text:
                    section = prev_comment_text
                prev_kind = "divider"
            else:
                c = clean_comment(stripped)
                if c:
                    last_comment = c
                    prev_comment_text = c
                prev_kind = "comment"
            continue

        if stripped.startswith("@"):
            func = stripped.split(",")[0].strip()
            section = ""
            cond_stack = []
            last_comment = ""
            prev_comment_text = ""
            prev_kind = "code"
            last_written = ""
            continue

        upper = stripped.upper()
        if upper.startswith("IF "):
            cond_stack.append((stripped[3:].strip(), last_comment))
        elif upper.startswith("ELSEIF "):
            if cond_stack:
                cond_stack.pop()
            cond_stack.append((stripped[7:].strip(), last_comment))
        elif upper == "ELSE":
            if cond_stack:
                cond_stack.pop()
            cond_stack.append(("(그 외의 경우)", last_comment))
        elif upper.startswith("ENDIF"):
            if cond_stack:
                cond_stack.pop()

        m = EMPTY_FORM.match(stripped)
        if m:
            keyword = m.group(1)
            branch_labels = [c for (_, c) in cond_stack if c]
            own = last_comment if last_comment and last_comment not in branch_labels else ""
            chain = " > ".join(branch_labels + ([own] if own else []))
            cond_top = cond_stack[-1][0] if cond_stack else ""
            rows.append({
                "id": f"{fname}#{ordinal:04d}",
                "file": fname,
                "character": character,
                "func": func,
                "section": section,
                "branch": chain,
                "cond": cond_top,
                "prev": last_written,
                "line": i + 1,
                "ordinal": ordinal,
                "keyword": keyword,
            })
            ordinal += 1
            last_comment = ""
            prev_kind = "code"
            continue

        if upper.startswith("PRINTFORM") or upper.startswith("PRINTSINGLEFORM"):
            payload = stripped.split(None, 1)
            if len(payload) == 2 and payload[1].strip():
                last_written = payload[1].strip()

        last_comment = ""
        prev_kind = "code"

    return rows


def main():
    if not os.path.isdir(ERB_DIR):
        print(f"ERB 폴더 없음: {ERB_DIR}", file=sys.stderr)
        sys.exit(1)

    files = sorted(f for f in os.listdir(ERB_DIR) if f.upper().endswith(".ERB"))
    all_rows = []
    per_file = {}
    for f in files:
        rows = scan_file(os.path.join(ERB_DIR, f))
        if rows:
            per_file[f] = len(rows)
            all_rows.extend(rows)

    wb = Workbook()
    ws = wb.active
    ws.title = "작성필요"

    headers = [
        ("ID", 20), ("파일", 26), ("캐릭터", 14), ("카테고리", 18),
        ("담당힌트", 10), ("함수", 26), ("커맨드/장면", 26), ("상황(분기)", 34),
        ("조건식(원문)", 34), ("직전 작성 예시(톤 참고)", 40),
        ("작성할 대사 ← 여기에 입력", 60),
        ("_line", 8), ("_ordinal", 9), ("_keyword", 16),
    ]
    header_fill = PatternFill("solid", fgColor="305496")
    header_font = Font(bold=True, color="FFFFFF")
    input_fill = PatternFill("solid", fgColor="FFF2CC")
    thin = Side(style="thin", color="D9D9D9")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    wrap = Alignment(vertical="top", wrap_text=True)

    for c, (name, width) in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=c, value=name)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(vertical="center", horizontal="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(c)].width = width

    INPUT_COL = 11
    for r, row in enumerate(all_rows, start=2):
        cat, owner = categorize(row["func"])
        vals = [
            row["id"], row["file"], row["character"], cat, owner, row["func"],
            row["section"], row["branch"], row["cond"], row["prev"],
            "", row["line"], row["ordinal"], row["keyword"],
        ]
        for c, v in enumerate(vals, start=1):
            cell = ws.cell(row=r, column=c, value=v)
            cell.alignment = wrap
            cell.border = border
            if c == INPUT_COL:
                cell.fill = input_fill

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{len(all_rows) + 1}"
    for col in (12, 13, 14):
        ws.column_dimensions[get_column_letter(col)].hidden = True

    ws2 = wb.create_sheet("요약")
    ws2.append(["파일", "빈 자리 수"])
    ws2["A1"].font = Font(bold=True)
    ws2["B1"].font = Font(bold=True)
    for f in sorted(per_file, key=lambda k: -per_file[k]):
        ws2.append([f, per_file[f]])
    ws2.append(["합계", len(all_rows)])
    ws2.column_dimensions["A"].width = 30
    ws2.column_dimensions["B"].width = 12

    wb.save(OUT_XLSX)
    print(f"OK: {len(all_rows)} slots / {len(per_file)} files -> {OUT_XLSX}")


if __name__ == "__main__":
    main()
