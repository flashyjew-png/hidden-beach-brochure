#!/usr/bin/env python3
"""Print the template xlsx as JSON: {tab: {"header": [...], "rows": [[...], ...], "nonText": [...]}}.
Used by test/sheet-template.test.js. Usage: python3 sheet-template/dump.py [path.xlsx]"""
import json
import sys
from pathlib import Path

from openpyxl import load_workbook

path = sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent / "hidden-beach-brochure.xlsx"
wb = load_workbook(path)
out = {}
for ws in wb.worksheets:
    rows, non_text = [], []
    for row in ws.iter_rows():
        for cell in row:
            if cell.value is not None and (cell.data_type != "s" or cell.number_format != "@"):
                non_text.append(cell.coordinate)
        values = ["" if c.value is None else str(c.value) for c in row]
        if any(values):
            rows.append(values)
    header = [h for h in rows[0] if h] if rows else []
    out[ws.title] = {
        "header": header,
        "rows": [r[: len(header)] for r in rows[1:]],
        "nonText": non_text,
        "frozen": ws.freeze_panes,
        "boldHeader": all(ws.cell(row=1, column=i + 1).font.bold for i in range(len(header))),
    }
json.dump(out, sys.stdout, ensure_ascii=False)
