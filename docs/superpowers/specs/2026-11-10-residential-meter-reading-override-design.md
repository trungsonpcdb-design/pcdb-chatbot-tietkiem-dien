# Thiết kế: Tùy chọn "chốt chỉ số thực tế" cho hóa đơn sinh hoạt bắc cầu

**Ngày**: 2026-11-10
**Trạng thái**: Draft (chờ review)
**Tác giả**: Trung Sơn · Claude Opus 4.7
**Phạm vi**: `/tinh-tien-dien` — tab Sinh hoạt khi kỳ bắc cầu ngày 01/11/2026

## Bối cảnh

Trang `/tinh-tien-dien` hiện tự chia tổng kWh theo **tỷ lệ ngày** khi kỳ bắc cầu
(ngày đổi giá 01/11/2026 nằm giữa "Từ ngày" và "Đến ngày"). Ví dụ kỳ 14 ngày
(22/10 → 04/11) tổng 117 kWh → tool chia `oldKwh = 117 × 10/14 ≈ 84` và
`newKwh ≈ 33`.

Nhưng hóa đơn PC Điện Biên thực tế **chốt chỉ số công tơ tại ngày 01/11/2026**,
nên số thực là **104 kWh trước** (10 ngày đầu, chỉ số 15.048 → 15.152) và
**13 kWh sau** (4 ngày sau, 15.152 → 15.165). Phần sai lệch này làm kết quả
tool ước tính không khớp hóa đơn thật khi khách hàng có chốt chỉ số đúng ngày đổi giá.

Luồng Sản xuất / Kinh doanh / HC-SN đã có sẵn 2 ô "SL trước / SL sau" để nhập
chốt chỉ số thực. Sinh hoạt thì chưa — vì phần lớn khách hàng sinh hoạt không
có chốt chỉ số đúng ngày đổi giá, mặc định chia tỷ lệ ngày là đủ. Nhưng với
những khách hàng có chốt (như ví dụ hóa đơn trên), cần cho phép nhập số thật.

## Mục tiêu

Thêm một checkbox tùy chọn cho tab Sinh hoạt, chỉ hiện khi kỳ bắc cầu. Khi
tick, cho phép người dùng nhập **1 ô duy nhất** — sản lượng tiêu thụ **trước**
ngày đổi giá. Phần sau tự tính bằng hiệu `tổng − trước`.

Khi không tick → giữ nguyên hành vi chia tỷ lệ ngày hiện tại (backward-compatible).

## Non-goals

- Không đụng tab Sản xuất / Kinh doanh / HC-SN.
- Không đụng cột "100% áp giá cũ QĐ 1279" (vẫn tính trên tổng kWh, không split).
- Không thay công thức scale ngưỡng bậc (vẫn scale theo số ngày của mỗi giai đoạn).
- Không đụng Prisma schema, API `/api/chat`, prompt LLM.
- Không thay đổi output table, VAT, styling.

## Thiết kế UX

### Khu vực checkbox

Vị trí: trong tab Sinh hoạt, ngay dưới hàng `[Tổng kWh] [Số hộ dùng chung]`,
chỉ render khi `split.straddles === true`.

```
[Tổng điện năng tiêu thụ (kWh)]   [Số hộ dùng chung công tơ]

[☐] Có chốt chỉ số ngày 01/11/2026
    (nhập sản lượng thực tế thay vì để hệ thống chia theo tỷ lệ ngày)

    └── khi tick ─► [Sản lượng chốt chỉ số ngày 01/11/2026 (kWh)]
                   help text: "Phần điện năng tiêu thụ TRƯỚC ngày 01/11/2026.
                              Xem cột 'Điện TK' dòng 'Chỉ số ngày 01/11/2026'
                              trên hóa đơn PC Điện Biên."
```

### Hành vi reactive

- Kỳ chuyển từ bắc cầu → không bắc cầu: auto bỏ tick + xóa input.
- User bỏ tick: ẩn input + xóa giá trị đã nhập.
- Nút "Xoá": reset luôn cả checkbox + input chốt.

### Validation khi bấm "Tính toán"

Chỉ chạy khi `straddles && hasMeterReading`:

| Trường hợp | Xử lý |
|---|---|
| Input rỗng hoặc không phải số | Error: "Nhập sản lượng chốt chỉ số ngày 01/11/2026 hợp lệ." |
| `oldKwh < 0` | Error: "Sản lượng chốt chỉ số không được âm." |
| `oldKwh > totalKwh` | Error: "Sản lượng chốt chỉ số (X kWh) không được lớn hơn tổng (Y kWh)." |
| `oldKwh === totalKwh` | OK — section "mới" sẽ tự skip vì `newKwh = 0`. |
| `oldKwh === 0` | OK — section "cũ" sẽ tự skip vì `oldKwh = 0`. |

### Hiển thị context

Sau khi tính xong, dòng context in nghiêng dưới nút "Tính toán":

- Không tick: `Kỳ 14 ngày · 1 hộ dùng chung công tơ · tổng 117 kWh.` (như hiện tại)
- Có tick: `Kỳ 14 ngày · 1 hộ dùng chung công tơ · tổng 117 kWh · chốt chỉ số 01/11: 104 kWh trước + 13 kWh sau.`

Banner vàng "Kỳ BẮC CẦU" phía trên giữ nguyên.

## Thiết kế logic

### Thay đổi file `src/lib/pricing/calculator.ts`

**Thay đổi 1** — thêm field optional vào `ResidentialInput`:

```ts
export interface ResidentialInput {
  totalKwh: number;
  households: number;
  fromISO: string;
  toISO: string;
  oldKwhOverride?: number; // mới
}
```

Ý nghĩa: nếu có giá trị, dùng trực tiếp làm `oldKwh` thay vì tính từ tỷ lệ ngày.
Chỉ có tác dụng khi `split.straddles === true`.

**Thay đổi 2** — trong `calcResidentialRealistic`, nhánh straddles:

```ts
// Trước:
const oldKwh = round(totalKwh * (oldDays / totalDays));
const newKwh = totalKwh - oldKwh;

// Sau:
let oldKwh: number;
if (typeof input.oldKwhOverride === "number" && input.oldKwhOverride >= 0) {
  oldKwh = Math.min(Math.max(0, round(input.oldKwhOverride)), totalKwh);
} else {
  oldKwh = round(totalKwh * (oldDays / totalDays));
}
const newKwh = totalKwh - oldKwh;
```

Phần build section (scale factor ngưỡng bậc, allocate vào bậc) **giữ nguyên** —
scale vẫn theo `oldDays/totalDays * households` và `newDays/totalDays * households`
vì ngưỡng bậc là định mức thời gian.

### Không đổi

- `calcResidentialAllOld` / `calcResidentialHypothetical` — cột "100% QĐ 1279"
  không cần biết split.
- `splitBillingPeriod` — vẫn trả `oldDays/newDays` tính từ ngày tháng.
- `compareResidentialBills` — truyền input nguyên vẹn vào `calcResidentialRealistic`,
  override chảy qua tự nhiên.

### Thay đổi file `src/components/pricing/bill-calculator.tsx`

Thêm 2 state ở đầu component:

```ts
const [resHasMeterReading, setResHasMeterReading] = useState(false);
const [resOldKwh, setResOldKwh] = useState("");
```

Thêm `useEffect` reset khi kỳ chuyển không bắc cầu:

```ts
useEffect(() => {
  if (!straddles && resHasMeterReading) {
    setResHasMeterReading(false);
    setResOldKwh("");
  }
}, [straddles]);
```

Trong nhánh `tab === "residential"` của `calculate()`:

```ts
const input: ResidentialInput = {
  totalKwh: kwh,
  households,
  fromISO: fromDate,
  toISO: toDate,
};
if (straddles && resHasMeterReading) {
  const oldKwh = Number(resOldKwh);
  if (!Number.isFinite(oldKwh) || oldKwh < 0) {
    throw new Error("Nhập sản lượng chốt chỉ số ngày 01/11/2026 hợp lệ.");
  }
  if (oldKwh > kwh) {
    throw new Error(
      `Sản lượng chốt chỉ số (${oldKwh.toLocaleString("vi-VN")} kWh) ` +
      `không được lớn hơn tổng (${kwh.toLocaleString("vi-VN")} kWh).`
    );
  }
  input.oldKwhOverride = oldKwh;
}
const bills = compareResidentialBills(input, split);
```

Context string bổ sung nhánh chốt chỉ số:

```ts
let context = `Kỳ ${split.totalDays} ngày · ${households} hộ dùng chung công tơ · tổng ${kwh.toLocaleString("vi-VN")} kWh.`;
if (straddles && resHasMeterReading) {
  const o = input.oldKwhOverride ?? 0;
  const n = kwh - o;
  context += ` · chốt chỉ số 01/11: ${o.toLocaleString("vi-VN")} kWh trước + ${n.toLocaleString("vi-VN")} kWh sau.`;
}
```

Trong JSX khu vực residential, thêm block sau 2 ô Tổng/Số hộ, trong điều kiện `straddles`:

```tsx
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
          Phần điện năng tiêu thụ TRƯỚC ngày 01/11/2026 — xem cột "Điện TK" dòng
          "Chỉ số ngày 01/11/2026" trên hóa đơn PC Điện Biên.
        </p>
      </div>
    )}
  </div>
)}
```

Trong `reset()` thêm 2 dòng:

```ts
setResHasMeterReading(false);
setResOldKwh("");
```

## Trường hợp test (manual smoke)

1. **Khớp ví dụ ảnh 2 (hóa đơn thật)**:
   - Tab Sinh hoạt, từ 22/10/2026 đến 04/11/2026, 117 kWh, 1 hộ.
   - Tick checkbox, nhập 104.
   - Expected: section cũ 104 kWh (áp QĐ 1279), section mới 13 kWh (áp QĐ 2892).
     Tổng gần với con số 311.205 đ trên hóa đơn thật (chênh nhẹ do rounding bậc).

2. **Backward-compat: không tick checkbox**:
   - Tab Sinh hoạt, cùng kỳ 22/10 → 04/11, 117 kWh.
   - Không tick.
   - Expected: output giống hệt trước khi có feature (chia 10/14 và 4/14).

3. **Kỳ không bắc cầu**:
   - Từ 01/11 đến 30/11 (toàn kỳ giá mới).
   - Expected: checkbox KHÔNG hiển thị. Nếu từng tick (ở kỳ trước) thì auto bỏ.

4. **Edge: oldKwh = 0**:
   - Tick, nhập 0, tổng 117.
   - Expected: chỉ hiện section mới 117 kWh.

5. **Edge: oldKwh = totalKwh**:
   - Tick, nhập 117, tổng 117.
   - Expected: chỉ hiện section cũ 117 kWh.

6. **Validation**:
   - Tick, nhập 200, tổng 117 → error "không được lớn hơn tổng".
   - Tick, bỏ trống input → error "nhập... hợp lệ".
   - Tick, nhập −10 → error "không được âm".

## Rủi ro

- **User nhầm giữa "sản lượng trước" và "sản lượng sau"**: nhập 13 thay vì 104.
  Mitigation: help text rõ ràng + placeholder gợi ý số lớn.
- **Mobile layout**: checkbox + input cần hiển thị đúng ở màn hình hẹp. Dùng
  `rounded-lg border p-3` khối riêng nên tự responsive. Xác nhận bằng viewport
  360px khi test.
- **Scale ngưỡng bậc có thể vẫn chưa khớp EVN chính xác**: đã biết hiện tại tool
  dùng `oldDays/totalDays`, EVN có thể dùng `oldDays/30` hoặc `oldDays/daysInMonth`.
  **Không nằm trong scope** feature này — xem lại ở một spec riêng nếu cần.

## Phạm vi diff ước tính

- `src/lib/pricing/calculator.ts`: ~10 dòng.
- `src/components/pricing/bill-calculator.tsx`: ~40 dòng (state + useEffect + JSX block + validation + context).
- Tổng: ~50 dòng, không file mới, không migration.
