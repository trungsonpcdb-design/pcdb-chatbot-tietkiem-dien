/**
 * Chuẩn hóa text trước khi đưa vào SpeechSynthesis để voice tiếng Việt đọc đúng
 * các ký hiệu đơn vị ngành điện, markdown, link marker nội bộ, emoji.
 *
 * Tất cả thay thế đều dùng từ tiếng Việt thuần (ví dụ: "ki-lô-oát đỉnh" cho
 * kWp, "mét vuông" cho m²) để các voice vi-VN hệ Windows/Android/iOS đọc trôi
 * chảy — không phụ thuộc voice có hỗ trợ phát âm tiếng Anh hay không.
 */
export function normalizeForTts(input: string): string {
  if (!input) return "";
  let s = input;

  // ===== 1. GỠ MARKUP & MARKER NỘI BỘ =====

  // Marker [[DL:url|📥 Nhãn link]] → chỉ giữ nhãn (bỏ URL)
  s = s.replace(/\[\[DL:[^|\]]+\|([^\]]+)\]\]/g, " $1 ");

  // Citation marker [1], [2]...
  s = s.replace(/\[(\d{1,2})\]/g, " ");

  // Markdown emphasis
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/(^|\s)\*([^*\s][^*]*)\*(?=\s|$|[,.!?;:])/g, "$1$2");

  // Heading, blockquote, bullet đầu dòng
  s = s.replace(/^\s*#{1,6}\s+/gm, "");
  s = s.replace(/^\s*>\s+/gm, "");
  s = s.replace(/^\s*[-•*]\s+/gm, "");

  // Emoji và biểu tượng Unicode
  s = s.replace(
    /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{1F100}-\u{1F1FF}]/gu,
    " "
  );

  // ===== 2. SO SÁNH < > TRƯỚC KHI XÓA DẤU =====
  // Phải chạy trước step xóa [ ] < > ở cuối, nếu không "<1 kW" mất ý "dưới 1 kW"
  s = s.replace(/<\s*=?\s*(?=\d)/g, "dưới ");
  s = s.replace(/>\s*=?\s*(?=\d)/g, "trên ");
  s = s.replace(/≥\s*(?=\d)/g, "từ ");
  s = s.replace(/≤\s*(?=\d)/g, "đến tối đa ");

  // ===== 3. ĐƠN VỊ NGÀNH ĐIỆN (symbol dài trước ngắn) =====
  s = s.replace(/kWh\b/g, "ki-lô-oát giờ");
  s = s.replace(/kWp\b/g, "ki-lô-oát đỉnh");
  s = s.replace(/kVA\b/g, "ki-lô vôn am-pe");
  s = s.replace(/\bkV\b/g, "ki-lô vôn");
  s = s.replace(/\bkW\b/g, "ki-lô-oát");
  s = s.replace(/\bMW\b/g, "mê-ga oát");

  // Vôn / Ampe đứng ngay sau số: "220V", "380V", "10A"
  s = s.replace(/(\d)\s*V(?=\b|\/)/g, "$1 vôn");
  s = s.replace(/(\d)\s*A(?=\b|\/)/g, "$1 am-pe");
  s = s.replace(/(\d)\s*Hz\b/g, "$1 héc");

  // Diện tích / thể tích
  s = s.replace(/m²/g, "mét vuông");
  s = s.replace(/m³/g, "mét khối");

  // Nhiệt độ, phần trăm
  s = s.replace(/\s*°C\b/g, " độ C");
  s = s.replace(/%/g, " phần trăm");

  // ===== 4. TIỀN TỆ =====
  // KHÔNG dùng \b trước/sau "VNĐ"/"Đ" vì JS regex \b chỉ xét ASCII word.
  s = s.replace(/(^|[\s(,])VNĐ(?=$|[\s.,);!?])/g, "$1đồng");
  s = s.replace(/\bVND\b/g, "đồng");
  s = s.replace(/₫/g, "đồng");

  // "đ/tháng", "đ/ngày", "đ/kWh"... (sau khi kWh đã bị thay nên dùng cả 2 dạng)
  s = s.replace(
    /(^|[\s\d])đ\s*\/\s*(tháng|ngày|năm|giờ|kWh|ki-lô-oát giờ|m²|mét vuông)/g,
    "$1đồng mỗi $2"
  );

  // ===== 5. KÝ HIỆU KHÁC =====
  // "~5" → "khoảng 5"
  s = s.replace(/~\s*(?=\d)/g, "khoảng ");

  // "→", "⇒", "⟶": chuyển "thành"/"là"
  s = s.replace(/[→⇒⟶]/g, " là ");

  // "/" giữa 2 từ tiếng Việt hoặc giữa unit→thời gian → " mỗi "
  // Chỉ áp dụng khi 2 bên không phải số nguyên của ngày tháng (vd 10/2026)
  // KHÔNG dùng \b vì các từ bắt đầu bằng "đ"/"ki" không có word boundary ASCII
  s = s.replace(
    /(ki-lô-oát giờ|ki-lô-oát đỉnh|ki-lô-oát|đồng|triệu|kWh)\s*\/\s*(tháng|ngày|năm|giờ|kWh|ki-lô-oát giờ|m²|mét vuông)/g,
    "$1 mỗi $2"
  );

  // ===== 6. DỌN DẤU & WHITESPACE CÒN LẠI =====
  s = s.replace(/[\[\]<>|…"]/g, " ");
  s = s.replace(/\s{2,}/g, " ").trim();

  return s;
}
