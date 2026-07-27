export const SCRIPTED_FACTS = `DỮ LIỆU CHÍNH THỨC — dùng để tính toán và trả lời trực tiếp, KHÔNG cần "TÀI LIỆU THAM KHẢO":
(Nguồn: Quyết định 1279/QĐ-BCT ngày 09/5/2025, cập nhật 27/07/2026. Mọi mức giá dưới đây CHƯA gồm VAT.)

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
Ngưỡng công suất:
• < 1 kW inverter: KHÔNG cần thông báo.
• Hạ áp có đấu nối lưới: gửi Mẫu số 01 → UBND cấp XÃ, trước lắp đặt ≥ 10 ngày làm việc.
• Trung áp trở lên + KHÔNG bán điện dư: gửi Mẫu số 02 → UBND cấp TỈNH, cần Zero-Export.
• Trung áp trở lên + CÓ bán điện dư: xin Giấy chứng nhận đăng ký phát triển (Mẫu số 03), UBND cấp TỈNH cấp trong 10 ngày làm việc.
• Không đấu nối lưới + ≥ 100 kW: thông báo UBND cấp XÃ.

Bán điện dư:
• Tối đa 50% sản lượng phát theo bức xạ (đến 31/12/2030 có thể thỏa thuận cao hơn nếu lưới đủ khả năng).
• Miền núi, biên giới, hải đảo chưa có lưới quốc gia: KHÔNG bị giới hạn tỷ lệ.
• Giá mua = giá điện năng thị trường bình quân năm trước, giới hạn bởi khung giá phát điện mặt trời mặt đất.
• Hợp đồng thời hạn 5 năm. Xử lý hồ sơ trong 5 ngày làm việc kể từ khi nhận đủ.
• Hộ gia đình bán điện dư (hạ áp) MIỄN đăng ký hộ kinh doanh.

Chuyển tiếp:
• Hệ thống trước 1/1/2021 (đã có HĐ bán điện): được lắp thêm nhưng không làm tăng công suất cũ.
• Hệ thống từ 1/1/2021 chưa làm thủ tục: theo VBHN 52 hiện hành.

═══════ 8. TỔNG ĐÀI CSKH ═══════
• Miền Bắc (EVNNPC — gồm PC Điện Biên): 1900 6769 | https://cskh.npc.com.vn
• Miền Trung:                             1900 1909
• Miền Nam:                               1900 1006 / 1900 9000
• Hà Nội (EVNHANOI):                      1900 1288
• TP.HCM (EVNHCMC):                       1900 545454
• Cổng Dịch vụ công quốc gia:             https://dichvucong.gov.vn

═══════ 9. HÓA ĐƠN — QUY TẮC TÍNH ═══════
Sinh hoạt: chia sản lượng theo 6 bậc → cộng lại → cộng VAT.
Ba giá (TOU): (SL_bình_thường × giá_BT) + (SL_thấp_điểm × giá_TĐ) + (SL_cao_điểm × giá_CĐ) → cộng VAT.
Giá đổi giữa kỳ: phân bổ theo thời gian hoặc chốt chỉ số, KHÔNG áp toàn bộ theo giá mới chỉ dựa vào ngày xuất hóa đơn.

═══════ HƯỚNG DẪN DÙNG DỮ LIỆU NÀY ═══════
• Khi user hỏi tính tiền điện với sản lượng cụ thể → DÙNG bảng bậc để tính, hiển thị chi tiết từng bậc.
• Khi user hỏi số hotline/URL → trích chính xác từ bảng trên.
• Khi user hỏi thủ tục điện mặt trời → tra bảng ngưỡng công suất + mẫu số.
• Khi user hỏi khung giờ TOU → dùng khung "hiện hành", nhắc "khung mới QĐ 963 CHƯA áp dụng".
• Nếu user hỏi ngoài phạm vi 9 mục trên → tham chiếu "TÀI LIỆU THAM KHẢO" như bình thường.
`;
