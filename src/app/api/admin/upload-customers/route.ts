import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Regex trích tên xã/phường từ địa chỉ Việt Nam.
const COMMUNE_RE = /(?:^|,)\s*(?:ph[uư]ờng|x[aã])\s+([^,]+?)\s*(?:,|$)/i;

function extractCommune(address: string): string | null {
  if (!address) return null;
  const m = COMMUNE_RE.exec(address);
  return m ? m[1].trim() : null;
}

function toInt(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Math.round(v);
  const s = String(v).replace(/[,\s]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

interface ParsedRow {
  dviqlyCode: string;
  customerCode: string;
  customerName: string;
  address: string;
  commune: string | null;
  consumptionKwh: number;
  totalAmount: number;
  phone: string | null;
  customerType: "INDIVIDUAL" | "ORG";
}

function parseWorkbook(wb: XLSX.WorkBook): { rows: ParsedRow[]; skipped: number } {
  let skipped = 0;
  const rows: ParsedRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const lower = sheetName.toLowerCase();
    const isOrg =
      lower.includes("to chuc") ||
      lower.includes("cq") ||
      lower.includes("tổ chức") ||
      lower.includes("to chức");
    const customerType: "INDIVIDUAL" | "ORG" = isOrg ? "ORG" : "INDIVIDUAL";
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: true });

    // Tìm hàng header
    let headerIdx = -1;
    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i] ?? [];
      if (row.some((c) => typeof c === "string" && c.toLowerCase().includes("mã khách hàng"))) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx < 0) continue;

    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const row = matrix[i] ?? [];
      const dviqly = toStr(row[0]);
      const code = toStr(row[1]);
      const name = toStr(row[2]);
      const address = toStr(row[3]);
      const kwh = toInt(row[4]);
      const money = toInt(row[5]);
      const phone = toStr(row[6]);

      if (!code || !name) {
        if (code || name || address) skipped++;
        continue;
      }

      rows.push({
        dviqlyCode: dviqly,
        customerCode: code,
        customerName: name,
        address,
        commune: extractCommune(address),
        consumptionKwh: kwh,
        totalAmount: money,
        phone: phone || null,
        customerType,
      });
    }
  }

  return { rows, skipped };
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Thiếu file" }, { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "File quá lớn (tối đa 50 MB)" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "buffer" });
  } catch {
    return NextResponse.json({ ok: false, error: "File không phải Excel hợp lệ" }, { status: 400 });
  }

  const { rows, skipped } = parseWorkbook(wb);
  if (rows.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Không trích được dòng dữ liệu nào. Kiểm tra lại cấu trúc file (cần sheet có header "Mã khách hàng").',
      },
      { status: 400 }
    );
  }

  // Dedupe theo customerCode — giữ bản kWh cao nhất
  const byCode = new Map<string, ParsedRow>();
  for (const r of rows) {
    const prev = byCode.get(r.customerCode);
    if (!prev || r.consumptionKwh > prev.consumptionKwh) byCode.set(r.customerCode, r);
  }
  const unique = Array.from(byCode.values());
  const dedupedFromRows = rows.length - unique.length;

  await prisma.highConsumptionCustomer.deleteMany({});

  const BATCH = 500;
  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH);
    await prisma.highConsumptionCustomer.createMany({ data: chunk });
  }

  const [total, indiv, org] = await Promise.all([
    prisma.highConsumptionCustomer.count(),
    prisma.highConsumptionCustomer.count({ where: { customerType: "INDIVIDUAL" } }),
    prisma.highConsumptionCustomer.count({ where: { customerType: "ORG" } }),
  ]);

  return NextResponse.json({
    ok: true,
    total,
    individual: indiv,
    org,
    dedupedFromRows,
    skipped,
  });
}
