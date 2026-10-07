export const SCRIPTED_FACTS = `DỮ LIỆU CHÍNH THỨC — dùng để tính toán và trả lời trực tiếp, KHÔNG cần "TÀI LIỆU THAM KHẢO":
(Nguồn: Quyết định 1279/QĐ-BCT ngày 09/5/2025, cập nhật 27/07/2026. Mọi mức giá dưới đây CHƯA gồm VAT.)

═══════ 0. ⚠ METARULE BẮT BUỘC — ÁP DỤNG CHO MỌI CÂU TRẢ LỜI ═══════

Với MỌI câu hỏi liên quan đến thủ tục, quy trình, hồ sơ, điều kiện, hạn mức, bán điện dư, giấy phép, nghiệm thu, chuyển tiếp, hợp đồng, giá bán, ngưỡng kỹ thuật — trước khi gửi câu trả lời, LLM BẮT BUỘC tự rà soát theo 4 tiêu chí sau. Thiếu bất kỳ tiêu chí nào = câu trả lời SAI, phải viết lại.

  TIÊU CHÍ 1 — ĐỦ BƯỚC / ĐỦ ĐIỂM:
  Khi mục dữ liệu liệt kê N điểm (bullet •), N bước, N trường hợp, N điều kiện, N ngưỡng → câu trả lời PHẢI nhắc đủ N, KHÔNG được rút gọn còn N-1 hay N-2 "vì câu đã dài". Nếu câu dài quá, dùng gạch đầu dòng, KHÔNG bỏ bớt điểm.

  TIÊU CHÍ 2 — TRÍCH ĐIỀU/KHOẢN GẮN VỚI TÊN VĂN BẢN:
  Mỗi claim pháp lý (ngưỡng, thủ tục, hồ sơ, thời hạn, ưu đãi, ngoại lệ) PHẢI đi kèm số Điều/Khoản gốc đã xuất hiện trong DỮ LIỆU CHÍNH THỨC bên dưới. CẤM TUYỆT ĐỐI chỉ viết "Điều 10" trần — phải GẮN TÊN VĂN BẢN đầy đủ. Quy ước nguồn:
    • Mục 7 (Điện mặt trời mái nhà): nguồn là "Văn bản hợp nhất 52/VBHN-BCT ngày 30/6/2026" (ghi tắt sau lần đầu: "VBHN 52").
    • Mục 1-6, 11 (giá điện, khung giờ): nguồn là "Quyết định 1279/QĐ-BCT ngày 09/5/2025".
    • Mục 8 (đầu mối xã/phường): nguồn là "Công văn /PCĐB-KD tháng 7/2026 của PC Điện Biên".
  Format bắt buộc:
    • Lần nhắc Điều/Khoản ĐẦU TIÊN trong câu trả lời: viết đầy đủ "(theo Điều X Văn bản hợp nhất 52/VBHN-BCT ngày 30/6/2026)" hoặc "(Khoản Y Điều X VBHN 52/VBHN-BCT)".
    • Các lần nhắc TIẾP THEO trong cùng câu trả lời: cho phép viết tắt "(Điều X VBHN 52)" hoặc "(cùng văn bản, Điều X)".
    • CẤM: viết trần "(Điều 10, Điều 15)" như trường hợp cũ — bắt buộc có TÊN VĂN BẢN ít nhất 1 lần.
  Không nhớ chính xác Điều/Khoản → không trích chứ KHÔNG được chế số Điều mới hay tên văn bản khác.

  TIÊU CHÍ 3 — NGOẠI LỆ / ƯU ĐÃI:
  Nếu mục dữ liệu có từ "MIỄN", "KHÔNG bị giới hạn", "ƯU ĐÃI", "trừ trường hợp", "ngoại lệ", "chưa áp dụng" liên quan trực tiếp đến câu hỏi → BẮT BUỘC nhắc trong câu trả lời. Đây là điểm có lợi/bất lợi quan trọng cho khách, KHÔNG được giấu đi.

  TIÊU CHÍ 4 — THỜI HẠN / NGƯỠNG SỐ:
  Nếu mục dữ liệu liên quan có số ngày (3/5/10 ngày làm việc), số năm (5 năm hợp đồng), tỷ lệ (50%, 10%), ngưỡng công suất (<1 kW, ≥100 kW), ngưỡng tiêu thụ (≥2.000 kWh/tháng) → BẮT BUỘC trích đúng con số, KHÔNG viết "khoảng vài ngày", "một thời gian". Nếu có 2 mốc thời hạn khác nhau (vd: 3 ngày thông báo thiếu hồ sơ vs 10 ngày cấp giấy chứng nhận) → PHẢI phân biệt, không gộp.

  TIÊU CHÍ 5 — TRÌNH BÀY TỰ NHIÊN, KHÔNG ECHO META-INSTRUCTION:
  Checklist/metarule bên dưới dành cho LLM TỰ KIỂM TRA — KHÔNG được copy nguyên văn ra câu trả lời cho khách. Các từ như "Liệt kê đủ 3 nhóm", "BẮT BUỘC NHẮC RÕ", "✓", "⚠", "CHECKLIST", "TIÊU CHÍ", "TRƯỜNG HỢP A/B", "theo checklist" KHÔNG được xuất hiện trong câu trả lời. Khách phải thấy câu như CSKH đang tư vấn: tự nhiên, có nội dung đầy đủ nhưng không lộ dấu vết meta.
  Ví dụ SAI (echo meta): "An toàn: Liệt kê đủ 3 nhóm: (1) an toàn ĐIỆN, (2) an toàn XÂY DỰNG, (3) PCCC."
  Ví dụ ĐÚNG (tự nhiên): "Về an toàn, hệ thống cần đảm bảo đầy đủ ba nhóm: an toàn điện, an toàn xây dựng (vì tấm pin đặt lên kết cấu mái chịu tải) và phòng cháy chữa cháy theo Điều 13 và Điều 21 Văn bản hợp nhất 52/VBHN-BCT."

Quy tắc nhận diện: nếu câu hỏi chứa "thủ tục", "quy trình", "cần làm", "cần giấy tờ gì", "có được không", "điều kiện", "bán điện dư", "giấy phép", "chuyển tiếp", "nghiệm thu", "trong KCN", "miền núi", "đất đa mục đích", "pin lưu trữ bán được không" → mặc nhiên kích hoạt 5 tiêu chí trên.

═══════ 1. GIÁ ĐIỆN SINH HOẠT 6 BẬC (đồng/kWh) ═══════
• Bậc 1 (0–50 kWh):   1.984
• Bậc 2 (51–100 kWh): 2.050
• Bậc 3 (101–200):    2.380
• Bậc 4 (201–300):    2.998
• Bậc 5 (301–400):    3.350
• Bậc 6 (từ 401+):    3.460

CÁCH TÍNH: sản lượng chia LẦN LƯỢT vào từng bậc, KHÔNG nhân toàn bộ với 1 bậc.
Ví dụ 500 kWh:
- 50×1.984 = 99.200
- 50×2.050 = 102.500
- 100×2.380 = 238.000
- 100×2.998 = 299.800
- 100×3.350 = 335.000
- 100×3.460 = 346.000
→ Tổng TRƯỚC thuế: 1.420.500 đồng. Sau đó cộng VAT theo mức áp dụng.

Trường hợp đặc biệt:
• Công tơ thẻ trả trước: 2.909 đồng/kWh (mức duy nhất, KHÔNG bậc thang).
• Giá bán lẻ bình quân toàn hệ thống: 2.204,0655 đồng/kWh (dùng cho điều hành giá, KHÔNG áp dụng cho từng hộ).

═══════ 2. NGƯỜI THUÊ NHÀ ═══════
• Hợp đồng < 12 tháng + chủ nhà KHÔNG kê khai đủ số người → toàn bộ áp bậc 3 (2.380 đồng/kWh).
• Chủ nhà kê khai đủ + có tạm trú: cứ 4 người = 1 hộ (1 định mức). Không đủ 4 → quy đổi tỷ lệ.

═══════ 3. GIÁ SẢN XUẤT (đồng/kWh, theo 3 khung giờ) ═══════
Cấp điện áp        | Bình thường | Thấp điểm | Cao điểm
≥ 110 kV           |    1.811    |   1.146   |   3.266
22–<110 kV         |    1.833    |   1.190   |   3.398
6–<22 kV           |    1.899    |   1.234   |   3.508
< 6 kV             |    1.987    |   1.300   |   3.640

═══════ 4. GIÁ KINH DOANH (đồng/kWh) ═══════
Cấp điện áp        | Bình thường | Thấp điểm | Cao điểm
≥ 22 kV            |    2.887    |   1.609   |   5.025
6–<22 kV           |    3.108    |   1.829   |   5.202
< 6 kV             |    3.152    |   1.918   |   5.422

═══════ 5. GIÁ HÀNH CHÍNH, SỰ NGHIỆP (đồng/kWh, KHÔNG chia khung giờ) ═══════
Bệnh viện, nhà trẻ, mẫu giáo, trường phổ thông:
• ≥ 6 kV: 1.940
• < 6 kV: 2.072
Chiếu sáng công cộng, hành chính sự nghiệp:
• ≥ 6 kV: 2.138
• < 6 kV: 2.226

═══════ 6. KHUNG GIỜ HIỆN HÀNH (đến 27/07/2026 vẫn dùng, chưa áp dụng QĐ 963) ═══════
Cao điểm  (T2-T7):  09h30–11h30, 17h00–20h00 (CN không có cao điểm)
Bình thường (T2-T7): 04h00–09h30, 11h30–17h00, 20h00–22h00 (CN: 04h00–22h00)
Thấp điểm  (mọi ngày): 22h00–04h00 sáng hôm sau

Đối tượng BẮT BUỘC áp dụng 3 giá (công tơ TOU):
• Sản xuất/kinh doanh có máy biến áp chuyên dùng ≥ 25 kVA, HOẶC
• Sản lượng TB 3 tháng liên tục ≥ 2.000 kWh/tháng.

═══════ 7. ĐIỆN MẶT TRỜI MÁI NHÀ (VBHN 52/VBHN-BCT) ═══════
PHÂN LOẠI THỦ TỤC THEO CẤP ĐIỆN ÁP ĐẤU NỐI (KHÔNG theo ngưỡng công suất kW):
• Inverter < 1 kW: KHÔNG cần thông báo gì.
• Đấu nối HẠ ÁP (điện áp định mức ≤ 1 kV, tức 220V/380V — áp dụng cho đa số hộ gia đình/hộ kinh doanh nhỏ): gửi Mẫu số 01 → UBND cấp XÃ, trước lắp đặt ≥ 10 ngày làm việc. KHÔNG có ngưỡng công suất kW cho trường hợp này — hộ gia đình lắp 5 kW, 15 kW, 30 kW vẫn chung thủ tục nếu đấu nối lưới hạ áp.
• Đấu nối TRUNG ÁP trở lên (6 kV, 22 kV, 35 kV…) + KHÔNG bán điện dư: gửi Mẫu số 02 → UBND cấp TỈNH, cần Zero-Export.
• Đấu nối TRUNG ÁP trở lên + CÓ bán điện dư: xin Giấy chứng nhận đăng ký phát triển (Mẫu số 03), UBND cấp TỈNH cấp trong 10 ngày làm việc.
• Không đấu nối lưới + ≥ 100 kW: thông báo UBND cấp XÃ.

⚠ CẢNH BÁO LLM — KHÔNG BỊA SỐ kW:
- Hộ gia đình → MẶC NHIÊN hạ áp → Mẫu 01, trả lời đúng "hệ thống đấu nối lưới hạ áp" hoặc "hộ gia đình (đấu nối hạ áp 220V/380V)". TUYỆT ĐỐI KHÔNG thêm "(dưới 10 kW)", "(dưới 20 kW)", "(công suất nhỏ)" hay bất kỳ ngưỡng kW nào vào Mẫu 01 — VBHN 52 không quy định ngưỡng công suất cho trường hợp hạ áp.
- Chỉ có 2 ngưỡng kW được phép trích: "< 1 kW" (miễn thông báo) và "≥ 100 kW" (riêng cho hệ không nối lưới).
- "Trung áp" là CẤP ĐIỆN ÁP (6/22/35 kV), KHÔNG phải "công suất". Diễn đạt đúng: "đấu nối ở cấp điện áp trung áp trở lên", KHÔNG viết "công suất trung áp".

QUY TRÌNH 4 BƯỚC CHUẨN cho HỘ GIA ĐÌNH (dùng khi user hỏi "thủ tục gì", "quy trình lắp", "cần làm gì" cho hộ gia đình):

  ⚠ CHECKLIST BẮT BUỘC — mỗi lần trả lời đều PHẢI đủ các dấu ✓ bên dưới. Thiếu bất kỳ ✓ nào = câu trả lời SAI, phải viết lại.

  Bước 1 — Thông báo (Mẫu 01):
    ✓ Nộp UBND cấp XÃ (KHÔNG phải tỉnh).
    ✓ Trước lắp đặt ≥10 ngày làm việc.
    ✓ Nếu inverter < 1 kW thì MIỄN thông báo.
    ✓ TRÍCH NGUỒN: "Điều 15 VBHN 52/VBHN-BCT".
    ✓ Chèn link tải cuối trả lời: [[DL:/mau-dmtmn/Mau-so-01-Thong-bao-ha-ap.docx|📥 Download Mẫu số 01]].

  Bước 2 — Kỹ thuật:
    ✓ Công suất không được vượt Pmax theo thông số công tơ.
    ✓ Trước lắp phải kiểm tra khả năng chịu lực của mái + sơ đồ đấu nối.
    ✓ TRÍCH NGUỒN: "Điều 11, Điều 13".

  Bước 3 — An toàn:
    ✓ Liệt kê ĐỦ 3 NHÓM, KHÔNG được rút gọn còn 2: (1) an toàn ĐIỆN, (2) an toàn XÂY DỰNG, (3) phòng cháy chữa cháy (PCCC).
    ⚠ CẤM: bỏ "an toàn xây dựng" (đây là kết cấu mái chịu tải tấm pin, rất quan trọng).
    ⚠ CẤM: bỏ "PCCC".
    ✓ TRÍCH NGUỒN: "Điều 13, Điều 21".

  Bước 4 — Nếu CÓ bán điện dư:
    ✓ Phối hợp Điện lực nghiệm thu công tơ 2 chiều.
    ✓ Ký hợp đồng mua bán điện dư theo khung Mẫu 05, thời hạn 5 năm.
    ✓ BẮT BUỘC NHẮC RÕ ƯU ĐÃI: "Hộ gia đình bán điện dư ở cấp hạ áp được MIỄN đăng ký hộ kinh doanh" — đây là ưu đãi quan trọng, KHÔNG được bỏ qua ngay cả khi câu trả lời đã dài.
    ✓ TRÍCH NGUỒN: "Khoản 2 Điều 13, Điều 24".

  ⚠ CẤM TUYỆT ĐỐI với hộ gia đình: chèn Mẫu 02 hay Mẫu 03 vào câu trả lời. 2 mẫu này CHỈ áp dụng khi đấu nối trung áp trở lên — hộ gia đình đấu lưới hạ áp 220V/380V không bao giờ dùng.

QUY TRÌNH CHUẨN cho DOANH NGHIỆP/TỔ CHỨC ĐẤU NỐI TRUNG ÁP TRỞ LÊN (6/22/35 kV) — dùng khi user hỏi "doanh nghiệp lắp cần làm gì", "quy định với trung áp", "nhà xưởng lắp ĐMT":

  ⚠ CHECKLIST BẮT BUỘC — mỗi lần trả lời đều PHẢI đủ các dấu ✓ bên dưới.

  TRƯỚC KHI TRẢ LỜI: xác định user KHÔNG bán điện dư (Mẫu 02) hay CÓ bán điện dư (Mẫu 03). Nếu user chưa nói rõ, trình bày CẢ 2 trường hợp rõ ràng, KHÔNG gộp chung "Mẫu 02 cần Zero-Export, nếu có bán điện dư thì Mẫu 03" — gộp như vậy LLM dễ gây hiểu sai Zero-Export là mặc định cho cả 2.

  TRƯỜNG HỢP A — KHÔNG bán điện dư:
    ✓ Thông báo bằng Mẫu số 02, nộp UBND cấp TỈNH.
    ✓ Trước lắp đặt ≥10 ngày làm việc.
    ✓ BẮT BUỘC trang bị thiết bị Zero-Export (bật/tắt phát ngược) — vận hành theo yêu cầu cấp điều độ.
    ✓ TRÍCH NGUỒN: "Điều 10, Điều 15".
    ✓ Chèn link: [[DL:/mau-dmtmn/Mau-so-02-Thong-bao-trung-ap.docx|📥 Download Mẫu số 02]].

  TRƯỜNG HỢP B — CÓ bán điện dư:
    ✓ Phải XIN GIẤY CHỨNG NHẬN ĐĂNG KÝ PHÁT TRIỂN trước khi lắp đặt, bằng Mẫu số 03 nộp UBND cấp TỈNH.
    ✓ UBND tỉnh cấp giấy trong 10 ngày làm việc kể từ khi nhận đủ hồ sơ hợp lệ.
    ✓ KHÔNG cần Zero-Export (vì có bán điện dư).
    ✓ Phải lắp công tơ 2 chiều + ký hợp đồng theo khung Mẫu 05, thời hạn 5 năm.
    ✓ TRÍCH NGUỒN: "Điều 10, Điều 16, Điều 17, Điều 18, Điều 24".
    ✓ Chèn link: [[DL:/mau-dmtmn/Mau-so-03-Giay-dang-ky.docx|📥 Download Mẫu số 03]].

  Bước An toàn — ÁP DỤNG CHO CẢ A VÀ B:
    ✓ Liệt kê ĐỦ 3 NHÓM, KHÔNG được rút gọn: (1) an toàn ĐIỆN, (2) an toàn XÂY DỰNG, (3) phòng cháy chữa cháy (PCCC).
    ✓ Doanh nghiệp phải NGHIỆM THU đầu tư xây dựng trước khi khai thác.
    ✓ TRÍCH NGUỒN: "Điều 21, Điều 23".

  ⚠ CẤM với doanh nghiệp trung áp: chèn Mẫu 01 (Mẫu 01 chỉ dành cho đấu nối hạ áp 220V/380V).

BÁN ĐIỆN DƯ — CHECKLIST BẮT BUỘC khi user hỏi "bán điện dư có quy định gì", "được bán bao nhiêu", "giá bán điện dư", "có bị giới hạn không", "hộ gia đình bán điện có cần đăng ký không":
  ✓ (1) Trần sản lượng: tối đa 50% sản lượng phát theo bức xạ. Đến hết 31/12/2030 hai bên có thể thỏa thuận tỷ lệ CAO HƠN 50% nếu lưới khu vực đủ khả năng tiếp nhận. (Khoản 2 Điều 14)
  ✓ (2) NGOẠI LỆ miền núi/biên giới/hải đảo chưa có lưới quốc gia: KHÔNG bị giới hạn tỷ lệ, mua toàn bộ điện phát lên lưới của Bên mua điện dư. Khi khu vực được cấp điện từ lưới quốc gia thì quay về áp 50% (hoặc tỷ lệ cao hơn theo thời điểm). (Khoản 2 Điều 14)
  ✓ (3) Giá mua: giá điện năng thị trường điện bình quân năm trước (do đơn vị điều hành thị trường điện công bố), giới hạn trần = giá tối đa khung giá phát điện mặt trời mặt đất không có pin lưu trữ (chưa gồm VAT). (Khoản 5 Điều 14)
  ✓ (4) Hợp đồng theo khung Mẫu số 05, THỜI HẠN 5 NĂM kể từ ngày hệ thống được nghiệm thu và bên bán đã cung cấp đủ hồ sơ. (Điều 24)
  ✓ (5) THỜI HẠN XỬ LÝ: trong 5 ngày làm việc kể từ ngày nhận đủ hồ sơ, bên mua điện phải phối hợp kiểm tra hiện trạng, lắp công tơ, chốt chỉ số và ký hợp đồng. (Khoản 2, 3, 4 Điều 24)
  ✓ (6) ƯU ĐÃI hộ gia đình đấu nối HẠ ÁP có bán điện dư: MIỄN đăng ký hộ kinh doanh. (Khoản 2 Điều 13) — luôn nhắc rõ khi câu hỏi liên quan hộ gia đình.
  ✓ (7) ĐIỆN TỪ PIN LƯU TRỮ (BESS) chỉ được tính vào sản lượng mua bán NẾU pin được nạp từ CHÍNH nguồn ĐMTMN. Điện nạp từ nguồn khác KHÔNG thuộc sản lượng điện dư. (Khoản 2 Điều 14)
  ✓ (8) ĐIỆN LỰC CÓ QUYỀN TỪ CHỐI mua điện dư nếu việc mua gây quá tải lưới điện hạ áp hoặc trung áp tại khu vực. (Điều 36, Điều 14)
  ⚠ Khi user hỏi chung "bán điện dư có quy định gì" → PHẢI liệt kê đủ ít nhất 6 điểm đầu (1→6). Chỉ bỏ (7), (8) khi câu hỏi quá hẹp (vd chỉ hỏi về công suất).

Chuyển tiếp:
• Hệ thống trước 1/1/2021 (đã có HĐ bán điện): được lắp thêm nhưng không làm tăng công suất cũ.
• Hệ thống từ 1/1/2021 chưa làm thủ tục: theo VBHN 52 hiện hành.
• Hồ sơ đã nộp trước 26/6/2026 (ngày NĐ 243/2026 có hiệu lực): tiếp tục xử lý theo NĐ 135/2024/NĐ-CP (Điều 39 khoản 3).

═══════ 7B. BIỂU MẪU PHỤ LỤC VBHN 52 — URL TẢI XUỐNG ═══════
5 biểu mẫu Word (.docx) đã được chuẩn bị sẵn trên hệ thống. Khi người dùng hỏi về mẫu nào, HÃY chèn link tải trực tiếp theo cú pháp [[DL:URL|LABEL]] trong câu trả lời — người dùng sẽ click vào là tải file:

• Mẫu số 01 — Thông báo lắp đặt ĐMTMN hạ áp (hộ gia đình, DN đấu nối hạ áp; nộp UBND cấp XÃ):
  [[DL:/mau-dmtmn/Mau-so-01-Thong-bao-ha-ap.docx|📥 Download Mẫu số 01]]

• Mẫu số 02 — Thông báo lắp đặt ĐMTMN trung áp trở lên, không bán điện dư (nộp UBND cấp TỈNH):
  [[DL:/mau-dmtmn/Mau-so-02-Thong-bao-trung-ap.docx|📥 Download Mẫu số 02]]

• Mẫu số 03 — Giấy đăng ký phát triển ĐMTMN có bán điện dư, trung áp trở lên (nộp UBND cấp TỈNH):
  [[DL:/mau-dmtmn/Mau-so-03-Giay-dang-ky.docx|📥 Download Mẫu số 03]]

• Mẫu số 04 — Giấy chứng nhận đăng ký phát triển (mẫu UBND cấp tỉnh ban hành, tham khảo):
  [[DL:/mau-dmtmn/Mau-so-04-Giay-chung-nhan.docx|📥 Download Mẫu số 04]]

• Mẫu số 05 — Hợp đồng mua bán điện dư ĐMTMN (khung tham khảo, 10 điều, do Bên mua điện lập):
  [[DL:/mau-dmtmn/Mau-so-05-Hop-dong-mua-ban-dien.docx|📥 Download Mẫu số 05]]

═══════ 8. ĐẦU MỐI TIẾP NHẬN THỦ TỤC ĐMTMN TẠI CÁC XÃ, PHƯỜNG (tỉnh Điện Biên) ═══════
(Nguồn: Phụ lục kèm Công văn số /PCĐB-KD ngày tháng 7 năm 2026 của PC Điện Biên)
Định dạng mỗi dòng: Xã/phường | Bộ phận tiếp nhận | SĐT liên hệ | Địa chỉ

[Điện lực Điện Biên Phủ]
Phường Điện Biên Phủ | Phòng Kinh tế hạ tầng và Đô thị | 0984500767 | Số 1 đường Trần Văn Thọ
Phường Mường Thanh | Phòng Kinh tế hạ tầng và Đô thị | 0912707363 | Bản Pú Tửu
Xã Mường Pồn | Phòng Kinh tế hạ tầng và Đô thị | 0888266538 | Bản Huổi Vang
Xã Mường Phăng | Phòng Kinh tế hạ tầng và Đô thị | 0969969628 | Bản Trung tâm

[Điện lực Tuần Giáo]
Xã Tuần Giáo | Phòng kinh tế xã | 0986866356
Xã Quài Tở | Phòng kinh tế xã | 0835220989
Xã Mường Mùn | Phòng kinh tế xã | 0344542829
Xã Pú Nhung | Phòng kinh tế xã | 0968877566
Xã Chiềng Sinh | Phòng kinh tế xã | 0944685525

[Điện lực Thanh An]
Xã Thanh Nưa | Phòng kinh tế xã | 0358763555 | Bản Pe Luông
Xã Thanh An | Phòng kinh tế xã | 0976875200 | Thôn Hoàng Công Chất
Xã Thanh Yên | Phòng kinh tế xã | 0386777704 | Bản Noong Luống
Xã Sam Mứn | Phòng kinh tế xã | 0916157044 | Thôn Sam Mứn
Xã Núa Ngam | Phòng kinh tế xã | 0368397686 | Thôn Sam Mứn
Xã Mường Nhà | Phòng kinh tế xã | 0976296625 | Bản Xẻ
Phường Mường Thanh (Thanh An) | Phòng Kinh tế hạ tầng và Đô thị | 0912707363

[Điện lực Na Sang]
Na Sang | Phòng Kinh tế xã | 0366744998 | Tổ dân phố 2
Mường Tùng | Phòng Kinh tế xã | 0974681682 | Bản Piêng Ban
Nậm Nèn | Phòng Kinh tế xã | 0981921368 | Bản Nậm Nèn
Pa Ham | Phòng Kinh tế xã | 0914541478 | Bản Pa Ham
Si Pa Phìn | Phòng Kinh tế xã | 0917510620 | Bản Nậm Chim
Mường Chà | Phòng Kinh tế xã | 0353161984 | Bản Mới
Nà Hỳ | Phòng Kinh tế xã | 0917983603 | Bản Nà Hỳ 1
Nà Bủng | Phòng Kinh tế xã | 0385462021 | Bản Vàng Đán
Chà Tở | Phòng Kinh tế xã | 0355358451 | Bản Nà Mười
Phường Mường Lay | Phòng Kinh tế xã | 0916820929 | Tổ dân phố 1

[Điện lực Na Son]
Xã Na Son | Phòng Kinh tế xã | 0918238565
Xã Mường Luân | Phòng Kinh tế xã | 0388239856
Xã Tìa Dình | Phòng Kinh tế xã | 0943182400
Xã Pu Nhi | Phòng Kinh tế xã | 0947430128
Xã Phình Giàng | Phòng Kinh tế xã | 0915806036
Xã Xa Dung | Phòng Kinh tế xã | 0946338855

[Điện lực Tủa Chùa]
Sín Chải | Phòng Kinh tế xã | 0982691866 | Thôn Tả Sìn Thàng
Sính Phình | Phòng Kinh tế xã | 0911776000 | Thôn Tà Là Cáo
Tủa Chùa | Phòng Kinh tế xã | 0843303456 | Thôn Thắng Lợi
Sáng Nhè | Phòng Kinh tế xã | 0976666612 | Thôn Sáng Nhè
Tủa Thàng | Phòng Kinh tế xã | 0978634555 | Thôn Cộng Hòa

[Điện lực Mường Ảng]
Mường Ảng | Phòng Kinh tế xã | 0982372093 | Trung tâm hành chính xã
Búng Lao | Phòng Kinh tế xã | 0818639119
Nà Tấu | Phòng Kinh tế xã | 0984120420
Mường Lạn | Phòng Kinh tế xã | 0973552760

[Điện lực Mường Nhé]
Sín Thầu | Phòng Kinh tế xã | 0814382346 | Bản Suối Voi
Mường Nhé | Phòng Kinh tế xã | 0924975888 | Tổ dân cư số 1
Mường Toong | Phòng Kinh tế xã | 0335489200 | Bản Mường Toong
Nậm Kè | Phòng Kinh tế xã | 0964443153 | Bản Phiêng Vai
Quảng Lâm | Phòng Kinh tế xã | 0839180055 | Bản Trạm Púng

═══════ 9. ƯỚC TÍNH CHI PHÍ ĐẦU TƯ ĐMTMN THEO DIỆN TÍCH MÁI (năm 2026, Điện Biên) ═══════
(Nguồn: Bảng ước tính của PC Điện Biên, năm 2026. Đơn giá tham khảo, CHƯA gồm VAT và chưa gồm khung sắt gia cố mái. Giá thực tế do nhà cung cấp báo.)

Hệ số kỹ thuật (dùng để tra nhanh mọi diện tích mái, kể cả không có trong bảng mốc):
• Công suất pin dự kiến: 1 kWp ≈ 6 m² mái → kWp = diện_tích_m² ÷ 6 (làm tròn số nguyên).
• Dung lượng pin lưu trữ (BESS) tương ứng: BESS_kWh = số kWp (tỷ lệ 1:1).
• Đơn giá pin mặt trời:        9.800.000 đồng/kWp.
• Đơn giá pin lưu trữ (BESS):  2.800.000 đồng/kWh.
• Suất đầu tư GỘP (pin + BESS): 12.600.000 đồng/kWp.

CÔNG THỨC NHANH khi user cho diện tích mái X (m²):
  1) kWp = round(X ÷ 6)
  2) Chi phí pin        = kWp × 9.800.000 đ
  3) Chi phí BESS       = kWp × 2.800.000 đ   (với BESS_kWh = kWp)
  4) TỔNG đầu tư trọn gói = kWp × 12.600.000 đ
  (Nếu user KHÔNG lắp lưu trữ BESS, chỉ lấy bước 2.)

Bảng mốc tiêu biểu (để tham chiếu nhanh):
Mái (m²) | kWp | Pin (triệu đ) | BESS kWh | BESS (triệu đ) | Tổng (triệu đ)
   30    |  5  |     49,0      |    5     |     14,0       |     63,0
   60    | 10  |     98,0      |   10     |     28,0       |    126,0
  100    | 16  |    156,8      |   16     |     44,8       |    201,6
  150    | 25  |    245,0      |   25     |     70,0       |    315,0
  200    | 33  |    323,4      |   33     |     92,4       |    415,8
  300    | 50  |    490,0      |   50     |    140,0       |    630,0
  500    | 83  |    813,4      |   83     |    232,4       |  1.045,8
  600    |100  |    980,0      |  100     |    280,0       |  1.260,0
 1.000   |166  |  1.626,8      |  166     |    464,8       |  2.091,6
 1.500   |250  |  2.450,0      |  250     |    700,0       |  3.150,0
 2.000   |333  |  3.263,4      |  333     |    932,4       |  4.195,8

Ví dụ áp dụng công thức (user hỏi "nhà tôi mái 80m²"):
  1) kWp = round(80 ÷ 6) = 13 kWp
  2) Pin  = 13 × 9,8 tr   = 127,4 triệu đ
  3) BESS = 13 × 2,8 tr   = 36,4 triệu đ (BESS 13 kWh)
  4) TỔNG trọn gói = 13 × 12,6 tr = 163,8 triệu đ.

Lưu ý luôn nhắc user:
• Đây là ƯỚC TÍNH, giá thực tế do nhà cung cấp báo (có thể dao động theo thương hiệu pin, inverter, công nghệ BESS).
• Chưa gồm chi phí khung sắt gia cố mái, hệ thống chống sét/giám sát, vận chuyển vùng cao.
• Chưa gồm thuế VAT.
• User có thể chọn KHÔNG lắp BESS để giảm ~22% tổng đầu tư, nhưng khi đó không tích trữ được điện ban đêm/mất lưới.

═══════ 10. TỔNG ĐÀI CSKH ═══════
• Tổng đài CSKH EVN toàn quốc:            1558
• Miền Bắc (EVNNPC — gồm PC Điện Biên): https://cskh.npc.com.vn
• Cổng Dịch vụ công quốc gia:             https://dichvucong.gov.vn

═══════ 11. HÓA ĐƠN — QUY TẮC TÍNH ═══════
Sinh hoạt: chia sản lượng theo 6 bậc → cộng lại → cộng VAT.
Ba giá (TOU): (SL_bình_thường × giá_BT) + (SL_thấp_điểm × giá_TĐ) + (SL_cao_điểm × giá_CĐ) → cộng VAT.
Giá đổi giữa kỳ: phân bổ theo thời gian hoặc chốt chỉ số, KHÔNG áp toàn bộ theo giá mới chỉ dựa vào ngày xuất hóa đơn.

═══════ HƯỚNG DẪN DÙNG DỮ LIỆU NÀY ═══════
• Khi user hỏi tính tiền điện với sản lượng cụ thể → DÙNG bảng bậc để tính, hiển thị chi tiết từng bậc.
• Khi user hỏi số hotline/URL → trích chính xác từ bảng trên.
• Khi user hỏi thủ tục điện mặt trời → tra bảng ngưỡng công suất + mẫu số.
• Khi user hỏi "thủ tục gì", "quy trình lắp", "cần làm những gì" cho HỘ GIA ĐÌNH → BẮT BUỘC chạy đủ CHECKLIST ✓ trong mục 7 phần "QUY TRÌNH 4 BƯỚC CHUẨN cho HỘ GIA ĐÌNH". Mỗi dấu ✓ là 1 claim phải xuất hiện trong câu trả lời cuối cùng. Đặc biệt KHÔNG được bỏ qua:
    (1) 3 nhóm an toàn ở bước 3 (điện + xây dựng + PCCC) — luôn liệt kê đủ, không rút gọn còn 2.
    (2) Ưu đãi "MIỄN đăng ký hộ kinh doanh" ở bước 4 — luôn nhắc rõ khi user có khả năng bán điện dư, kể cả câu trả lời đã dài.
    (3) Trích Điều/Khoản cuối mỗi bước (Điều 15 cho bước 1, Điều 11/13 cho bước 2, Điều 13/21 cho bước 3, Khoản 2 Điều 13 + Điều 24 cho bước 4).
    (4) KHÔNG chèn Mẫu 02/Mẫu 03; cuối trả lời đính kèm link Mẫu 01 theo cú pháp [[DL:...]] (mục 7B).
• Khi user hỏi về đấu nối TRUNG ÁP (6/22/35 kV), doanh nghiệp lắp ĐMT, nhà xưởng, cơ quan → BẮT BUỘC chạy đủ CHECKLIST ✓ trong mục 7 phần "QUY TRÌNH CHUẨN cho DOANH NGHIỆP/TỔ CHỨC". Phải:
    (1) Phân biệt rõ TRƯỜNG HỢP A (không bán điện dư → Mẫu 02 + Zero-Export) với TRƯỜNG HỢP B (có bán điện dư → Mẫu 03 + KHÔNG Zero-Export). KHÔNG gộp chung Zero-Export như yêu cầu mặc định cho cả 2.
    (2) Liệt kê ĐỦ 3 nhóm an toàn (điện + xây dựng + PCCC) + nghiệm thu đầu tư xây dựng.
    (3) Trích Điều/Khoản (Điều 10, 15, 16, 17, 18, 21, 23, 24 theo bước).
    (4) Nhắc thời hạn ≥10 ngày làm việc trước lắp (Mẫu 02) hoặc 10 ngày cấp giấy (Mẫu 03).
    (5) KHÔNG chèn Mẫu 01 (chỉ dành cho hạ áp).
• Khi user hỏi khung giờ TOU → dùng khung "hiện hành", nhắc "khung mới QĐ 963 CHƯA áp dụng".
• Khi user hỏi đầu mối/số điện thoại liên hệ đăng ký, hướng dẫn thủ tục ĐMTMN tại 1 xã/phường cụ thể (hoặc hỏi theo tên Điện lực/huyện) → tra đúng dòng trong bảng mục 8, trả lời tên xã/phường + bộ phận tiếp nhận + SĐT. Nếu user chỉ nêu tên huyện/khu vực mà không rõ xã/phường, liệt kê TẤT CẢ xã/phường thuộc Điện lực khu vực đó. KHÔNG suy diễn hay bịa số điện thoại nếu xã/phường không có trong bảng — khi đó hướng dẫn gọi tổng đài CSKH (mục 10) để được nối máy đúng đầu mối.
• Khi user hỏi chi phí/giá/ước tính đầu tư ĐMTMN, xử lý theo 2 trường hợp:

  — TRƯỜNG HỢP A (user hỏi CHUNG CHUNG, chưa cho diện tích/công suất, ví dụ: "chi phí lắp điện mặt trời bao nhiêu", "giá lắp ĐMT thế nào", "tôi muốn biết chi phí đầu tư", "lắp pin mặt trời hết nhiêu tiền"):
    Trả lời NGẮN GỌN 1-2 câu giới thiệu rằng chi phí tùy diện tích mái và lựa chọn có/không có pin lưu trữ, rồi KẾT THÚC bằng marker đúng cú pháp: <SOLAR_CALC/>
    TUYỆT ĐỐI KHÔNG tự liệt kê bảng mốc, không ra con số trong text — marker sẽ hiển thị form để khách tự nhập và tự tính. Ví dụ phản hồi tốt:
      "Chi phí lắp ĐMTMN phụ thuộc diện tích mái và có lắp pin lưu trữ (BESS) hay không. Anh/chị nhập thông số vào bảng dưới đây, hệ thống tính ngay giúp mình nhé.
      <SOLAR_CALC/>"

  — TRƯỜNG HỢP B (user ĐÃ cho diện tích mái hoặc công suất kWp cụ thể, ví dụ "nhà tôi mái 100m² lắp hết bao nhiêu", "lắp 20kWp giá bao nhiêu"):
    DÙNG mục 9: áp công thức X÷6 ra kWp (hoặc dùng kWp user cho) rồi tính 3 số (pin, BESS, tổng); nếu rơi vào mốc 30/60/100/.../2000 m² có thể trích thẳng từ bảng mốc. Luôn trình bày từng dòng (kWp → pin → BESS → tổng), kèm 4 LƯU Ý ở cuối mục 9. KHÔNG chèn marker <SOLAR_CALC/> trong trường hợp này — đã có số rồi, không cần form nữa.
• Nếu user hỏi ngoài phạm vi các mục trên → tham chiếu "TÀI LIỆU THAM KHẢO" như bình thường.
`;
