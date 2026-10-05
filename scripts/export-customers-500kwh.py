"""
Export danh sách KH ≥500 kWh/tháng từ file Excel sang JSONL.
File JSONL (một JSON object mỗi dòng) phù hợp để stream vào Node seed.

Chạy: python scripts/export-customers-500kwh.py
Input:  tailieu/kichban/8-1 DS KH San Luong Tu 500 kWh Tro Len.xlsx
Output: scripts/.customers-500kwh.jsonl (gitignored, chứa dữ liệu cá nhân)
"""
import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("Cần cài openpyxl: pip install openpyxl")

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "tailieu" / "kichban" / "8-1 DS KH San Luong Tu 500 kWh Tro Len.xlsx"
OUT = ROOT / "scripts" / ".customers-500kwh.jsonl"

# Regex trích tên xã/phường từ địa chỉ Việt Nam.
# Bắt "phường X" hoặc "xã X" hoặc "Phường X" hoặc "Xã X", đến dấu phẩy tiếp theo.
COMMUNE_RE = re.compile(r"(?:^|,)\s*(?:phường|xã|Phường|Xã)\s+([^,]+?)\s*(?:,|$)", re.IGNORECASE)


def extract_commune(address: str) -> str | None:
    if not address:
        return None
    m = COMMUNE_RE.search(address)
    if m:
        return m.group(1).strip()
    return None


def parse_int(v) -> int:
    if v is None or v == "":
        return 0
    if isinstance(v, (int, float)):
        return int(v)
    try:
        return int(str(v).replace(",", "").replace(".", "").strip())
    except ValueError:
        return 0


def clean_str(v) -> str:
    if v is None:
        return ""
    return str(v).strip()


def main() -> None:
    if not XLSX.exists():
        sys.exit(f"Không tìm thấy file Excel: {XLSX}")

    wb = openpyxl.load_workbook(XLSX, data_only=True, read_only=True)
    out_count = 0
    skipped = 0

    with OUT.open("w", encoding="utf-8") as f:
        for sheet_name in wb.sheetnames:
            is_org = "to chuc" in sheet_name.lower() or "cq" in sheet_name.lower() or "tổ chức" in sheet_name.lower()
            customer_type = "ORG" if is_org else "INDIVIDUAL"
            ws = wb[sheet_name]

            # Tìm hàng header: hàng có cell chứa "Mã khách hàng"
            header_row_idx = None
            for i, row in enumerate(ws.iter_rows(values_only=True), 1):
                if any(cell and "mã khách hàng" in str(cell).lower() for cell in row):
                    header_row_idx = i
                    break

            if header_row_idx is None:
                print(f"[WARN] Sheet {sheet_name!r}: không tìm thấy header", file=sys.stderr)
                continue

            for i, row in enumerate(ws.iter_rows(values_only=True), 1):
                if i <= header_row_idx:
                    continue
                if not row or all(c is None or c == "" for c in row):
                    continue
                # Cột theo header: Mã DVIQLY | Mã KH | Tên KH | Địa chỉ | kWh | Tổng tiền | SĐT
                dviqly = clean_str(row[0])
                code = clean_str(row[1])
                name = clean_str(row[2])
                address = clean_str(row[3])
                kwh = parse_int(row[4])
                money = parse_int(row[5])
                phone = clean_str(row[6]) if len(row) > 6 else ""

                if not code or not name:
                    skipped += 1
                    continue

                rec = {
                    "dviqlyCode": dviqly,
                    "customerCode": code,
                    "customerName": name,
                    "address": address,
                    "commune": extract_commune(address),
                    "consumptionKwh": kwh,
                    "totalAmount": money,
                    "phone": phone or None,
                    "customerType": customer_type,
                }
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                out_count += 1

    print(f"Đã xuất {out_count} khách hàng vào {OUT.relative_to(ROOT)} (bỏ qua {skipped} dòng rỗng)")


if __name__ == "__main__":
    main()
