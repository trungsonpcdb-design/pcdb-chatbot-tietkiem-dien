import Link from "next/link";
import { BillCalculator } from "@/components/pricing/bill-calculator";

export const metadata = {
  title: "Tính tiền điện so sánh — PC Điện Biên",
  description:
    "Công cụ tính tiền điện so sánh biểu giá mới QĐ 2892/QĐ-BCT (áp dụng 01/11/2026) với biểu giá cũ QĐ 1279/QĐ-BCT.",
};

export default function TinhTienDienPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[color:var(--color-evn-blue)] text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">
              Tính tiền điện — So sánh biểu giá mới & cũ
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              QĐ 2892/QĐ-BCT (01/11/2026) ↔ QĐ 1279/QĐ-BCT (trước đó) · PC Điện Biên
            </p>
          </div>
          <Link
            href="/chat"
            className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5"
          >
            ← Về chat
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <BillCalculator />

        <section className="mt-6 bg-white rounded-xl border p-4 text-sm text-slate-700 space-y-2">
          <h2 className="font-semibold text-slate-900">Hướng dẫn nhanh</h2>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
            <li>
              <strong>Sinh hoạt:</strong> nhập ngày đầu – cuối kỳ (mặc định 1 tháng), số hộ dùng chung công tơ (khu tập thể nhập số hộ thật), và tổng kWh ghi trên hóa đơn.
            </li>
            <li>
              <strong>Sản xuất / Kinh doanh:</strong> chọn cấp điện áp, nhập sản lượng tách theo 3 khung giờ (nếu công tơ không TOU thì nhập hết vào giờ bình thường).
            </li>
            <li>
              <strong>Hành chính sự nghiệp:</strong> nhóm y tế–giáo dục hoặc chiếu sáng công cộng, một giá duy nhất không chia khung giờ.
            </li>
            <li>
              Dòng <em>Chênh lệch</em> ở cuối cho biết hóa đơn theo giá mới so với giá cũ chênh bao nhiêu (dương = tăng, âm = tiết kiệm).
            </li>
          </ul>
        </section>

        <footer className="text-center text-xs text-slate-500 mt-6 pb-4">
          Công cụ ước tính · Hóa đơn chính thức do PC Điện Biên phát hành ·
          Tổng đài CSKH 1558
        </footer>
      </main>
    </div>
  );
}
