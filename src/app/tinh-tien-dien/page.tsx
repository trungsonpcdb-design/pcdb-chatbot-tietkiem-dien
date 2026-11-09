import Link from "next/link";
import { BillCalculator } from "@/components/pricing/bill-calculator";

export const metadata = {
  title: "Tính tiền điện — PC Điện Biên",
  description:
    "Công cụ tính hóa đơn tiền điện. Tự xử lý kỳ bắc cầu ngày đổi giá nhà nước 01/11/2026 (QĐ 2892 thay QĐ 1279).",
};

export default function TinhTienDienPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[color:var(--color-evn-blue)] text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">
              Tính tiền điện — PC Điện Biên
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              Tự xử lý kỳ bắc cầu ngày đổi giá nhà nước 01/11/2026 · QĐ 2892/QĐ-BCT ↔ QĐ 1279/QĐ-BCT
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
              <strong>Kỳ bắc cầu 01/11/2026:</strong> chọn "Từ ngày" trước 01/11 và "Đến ngày" sau 01/11 — hệ thống tự tách sản lượng theo tỷ lệ ngày (sinh hoạt) hoặc theo chốt chỉ số (sản xuất/KD/HC-SN).
            </li>
            <li>
              <strong>Sinh hoạt:</strong> nhập tổng kWh + số hộ dùng chung công tơ. Ngưỡng bậc được scale theo số ngày của mỗi giai đoạn (công thức EVN).
            </li>
            <li>
              <strong>Sản xuất / Kinh doanh:</strong> chọn cấp điện áp + loại công tơ (1 biểu giá flat, 3 biểu giá TOU). Nếu kỳ bắc cầu, nhập chốt chỉ số TRƯỚC và SAU ngày 01/11.
            </li>
            <li>
              <strong>Hành chính sự nghiệp:</strong> nhóm y tế–giáo dục hoặc chiếu sáng công cộng, một giá duy nhất không chia khung giờ.
            </li>
            <li>
              Mục <em>So sánh</em> ở cuối cho biết hóa đơn chênh bao nhiêu nếu áp toàn kỳ ở biểu mới vs biểu cũ (chỉ để tham khảo chính sách).
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
