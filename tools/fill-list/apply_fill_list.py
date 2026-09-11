# -*- coding: utf-8 -*-
"""
사용자가 '작성할 대사' 칸을 채운 엑셀을 되읽어,
각 빈 PRINTFORM 슬롯에 in-place로 안전하게 주입한다.

- 라인번호(_line) + 명령어(_keyword)로 대상 검증.
- 해당 라인이 여전히 '빈 PRINTFORM'이 아니면(이미 채워졌거나 어긋남) 건너뛰고 보고.
- 원본 인코딩(UTF-8 BOM) / 줄끝(CRLF) / 들여쓰기(탭) 보존.
- 라인 수를 바꾸지 않는 in-place 치환이라 같은 파일 내 다른 자리에 영향 없음.

사용법:
    python tools/fill-list/apply_fill_list.py                # 기본 엑셀 경로 사용
    python tools/fill-list/apply_fill_list.py <xlsx경로>
    python tools/fill-list/apply_fill_list.py --dry-run      # 미리보기만
"""
import os
import re
import sys

from openpyxl import load_workbook

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ERB_DIR = os.environ.get("FILL_ERB_DIR") or os.path.join(ROOT, "에라마왕 개조판 1.28", "ERB")
DEFAULT_XLSX = os.path.join(ROOT, "에라마왕 개조판 1.28", "_작성필요_대사목록.xlsx")

EMPTY_FORM = re.compile(
    r"^(PRINTFORMW|PRINTFORML|PRINTFORMLC|PRINTFORMC|PRINTFORMK|PRINTFORMD|PRINTSINGLEFORM|PRINTFORM)\s*$"
)
INDENT_RE = re.compile(r"^[ \t]*")

# 헤더 이름 → 열 인덱스 매핑
WANTED = {
    "ID": None, "파일": None, "작성할 대사 ← 여기에 입력": None,
    "_line": None, "_ordinal": None, "_keyword": None,
}


def load_rows(xlsx):
    wb = load_workbook(xlsx, read_only=True, data_only=True)
    ws = wb["작성필요"] if "작성필요" in wb.sheetnames else wb.active
    it = ws.iter_rows(values_only=True)
    header = list(next(it))
    idx = {name: header.index(name) for name in WANTED if name in header}
    for req in ("파일", "작성할 대사 ← 여기에 입력", "_line", "_keyword"):
        if req not in idx:
            raise SystemExit(f"엑셀에 필요한 열이 없습니다: {req}")
    rows = []
    for raw in it:
        if raw is None:
            continue
        text = raw[idx["작성할 대사 ← 여기에 입력"]]
        if text is None or str(text).strip() == "":
            continue
        rows.append({
            "id": raw[idx["ID"]] if "ID" in idx else "",
            "file": raw[idx["파일"]],
            "line": int(raw[idx["_line"]]),
            "keyword": raw[idx["_keyword"]],
            "text": str(text),
        })
    return rows


def apply(xlsx, dry_run=False):
    rows = load_rows(xlsx)
    by_file = {}
    for r in rows:
        by_file.setdefault(r["file"], []).append(r)

    total_ok = total_skip = 0
    report = []

    for fname, frows in by_file.items():
        path = os.path.join(ERB_DIR, fname)
        if not os.path.isfile(path):
            report.append(f"[건너뜀] 파일 없음: {fname} ({len(frows)}건)")
            total_skip += len(frows)
            continue
        with open(path, "rb") as f:
            raw = f.read()
        had_bom = raw.startswith(b"\xef\xbb\xbf")
        arr = raw.decode("utf-8-sig").split("\n")

        changed = 0
        for r in frows:
            i = r["line"] - 1
            if i < 0 or i >= len(arr):
                report.append(f"[건너뜀] {r['id']}: 라인 범위 밖({r['line']})")
                total_skip += 1
                continue
            cur = arr[i]
            has_cr = cur.endswith("\r")
            body = cur[:-1] if has_cr else cur
            m = EMPTY_FORM.match(body.strip())
            if not m:
                report.append(f"[건너뜀] {r['id']}: 대상이 빈 슬롯이 아님 → \"{body.strip()[:30]}\"")
                total_skip += 1
                continue
            if r["keyword"] and m.group(1) != r["keyword"]:
                report.append(f"[건너뜀] {r['id']}: 명령어 불일치({m.group(1)}≠{r['keyword']})")
                total_skip += 1
                continue
            indent = INDENT_RE.match(body).group(0)
            payload = str(r["text"]).replace("\r", "").replace("\n", " ").rstrip()
            new_body = f"{indent}{m.group(1)} {payload}"
            arr[i] = new_body + ("\r" if has_cr else "")
            changed += 1
            total_ok += 1

        if changed and not dry_run:
            out = "\n".join(arr).encode("utf-8")
            if had_bom:
                out = b"\xef\xbb\xbf" + out
            with open(path, "wb") as f:
                f.write(out)
        report.append(f"[{'미리보기' if dry_run else '적용'}] {fname}: {changed}건")

    print("\n".join(report))
    print(f"\n합계: 적용 {total_ok}건 / 건너뜀 {total_skip}건" + (" (dry-run)" if dry_run else ""))


def main():
    args = [a for a in sys.argv[1:]]
    dry = "--dry-run" in args
    args = [a for a in args if a != "--dry-run"]
    xlsx = args[0] if args else DEFAULT_XLSX
    if not os.path.isfile(xlsx):
        raise SystemExit(f"엑셀 없음: {xlsx}")
    apply(xlsx, dry_run=dry)


if __name__ == "__main__":
    main()
