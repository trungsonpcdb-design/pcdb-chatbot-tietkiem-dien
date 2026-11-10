# Tùy chọn chốt chỉ số thực tế — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép user tick "Có chốt chỉ số ngày 01/11/2026" và nhập sản lượng thực tế TRƯỚC ngày đổi giá, thay vì để tool tự chia theo tỷ lệ ngày — chỉ áp dụng tab Sinh hoạt khi kỳ bắc cầu.

**Architecture:** Thêm field optional `oldKwhOverride?: number` vào `ResidentialInput`. Khi có, `calcResidentialRealistic` dùng trực tiếp làm `oldKwh` thay vì `totalKwh × (oldDays/totalDays)`. Scale ngưỡng bậc vẫn theo tỷ lệ ngày. Component thêm checkbox + 1 input, reactive với `straddles`.

**Tech Stack:** Next.js 16 App Router, React (useState/useEffect/useMemo), TypeScript. Project không có test runner — verify bằng `tsc` (qua `next build`) + manual smoke test ở `/tinh-tien-dien`.

**Spec:** [`docs/superpowers/specs/2026-11-10-residential-meter-reading-override-design.md`](../specs/2026-11-10-residential-meter-reading-override-design.md)

---

## File Structure

- **Modify:** `src/lib/pricing/calculator.ts` — thêm `oldKwhOverride?` vào `ResidentialInput`, dùng nó trong `calcResidentialRealistic` nhánh straddles.
- **Modify:** `src/components/pricing/bill-calculator.tsx` — thêm 2 state, useEffect, validation, UI block, reset.

Không file mới, không migration, không đụng Prisma/API/prompt.

---

## Task 1: Thêm field `oldKwhOverride` vào `ResidentialInput` + dùng trong calculator

**Files:**
- Modify: `src/lib/pricing/calculator.ts` (interface ~dòng 105-110, hàm `calcResidentialRealistic` ~dòng 164-217)

### Step 1.1: Thêm field `oldKwhOverride?` vào interface

- [ ] Mở `src/lib/pricing/calculator.ts`, tìm `export interface ResidentialInput` và sửa:

```ts
export interface ResidentialInput {
  totalKwh: number;
  households: number;
  fromISO: string;
  toISO: string;
  oldKwhOverride?: number; // sản lượng thực tế tiêu thụ TRƯỚC 01/11/2026 (chỉ có tác dụng khi kỳ bắc cầu)
}
```

### Step 1.2: Dùng `oldKwhOverride` trong `calcResidentialRealistic`

- [ ] Trong hàm `calcResidentialRealistic`, nhánh "Kỳ bắc cầu" (sau dòng `// Kỳ bắc cầu: chia theo tỷ lệ ngày`), thay:

```ts
const oldKwh = round(totalKwh * (oldDays / totalDays));
const newKwh = totalKwh - oldKwh;
```

bằng:

```ts
let oldKwh: number;
if (typeof input.oldKwhOverride === "number" && input.oldKwhOverride >= 0) {
  oldKwh = Math.min(Math.max(0, round(input.oldKwhOverride)), totalKwh);
} else {
  oldKwh = round(totalKwh * (oldDays / totalDays));
}
const newKwh = totalKwh - oldKwh;
```

Các dòng sau (tính `oldScale`, `newScale`, build section) **giữ nguyên hoàn toàn** — không đụng.

### Step 1.3: Verify TypeScript compile

- [ ] Chạy: `npx tsc --noEmit`
- [ ] Expected: không có lỗi mới. (Có thể có warnings/errors có sẵn trong project — chỉ cần không phát sinh thêm lỗi liên quan tới `calculator.ts` hoặc file nào import nó.)

### Step 1.4: Commit calculator changes

- [ ] Chạy:

```bash
git add src/lib/pricing/calculator.ts
git commit -m "$(cat <<'EOF'
feat(bill-calc): thêm oldKwhOverride cho ResidentialInput

Cho phép caller cung cấp sản lượng thực tế trước ngày đổi giá
thay vì để calculator tự chia theo tỷ lệ ngày. Chỉ có tác dụng
khi kỳ bắc cầu. Backward-compatible — không truyền thì giữ hành
vi cũ.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: State + useEffect + reset trong `BillCalculator`

**Files:**
- Modify: `src/components/pricing/bill-calculator.tsx`

### Step 2.1: Import `useEffect`

- [ ] Sửa dòng 3:

```ts
import { useEffect, useMemo, useState } from "react";
```

### Step 2.2: Thêm 2 state cho residential meter reading

- [ ] Ngay sau dòng `const [resHouseholds, setResHouseholds] = useState("1");` (khoảng dòng 56), thêm:

```ts
const [resHasMeterReading, setResHasMeterReading] = useState(false);
const [resOldKwh, setResOldKwh] = useState("");
```

### Step 2.3: Thêm useEffect auto-reset khi kỳ chuyển sang không bắc cầu

- [ ] Ngay sau dòng `const straddles = split.straddles;` (khoảng dòng 77), thêm:

```ts
useEffect(() => {
  if (!straddles && resHasMeterReading) {
    setResHasMeterReading(false);
    setResOldKwh("");
  }
}, [straddles, resHasMeterReading]);
```

### Step 2.4: Thêm reset trong hàm `reset()`

- [ ] Trong hàm `reset()` (khoảng dòng 149), ngay sau `setResHouseholds("1");`, thêm:

```ts
setResHasMeterReading(false);
setResOldKwh("");
```

### Step 2.5: Verify compile

- [ ] Chạy: `npx tsc --noEmit`
- [ ] Expected: không có lỗi mới (state chưa được dùng nhưng không gây lỗi).

---

## Task 3: Validation + context string trong `calculate()`

**Files:**
- Modify: `src/components/pricing/bill-calculator.tsx` (hàm `calculate`, nhánh `tab === "residential"` ~dòng 84-94)

### Step 3.1: Thay nhánh residential trong `calculate()`

- [ ] Tìm block:

```ts
if (tab === "residential") {
  const kwh = Number(resKwh);
  if (!Number.isFinite(kwh) || kwh < 0) throw new Error("Nhập tổng điện năng tiêu thụ (kWh) hợp lệ.");
  const households = Math.max(1, Math.floor(Number(resHouseholds) || 1));
  const input = { totalKwh: kwh, households, fromISO: fromDate, toISO: toDate };
  const bills = compareResidentialBills(input, split);
  setOutput({
    bills,
    split,
    context: `Kỳ ${split.totalDays} ngày · ${households} hộ dùng chung công tơ · tổng ${kwh.toLocaleString("vi-VN")} kWh.`,
  });
}
```

- [ ] Thay bằng:

```ts
if (tab === "residential") {
  const kwh = Number(resKwh);
  if (!Number.isFinite(kwh) || kwh < 0) throw new Error("Nhập tổng điện năng tiêu thụ (kWh) hợp lệ.");
  const households = Math.max(1, Math.floor(Number(resHouseholds) || 1));
  const input: ResidentialInput = { totalKwh: kwh, households, fromISO: fromDate, toISO: toDate };
  let oldKwhNote = "";
  if (straddles && resHasMeterReading) {
    const oldKwh = Number(resOldKwh);
    if (!Number.isFinite(oldKwh) || oldKwh < 0) {
      throw new Error("Nhập sản lượng chốt chỉ số ngày 01/11/2026 hợp lệ.");
    }
    if (oldKwh > kwh) {
      throw new Error(
        `Sản lượng chốt chỉ số (${oldKwh.toLocaleString("vi-VN")} kWh) không được lớn hơn tổng (${kwh.toLocaleString("vi-VN")} kWh).`,
      );
    }
    input.oldKwhOverride = oldKwh;
    const newKwh = kwh - oldKwh;
    oldKwhNote = ` · chốt chỉ số 01/11: ${oldKwh.toLocaleString("vi-VN")} kWh trước + ${newKwh.toLocaleString("vi-VN")} kWh sau.`;
  }
  const bills = compareResidentialBills(input, split);
  setOutput({
    bills,
    split,
    context: `Kỳ ${split.totalDays} ngày · ${households} hộ dùng chung công tơ · tổng ${kwh.toLocaleString("vi-VN")} kWh.${oldKwhNote}`,
  });
}
```

### Step 3.2: Thêm import type `ResidentialInput`

- [ ] Trong block import từ `@/lib/pricing/calculator` (khoảng dòng 15-26), thêm `type ResidentialInput` vào danh sách:

```ts
import {
  PRICE_CHANGE_DATE_ISO,
  splitBillingPeriod,
  compareResidentialBills,
  compareProductionBills,
  compareBusinessBills,
  compareAdminBills,
  fmtVnd,
  type BillResult,
  type BillingSplit,
  type BillComparison,
  type ResidentialInput,
} from "@/lib/pricing/calculator";
```

### Step 3.3: Verify compile

- [ ] Chạy: `npx tsc --noEmit`
- [ ] Expected: không có lỗi mới.

---

## Task 4: UI block cho checkbox + input

**Files:**
- Modify: `src/components/pricing/bill-calculator.tsx` (JSX block `tab === "residential"` ~dòng 222-233)

### Step 4.1: Thay block JSX residential bằng block có checkbox

- [ ] Tìm block:

```tsx
{tab === "residential" && (
  <div className="grid gap-3 sm:grid-cols-2">
    <div>
      <label className="text-xs text-slate-600 block mb-1">Tổng điện năng tiêu thụ (kWh)</label>
      <Input type="number" min={0} inputMode="decimal" placeholder="VD: 500" value={resKwh} onChange={(e) => setResKwh(e.target.value)} />
    </div>
    <div>
      <label className="text-xs text-slate-600 block mb-1">Số hộ dùng chung công tơ</label>
      <Input type="number" min={1} step={1} value={resHouseholds} onChange={(e) => setResHouseholds(e.target.value)} />
    </div>
  </div>
)}
```

- [ ] Thay bằng:

```tsx
{tab === "residential" && (
  <>
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="text-xs text-slate-600 block mb-1">Tổng điện năng tiêu thụ (kWh)</label>
        <Input type="number" min={0} inputMode="decimal" placeholder="VD: 500" value={resKwh} onChange={(e) => setResKwh(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-slate-600 block mb-1">Số hộ dùng chung công tơ</label>
        <Input type="number" min={1} step={1} value={resHouseholds} onChange={(e) => setResHouseholds(e.target.value)} />
      </div>
    </div>
    {straddles && (
      <div className="rounded-lg border bg-slate-50/60 p-3">
        <label className="flex items-start gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={resHasMeterReading}
            onChange={(e) => setResHasMeterReading(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <strong>Có chốt chỉ số ngày 01/11/2026</strong>{" "}
            <span className="text-xs text-slate-500">
              (nhập sản lượng thực tế thay vì để hệ thống chia theo tỷ lệ ngày)
            </span>
          </span>
        </label>
        {resHasMeterReading && (
          <div className="mt-3">
            <label className="text-xs text-slate-600 block mb-1">
              Sản lượng chốt chỉ số ngày 01/11/2026 (kWh)
            </label>
            <Input
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="VD: 104"
              value={resOldKwh}
              onChange={(e) => setResOldKwh(e.target.value)}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Phần điện năng tiêu thụ TRƯỚC ngày 01/11/2026 — xem cột &quot;Điện TK&quot; dòng &quot;Chỉ số ngày 01/11/2026&quot; trên hóa đơn PC Điện Biên.
            </p>
          </div>
        )}
      </div>
    )}
  </>
)}
```

### Step 4.2: Verify compile

- [ ] Chạy: `npx tsc --noEmit`
- [ ] Expected: không có lỗi mới. JSX hợp lệ.

### Step 4.3: Commit UI + validation

- [ ] Chạy:

```bash
git add src/components/pricing/bill-calculator.tsx
git commit -m "$(cat <<'EOF'
feat(bill-calc): checkbox chốt chỉ số thực tế cho tab Sinh hoạt

Khi kỳ bắc cầu 01/11/2026, user có thể tick "Có chốt chỉ số" và
nhập sản lượng tiêu thụ TRƯỚC ngày đổi giá. Phần sau tự tính =
tổng − trước. Checkbox auto reset khi kỳ chuyển sang không bắc cầu.
Validation: không âm, không lớn hơn tổng.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Smoke test manual trên `/tinh-tien-dien`

**Files:** không chỉnh file — chỉ chạy dev server và thao tác UI.

### Step 5.1: Start dev server

- [ ] Nếu có `.claude/launch.json`, dùng `preview_start {name: "..."}`. Nếu không, tạo entry hoặc chạy `npm run dev` trong terminal (background). Preview mở `http://localhost:3000/tinh-tien-dien`.

### Step 5.2: Test case 1 — khớp hóa đơn thật PC Điện Biên

- [ ] Vào tab "Sinh hoạt".
- [ ] Nhập: Từ ngày `22/10/2026`, Đến ngày `04/11/2026`, Tổng kWh `117`, Số hộ `1`.
- [ ] Verify banner vàng xuất hiện: "Kỳ 14 ngày. Kỳ BẮC CẦU: 10 ngày áp giá cũ, 4 ngày áp giá mới."
- [ ] Verify checkbox "Có chốt chỉ số ngày 01/11/2026" hiển thị bên dưới.
- [ ] Tick checkbox → input "Sản lượng chốt chỉ số ngày 01/11/2026 (kWh)" hiện ra.
- [ ] Nhập `104` vào input đó.
- [ ] Bấm "Tính toán".
- [ ] Expected ở cột trái "Hóa đơn thực tế":
  - Section cũ (QĐ 1279) — 10 ngày, 104 kWh.
  - Section mới (QĐ 2892) — 4 ngày, 13 kWh.
  - Dòng Bậc 1 QĐ 2892 có kWh = 13, đơn giá = 1.901.
- [ ] Expected context string: `Kỳ 14 ngày · 1 hộ dùng chung công tơ · tổng 117 kWh · chốt chỉ số 01/11: 104 kWh trước + 13 kWh sau.`
- [ ] Verify tổng cộng gần 311.205 đ (có thể chênh vài trăm đồng do rounding bậc — không khớp chính xác hóa đơn thật, nhưng gần).

### Step 5.3: Test case 2 — backward compat (không tick checkbox)

- [ ] Giữ nguyên Từ `22/10/2026`, Đến `04/11/2026`, Tổng `117`, Số hộ `1`.
- [ ] Bỏ tick checkbox (hoặc bấm "Xoá" rồi nhập lại).
- [ ] Bấm "Tính toán".
- [ ] Expected: output giống hệt behavior cũ — oldKwh ≈ `round(117 × 10/14)` = `84` kWh, newKwh = `33` kWh. Context không có đoạn "chốt chỉ số 01/11:".

### Step 5.4: Test case 3 — kỳ không bắc cầu

- [ ] Đổi Từ ngày thành `01/11/2026`, Đến ngày `30/11/2026`.
- [ ] Verify checkbox + input **không hiển thị**.
- [ ] Nếu trước đó đã tick checkbox (từ case 1), verify state đã tự reset về false (không còn lưu "104").
- [ ] Bấm "Tính toán" với tổng `100` kWh → chỉ có section QĐ 2892.

### Step 5.5: Test case 4 — validation errors

- [ ] Quay lại kỳ bắc cầu: Từ `22/10/2026`, Đến `04/11/2026`, Tổng `117`, Số hộ `1`.
- [ ] Tick checkbox, **bỏ trống** ô "Sản lượng chốt chỉ số", bấm "Tính toán".
- [ ] Expected error: "Nhập sản lượng chốt chỉ số ngày 01/11/2026 hợp lệ."
- [ ] Nhập `-10`, bấm "Tính toán" → error "không được âm" (hoặc "hợp lệ" — vì `-10 < 0`).
- [ ] Nhập `200` (lớn hơn tổng 117), bấm "Tính toán" → error "Sản lượng chốt chỉ số (200 kWh) không được lớn hơn tổng (117 kWh)."

### Step 5.6: Test case 5 — edge cases 0 và =tổng

- [ ] Vẫn kỳ bắc cầu, tick checkbox, nhập `0`, bấm "Tính toán".
- [ ] Expected: chỉ có section QĐ 2892 với 117 kWh (section cũ bị skip vì oldKwh = 0).
- [ ] Nhập `117` (= tổng), bấm "Tính toán".
- [ ] Expected: chỉ có section QĐ 1279 với 117 kWh (section mới bị skip vì newKwh = 0).

### Step 5.7: Test mobile viewport

- [ ] Dùng `resize_window {preset: "mobile"}` (375×812) của built-in browser, hoặc DevTools responsive mode.
- [ ] Verify khối checkbox + input render gọn, không vỡ layout, text giải thích wrap tự nhiên.
- [ ] Quay về desktop: `resize_window {preset: "desktop"}`.

### Step 5.8: Screenshot kết quả Test case 1

- [ ] Chụp màn hình kết quả Test case 1 (có 104/13 split hiển thị) để gửi lại cho user.

---

## Self-Review

**Spec coverage:**
- Spec §"Thiết kế UX / Khu vực checkbox" → Task 4 (Step 4.1) ✓
- Spec §"Hành vi reactive" (auto-reset khi kỳ chuyển, reset button) → Task 2 (Step 2.3, 2.4) ✓
- Spec §"Validation" (5 trường hợp) → Task 3 (Step 3.1) + Task 5 (Step 5.5, 5.6) ✓
- Spec §"Hiển thị context" → Task 3 (Step 3.1 — biến `oldKwhNote`) ✓
- Spec §"Thay đổi file calculator.ts" → Task 1 ✓
- Spec §"Thay đổi file bill-calculator.tsx" → Task 2, 3, 4 ✓
- Spec §"Trường hợp test" (6 case) → Task 5 (Step 5.2–5.7) ✓

**Placeholder scan:** không có "TBD", "TODO", "implement later" — mọi step có code đầy đủ hoặc command cụ thể.

**Type consistency:**
- `ResidentialInput` dùng ở calculator.ts (Task 1) và bill-calculator.tsx (Task 3) — khớp signature.
- `oldKwhOverride?: number` — Task 1 định nghĩa, Task 3 gán giá trị.
- `resHasMeterReading`, `resOldKwh` — Task 2 khai báo, Task 3 (validation) + Task 4 (UI) dùng, tên nhất quán.

Không phát hiện mâu thuẫn.
