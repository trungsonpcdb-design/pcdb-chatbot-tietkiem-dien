import type { ScriptTree } from "./types";

const BACK_TO_ROOT = { label: "🏠 Menu chính", action: { type: "root" as const } };
const SWITCH_TOPIC = { label: "🔄 Đổi chủ đề khác", action: { type: "picker" as const } };

export const pricingScript: ScriptTree = {
  id: "pricing",
  title: "Tra cứu giá bán điện hiện hành",
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      message:
        "Xin chào! Tôi là Trợ lý tư vấn giá bán điện.\nĐể tra cứu chính xác, Anh/Chị vui lòng chọn nhóm nội dung:\n\n📅 Biểu giá áp dụng TỪ 01/11/2026 theo Quyết định 2892/QĐ-BCT ngày 31/10/2026 của Bộ Công Thương. Khung giờ TOU theo Quyết định 963/QĐ-BCT (áp dụng từ 22/4/2026). Các mức giá chưa gồm thuế GTGT.",
      buttons: [
        { label: "🏠 Điện sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        { label: "🏭 Điện sản xuất", action: { type: "goto", nodeId: "production" } },
        { label: "🏪 Điện kinh doanh", action: { type: "goto", nodeId: "business" } },
        { label: "🏛️ Hành chính, sự nghiệp", action: { type: "goto", nodeId: "admin" } },
        { label: "⏰ Giá điện theo giờ", action: { type: "goto", nodeId: "tou" } },
        { label: "📦 Giá bán buôn điện", action: { type: "goto", nodeId: "wholesale" } },
        { label: "🧮 Cách tính hóa đơn", action: { type: "goto", nodeId: "bill" } },
        { label: "🔑 Người thuê nhà", action: { type: "goto", nodeId: "renter" } },
        { label: "📅 Giá hiện hành & cập nhật", action: { type: "goto", nodeId: "current" } },
        { label: "👨‍💼 Gặp nhân viên tư vấn", action: { type: "goto", nodeId: "escalate" } },
        SWITCH_TOPIC,
      ],
    },

    // ===== NHÁNH 1: SINH HOẠT =====
    residential: {
      id: "residential",
      message: "Anh/Chị muốn tra cứu nội dung nào về giá điện sinh hoạt?",
      buttons: [
        { label: "Bảng giá 5 bậc (mới)", action: { type: "goto", nodeId: "residential.tiers" } },
        { label: "Cách tính theo bậc", action: { type: "goto", nodeId: "residential.calc" } },
        { label: "Công tơ trả trước", action: { type: "goto", nodeId: "residential.prepaid" } },
        { label: "Giá đã có VAT chưa?", action: { type: "goto", nodeId: "residential.vat" } },
        { label: "Giá bình quân là gì?", action: { type: "goto", nodeId: "residential.average" } },
        { label: "Ví dụ: dùng 100 kWh", action: { type: "goto", nodeId: "residential.use100" } },
        { label: "Ví dụ: dùng 300 kWh", action: { type: "goto", nodeId: "residential.use300" } },
        { label: "Người thuê nhà", action: { type: "goto", nodeId: "renter" } },
        { label: "Hóa đơn tăng cao", action: { type: "goto", nodeId: "residential.increase" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.tiers": {
      id: "residential.tiers",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "Giá điện sinh hoạt áp dụng từ 01/11/2026 được tính theo 5 BẬC (thay cho biểu 6 bậc cũ của QĐ 1279/QĐ-BCT), KHÔNG áp dụng một mức duy nhất cho toàn bộ sản lượng:\n\n• Bậc 1 (0–100 kWh): 1.901 đồng/kWh\n• Bậc 2 (101–200 kWh): 2.289 đồng/kWh\n• Bậc 3 (201–400 kWh): 2.894 đồng/kWh\n• Bậc 4 (401–700 kWh): 3.456 đồng/kWh\n• Bậc 5 (từ 701 kWh trở lên): 3.844 đồng/kWh\n\nCác mức giá chưa bao gồm thuế GTGT.\n\n📖 Phụ lục kèm Quyết định 2892/QĐ-BCT ngày 31/10/2026 của Bộ Công Thương.",
      buttons: [
        { label: "Cách tính 5 bậc", action: { type: "goto", nodeId: "residential.calc" } },
        { label: "Ví dụ tính hóa đơn", action: { type: "goto", nodeId: "residential.use100" } },
        { label: "Giá có VAT chưa?", action: { type: "goto", nodeId: "residential.vat" } },
        { label: "Người thuê nhà", action: { type: "goto", nodeId: "renter" } },
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.calc": {
      id: "residential.calc",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "Sản lượng được chia lần lượt vào từng bậc theo biểu 5 bậc mới. Ví dụ dùng 250 kWh trong tháng:\n\n• 100 kWh đầu tính theo bậc 1 (1.901 đồng/kWh)\n• 100 kWh tiếp theo bậc 2 (2.289 đồng/kWh)\n• 50 kWh còn lại bậc 3 (2.894 đồng/kWh)\n\nTiền điện trước thuế bằng tổng tiền của các phần sản lượng. Sau đó hóa đơn cộng thuế GTGT theo mức áp dụng tại thời điểm lập hóa đơn.\n\n📖 Phụ lục kèm Quyết định 2892/QĐ-BCT ngày 31/10/2026.",
      buttons: [
        { label: "Ví dụ 100 kWh", action: { type: "goto", nodeId: "residential.use100" } },
        { label: "Ví dụ 300 kWh", action: { type: "goto", nodeId: "residential.use300" } },
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.prepaid": {
      id: "residential.prepaid",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "Giá điện cho công tơ thẻ trả trước áp dụng theo Phụ lục Quyết định 2892/QĐ-BCT (mục riêng cho hình thức trả trước). Mức giá cụ thể được PC Điện Biên công bố kèm hợp đồng.\n\nĐể có đơn giá chính xác tại thời điểm hiện tại, Anh/Chị vui lòng liên hệ tổng đài CSKH EVNNPC 19006769 hoặc 1558, hoặc tra cứu tại Điện lực nơi ký hợp đồng.",
      buttons: [
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.vat": {
      id: "residential.vat",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "Chưa. Quyết định 2892/QĐ-BCT quy định các mức giá trong biểu giá chưa bao gồm thuế GTGT. Khi lập hóa đơn, tiền thuế được tính thêm theo chính sách thuế đang áp dụng tại thời điểm xuất hóa đơn. Vì mức thuế có thể thay đổi theo quy định pháp luật, không nên tự mặc định một tỷ lệ thuế nếu chưa kiểm tra dữ liệu hóa đơn hoặc văn bản hiện hành.\n\n📖 Điều 1 Quyết định 2892/QĐ-BCT ngày 31/10/2026.",
      buttons: [
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.average": {
      id: "residential.average",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "Không. 2.159,9037 đồng/kWh là mức giá bán lẻ điện bình quân toàn hệ thống, chưa bao gồm thuế GTGT, áp dụng từ 01/11/2026 (giảm 2% so với mức 2.204,0655 đồng/kWh trước đó). Hộ gia đình vẫn được tính tiền theo 5 bậc sinh hoạt dựa trên sản lượng thực tế. Giá bình quân được sử dụng trong cơ chế điều hành giá, không phải mức giá cố định áp dụng cho mọi kWh của từng hộ.\n\nChính sách giảm 2% này có thời hạn 5 tháng, từ 01/11/2026 đến 30/3/2027.\n\n📖 Quyết định 2892/QĐ-BCT ngày 31/10/2026.",
      buttons: [
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.use100": {
      id: "residential.use100",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "100 kWh nằm trọn trong bậc 1 (0–100 kWh):\n\n• 100 kWh × 1.901 = 190.100 đồng\n\nTiền điện trước thuế: 190.100 đồng.\nSau đó cộng thuế GTGT theo mức áp dụng trên hóa đơn.\n\n📖 Phụ lục Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "Ví dụ 300 kWh", action: { type: "goto", nodeId: "residential.use300" } },
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.use300": {
      id: "residential.use300",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "300 kWh được chia theo 3 bậc đầu của biểu mới:\n\n• 100 kWh × 1.901 = 190.100 đồng (bậc 1)\n• 100 kWh × 2.289 = 228.900 đồng (bậc 2)\n• 100 kWh × 2.894 = 289.400 đồng (bậc 3)\n\nTiền điện trước thuế: 708.400 đồng.\nSau đó cộng thuế GTGT theo mức áp dụng. Phần sản lượng từ 401 kWh trở đi sẽ vào bậc 4 (3.456 đồng/kWh); từ 701 kWh trở đi vào bậc 5 (3.844 đồng/kWh).\n\n📖 Phụ lục Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.increase": {
      id: "residential.increase",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "Biểu giá sinh hoạt có đơn giá tăng dần theo bậc. Khi tổng sản lượng tăng, nhiều kWh hơn được tính ở các bậc cao như bậc 3, 4 hoặc 5, làm đơn giá bình quân của cả hóa đơn tăng. Ngoài ra, hóa đơn còn chịu ảnh hưởng của số ngày trong kỳ, thời tiết, thiết bị làm mát, thiết bị rò điện và thuế. Anh/Chị nên so sánh sản lượng kWh trước khi chỉ so sánh tổng tiền.",
      buttons: [
        { label: "Vì sao hóa đơn tăng dù giá không đổi?", action: { type: "goto", nodeId: "bill.increase" } },
        { label: "Gặp nhân viên tư vấn", action: { type: "goto", nodeId: "escalate" } },
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 2: NGƯỜI THUÊ NHÀ =====
    renter: {
      id: "renter",
      message: "Anh/Chị đang thuê nhà theo trường hợp nào?",
      buttons: [
        { label: "Hợp đồng dưới 12 tháng", action: { type: "goto", nodeId: "renter.short" } },
        { label: "Chủ nhà khai đủ số người", action: { type: "goto", nodeId: "renter.quota" } },
        { label: "Chủ nhà thu giá cao", action: { type: "goto", nodeId: "renter.overcharge" } },
        BACK_TO_ROOT,
      ],
    },
    "renter.short": {
      id: "renter.short",
      parentId: "renter",
      parentLabel: "Người thuê nhà",
      message:
        "Nếu thời hạn thuê dưới 12 tháng và chủ nhà không kê khai đầy đủ số người sử dụng điện, giá bán lẻ điện sinh hoạt BẬC 3 được áp dụng cho toàn bộ sản lượng tại công tơ. Theo biểu mới (QĐ 2892/QĐ-BCT áp dụng từ 01/11/2026), mức giá bậc 3 là 2.894 đồng/kWh, chưa bao gồm thuế GTGT. Trường hợp chủ nhà kê khai đầy đủ số người, bên bán điện có thể cấp định mức theo số người thực tế.\n\n📖 Phụ lục Quyết định 2892/QĐ-BCT và hướng dẫn áp dụng biểu giá sinh hoạt của EVN.",
      buttons: [
        { label: "Cách kê khai số người", action: { type: "goto", nodeId: "renter.quota" } },
        { label: "🔙 Quay lại Người thuê nhà", action: { type: "goto", nodeId: "renter" } },
        BACK_TO_ROOT,
      ],
    },
    "renter.quota": {
      id: "renter.quota",
      parentId: "renter",
      parentLabel: "Người thuê nhà",
      message:
        "Khi chủ nhà kê khai đầy đủ người sử dụng điện và có giấy tờ tạm trú theo quy định, CỨ 4 NGƯỜI được tính là một hộ để cấp một định mức sử dụng điện sinh hoạt. Trường hợp không đủ 4 người, số người lẻ được quy đổi theo tỷ lệ tương ứng. Chủ nhà cần cập nhật số người khi có thay đổi để bên bán điện điều chỉnh định mức.\n\n📖 Hướng dẫn giá điện cho sinh viên và người lao động thuê nhà của EVN.",
      buttons: [
        { label: "🔙 Quay lại Người thuê nhà", action: { type: "goto", nodeId: "renter" } },
        BACK_TO_ROOT,
      ],
    },
    "renter.overcharge": {
      id: "renter.overcharge",
      parentId: "renter",
      parentLabel: "Người thuê nhà",
      message:
        "Việc thu tiền điện phải phù hợp quy định về giá bán điện và hợp đồng thuê nhà. Nếu nghi ngờ chủ nhà thu sai, Anh/Chị nên:\n\n• Đề nghị chủ nhà công khai hóa đơn gốc và cách tính\n• Đối chiếu sản lượng công tơ tổng và cách phân bổ giữa các phòng\n• Liên hệ đơn vị điện lực hoặc cơ quan quản lý tại địa phương để được kiểm tra, hướng dẫn\n\nHãy chuẩn bị hóa đơn, số công tơ và số điện thoại chủ nhà khi liên hệ.",
      buttons: [
        { label: "Gặp nhân viên tư vấn", action: { type: "goto", nodeId: "escalate" } },
        { label: "🔙 Quay lại Người thuê nhà", action: { type: "goto", nodeId: "renter" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 3: SẢN XUẤT (QĐ 2892 chia 4 cấp theo mốc 220/35/1 kV) =====
    production: {
      id: "production",
      message: "Doanh nghiệp sử dụng điện ở cấp điện áp nào? (QĐ 2892/QĐ-BCT chia 4 cấp theo mốc 220 kV / 35 kV / 1 kV)",
      buttons: [
        { label: "Từ 220 kV trở lên", action: { type: "goto", nodeId: "production.220kv" } },
        { label: "Trên 35 kV đến dưới 220 kV", action: { type: "goto", nodeId: "production.35kv" } },
        { label: "Trên 1 kV đến 35 kV (trung áp)", action: { type: "goto", nodeId: "production.1kv" } },
        { label: "Hạ áp (đến 1 kV)", action: { type: "goto", nodeId: "production.under1" } },
        { label: "Giá theo giờ là gì?", action: { type: "goto", nodeId: "tou.who" } },
        { label: "Chưa biết cấp điện áp", action: { type: "goto", nodeId: "escalate" } },
        { label: "Vì sao giá khác nhau?", action: { type: "goto", nodeId: "production.why" } },
        BACK_TO_ROOT,
      ],
    },
    "production.220kv": {
      id: "production.220kv",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Giá bán lẻ điện cho ngành sản xuất ở cấp điện áp TỪ 220 kV TRỞ LÊN:\n\n• Giờ bình thường: 1.771 đồng/kWh\n• Giờ thấp điểm: 1.101 đồng/kWh\n• Giờ cao điểm: 3.110 đồng/kWh\n\nCác mức giá chưa bao gồm thuế GTGT. Tiền điện thực tế được tính theo sản lượng công tơ ghi nhận tại từng khung giờ.\n\n📖 Mục 1.1.1 Phụ lục kèm Quyết định 2892/QĐ-BCT ngày 31/10/2026.",
      buttons: [
        { label: "Xem khung giờ cao/thấp điểm", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },
    "production.35kv": {
      id: "production.35kv",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Giá bán lẻ điện sản xuất ở cấp điện áp TRÊN 35 kV ĐẾN DƯỚI 220 kV:\n\n• Giờ bình thường: 1.792 đồng/kWh\n• Giờ thấp điểm: 1.123 đồng/kWh\n• Giờ cao điểm: 3.218 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 1.1.2 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "Xem khung giờ cao/thấp điểm", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },
    "production.1kv": {
      id: "production.1kv",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Giá bán lẻ điện sản xuất ở cấp điện áp TRÊN 1 kV ĐẾN 35 kV (trung áp — áp dụng cho 6 kV, 10 kV, 15 kV, 22 kV, 35 kV):\n\n• Giờ bình thường: 1.814 đồng/kWh\n• Giờ thấp điểm: 1.166 đồng/kWh\n• Giờ cao điểm: 3.348 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT. Cấp điện áp áp dụng cần được xác định theo điểm giao nhận điện và hợp đồng mua bán điện.\n\n📖 Mục 1.2 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "Xem khung giờ cao/thấp điểm", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },
    "production.under1": {
      id: "production.under1",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Giá bán lẻ điện sản xuất ở CẤP HẠ ÁP (đến 1 kV, tức 220V/380V):\n\n• Giờ bình thường: 1.966 đồng/kWh\n• Giờ thấp điểm: 1.274 đồng/kWh\n• Giờ cao điểm: 3.586 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 1.3 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },
    "production.why": {
      id: "production.why",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Giá điện sản xuất phụ thuộc cấp điện áp tại điểm giao nhận và sản lượng sử dụng trong từng khung giờ. Khách hàng nhận điện ở cấp điện áp cao thường có đơn giá thấp hơn vì tự đầu tư, quản lý một phần thiết bị hạ áp hoặc trạm biến áp. Ngoài ra, tỷ lệ điện dùng vào giờ cao điểm, bình thường và thấp điểm làm tổng chi phí của từng nhà máy khác nhau.\n\nTừ 01/11/2026, QĐ 2892/QĐ-BCT chia ngưỡng theo 220 kV, 35 kV và 1 kV (thay cho các ngưỡng 110 kV, 22 kV, 6 kV của biểu cũ).",
      buttons: [
        { label: "Xem khung giờ hiện hành", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "Mẹo tối ưu ca sản xuất", action: { type: "goto", nodeId: "tou.tips" } },
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 4: KINH DOANH (QĐ 2892 chia 3 nhóm: lưu trú du lịch / sạc xe điện / kinh doanh khác) =====
    business: {
      id: "business",
      message:
        "Theo Quyết định 2892/QĐ-BCT (áp dụng từ 01/11/2026), giá bán lẻ điện kinh doanh chia 3 NHÓM với chính sách khác nhau:\n\nAnh/Chị thuộc nhóm nào?",
      buttons: [
        { label: "🏨 Cơ sở lưu trú du lịch", action: { type: "goto", nodeId: "business.tourism" } },
        { label: "🔌 Trạm sạc xe điện", action: { type: "goto", nodeId: "business.ev" } },
        { label: "🏪 Kinh doanh khác (NH, cửa hàng...)", action: { type: "goto", nodeId: "business.other" } },
        { label: "Vì sao chia 3 nhóm?", action: { type: "goto", nodeId: "business.why" } },
        { label: "Giá theo giờ là gì?", action: { type: "goto", nodeId: "tou.who" } },
        BACK_TO_ROOT,
      ],
    },

    // ----- 4.1 Lưu trú du lịch -----
    "business.tourism": {
      id: "business.tourism",
      parentId: "business",
      parentLabel: "Điện kinh doanh",
      message:
        "Cơ sở lưu trú du lịch (khách sạn, nhà nghỉ, homestay, resort…) được áp dụng ƯU ĐÃI chính sách: giá bán điện BẰNG giá sản xuất cùng cấp điện áp (không còn bị xếp chung nhóm kinh doanh như trước).\n\nAnh/Chị tra cứu theo cấp điện áp nào?",
      buttons: [
        { label: "Trung áp (trên 1 kV)", action: { type: "goto", nodeId: "business.tourism.mid" } },
        { label: "Hạ áp (đến 1 kV)", action: { type: "goto", nodeId: "business.tourism.low" } },
        { label: "🔙 Quay lại Kinh doanh", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.tourism.mid": {
      id: "business.tourism.mid",
      parentId: "business.tourism",
      parentLabel: "Lưu trú du lịch",
      message:
        "Cơ sở LƯU TRÚ DU LỊCH ở cấp điện áp TRUNG ÁP TRỞ LÊN (trên 1 kV):\n\n• Giờ bình thường: 1.814 đồng/kWh\n• Giờ thấp điểm: 1.166 đồng/kWh\n• Giờ cao điểm: 3.348 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT. Mức giá này BẰNG nhóm sản xuất cùng cấp điện áp — đây là chính sách hỗ trợ ngành du lịch theo QĐ 2892.\n\n📖 Mục 3.1.1 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Lưu trú du lịch", action: { type: "goto", nodeId: "business.tourism" } },
        BACK_TO_ROOT,
      ],
    },
    "business.tourism.low": {
      id: "business.tourism.low",
      parentId: "business.tourism",
      parentLabel: "Lưu trú du lịch",
      message:
        "Cơ sở LƯU TRÚ DU LỊCH ở cấp HẠ ÁP (đến 1 kV):\n\n• Giờ bình thường: 1.966 đồng/kWh\n• Giờ thấp điểm: 1.274 đồng/kWh\n• Giờ cao điểm: 3.586 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT. Mức giá này BẰNG nhóm sản xuất cùng cấp điện áp.\n\n📖 Mục 3.1.2 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Lưu trú du lịch", action: { type: "goto", nodeId: "business.tourism" } },
        BACK_TO_ROOT,
      ],
    },

    // ----- 4.2 Trạm sạc xe điện -----
    "business.ev": {
      id: "business.ev",
      parentId: "business",
      parentLabel: "Điện kinh doanh",
      message:
        "Trạm/trụ sạc xe điện có khung giá riêng (ưu đãi hạ tầng xe điện), khác giá kinh doanh thông thường. Anh/Chị tra cứu theo cấp điện áp nào?",
      buttons: [
        { label: "Trung áp (trên 1 kV)", action: { type: "goto", nodeId: "business.ev.mid" } },
        { label: "Hạ áp (đến 1 kV)", action: { type: "goto", nodeId: "business.ev.low" } },
        { label: "🔙 Quay lại Kinh doanh", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.ev.mid": {
      id: "business.ev.mid",
      parentId: "business.ev",
      parentLabel: "Trạm sạc xe điện",
      message:
        "Trạm sạc XE ĐIỆN ở cấp điện áp TRUNG ÁP TRỞ LÊN (trên 1 kV):\n\n• Giờ bình thường: 2.549 đồng/kWh\n• Giờ thấp điểm: 1.534 đồng/kWh\n• Giờ cao điểm: 3.758 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 3.2.1 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Trạm sạc", action: { type: "goto", nodeId: "business.ev" } },
        BACK_TO_ROOT,
      ],
    },
    "business.ev.low": {
      id: "business.ev.low",
      parentId: "business.ev",
      parentLabel: "Trạm sạc xe điện",
      message:
        "Trạm sạc XE ĐIỆN ở cấp HẠ ÁP (đến 1 kV):\n\n• Giờ bình thường: 2.700 đồng/kWh\n• Giờ thấp điểm: 1.620 đồng/kWh\n• Giờ cao điểm: 4.212 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 3.2.2 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Trạm sạc", action: { type: "goto", nodeId: "business.ev" } },
        BACK_TO_ROOT,
      ],
    },

    // ----- 4.3 Kinh doanh khác -----
    "business.other": {
      id: "business.other",
      parentId: "business",
      parentLabel: "Điện kinh doanh",
      message: "Kinh doanh khác (nhà hàng, cửa hàng, dịch vụ thương mại thông thường). Anh/Chị tra cứu theo cấp điện áp nào?",
      buttons: [
        { label: "Trung áp (trên 1 kV)", action: { type: "goto", nodeId: "business.other.mid" } },
        { label: "Hạ áp (đến 1 kV)", action: { type: "goto", nodeId: "business.other.low" } },
        { label: "🔙 Quay lại Kinh doanh", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.other.mid": {
      id: "business.other.mid",
      parentId: "business.other",
      parentLabel: "Kinh doanh khác",
      message:
        "KINH DOANH KHÁC ở cấp điện áp TRUNG ÁP TRỞ LÊN (trên 1 kV):\n\n• Giờ bình thường: 2.829 đồng/kWh\n• Giờ thấp điểm: 1.577 đồng/kWh\n• Giờ cao điểm: 4.924 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 3.3.1 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Kinh doanh khác", action: { type: "goto", nodeId: "business.other" } },
        BACK_TO_ROOT,
      ],
    },
    "business.other.low": {
      id: "business.other.low",
      parentId: "business.other",
      parentLabel: "Kinh doanh khác",
      message:
        "KINH DOANH KHÁC ở cấp HẠ ÁP (đến 1 kV):\n\n• Giờ bình thường: 3.089 đồng/kWh\n• Giờ thấp điểm: 1.880 đồng/kWh\n• Giờ cao điểm: 5.313 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT. Mức giá thực tế phụ thuộc việc khách hàng có thuộc đối tượng áp dụng ba giá hay không.\n\n📖 Mục 3.3.2 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "Đối tượng bắt buộc ba giá", action: { type: "goto", nodeId: "tou.who" } },
        { label: "🔙 Quay lại Kinh doanh khác", action: { type: "goto", nodeId: "business.other" } },
        BACK_TO_ROOT,
      ],
    },
    "business.why": {
      id: "business.why",
      parentId: "business",
      parentLabel: "Điện kinh doanh",
      message:
        "Từ 01/11/2026 theo QĐ 2892/QĐ-BCT, giá kinh doanh chia thành 3 nhóm riêng:\n\n1️⃣ CƠ SỞ LƯU TRÚ DU LỊCH: giá bằng sản xuất cùng cấp điện áp — ưu đãi hỗ trợ ngành du lịch (áp dụng cho khách sạn, nhà nghỉ, homestay, resort).\n\n2️⃣ TRẠM SẠC XE ĐIỆN: khung giá riêng thấp hơn kinh doanh khác — ưu đãi phát triển hạ tầng xe điện.\n\n3️⃣ KINH DOANH KHÁC: nhà hàng, cửa hàng, siêu thị, dịch vụ thương mại thông thường — áp dụng giá kinh doanh chuẩn.\n\nKhi một địa điểm sử dụng điện cho nhiều mục đích, việc phân bổ sản lượng hoặc xác định giá phải thực hiện theo quy định và hợp đồng mua bán điện, không chỉ dựa vào tên đăng ký doanh nghiệp.\n\n📖 Mục 3 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "Kiểm tra áp sai nhóm giá", action: { type: "goto", nodeId: "bill.wrong_group" } },
        { label: "🔙 Quay lại Kinh doanh", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 5: HÀNH CHÍNH, SỰ NGHIỆP =====
    admin: {
      id: "admin",
      message: "Đơn vị thuộc nhóm nào?",
      buttons: [
        { label: "Cơ sở y tế, giáo dục (bệnh viện, nhà trẻ, trường)", action: { type: "goto", nodeId: "admin.school" } },
        { label: "Chiếu sáng công cộng, hành chính sự nghiệp", action: { type: "goto", nodeId: "admin.public" } },
        BACK_TO_ROOT,
      ],
    },
    "admin.school": {
      id: "admin.school",
      parentId: "admin",
      parentLabel: "Hành chính, sự nghiệp",
      message:
        "Cơ sở khám bệnh, chữa bệnh; cơ sở giáo dục (bệnh viện, nhà trẻ, mẫu giáo, trường phổ thông, trường đại học):\n\n• Cấp điện áp TRUNG ÁP TRỞ LÊN (trên 1 kV): 1.901 đồng/kWh\n• Cấp điện áp HẠ ÁP (đến 1 kV): 2.030 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT. Nhóm giá này KHÔNG chia theo giờ cao điểm, bình thường và thấp điểm.\n\n📖 Mục 2.1 Phụ lục kèm Quyết định 2892/QĐ-BCT ngày 31/10/2026.",
      buttons: [
        { label: "🔙 Quay lại Hành chính", action: { type: "goto", nodeId: "admin" } },
        BACK_TO_ROOT,
      ],
    },
    "admin.public": {
      id: "admin.public",
      parentId: "admin",
      parentLabel: "Hành chính, sự nghiệp",
      message:
        "Chiếu sáng công cộng và đơn vị hành chính sự nghiệp:\n\n• Cấp điện áp TRUNG ÁP TRỞ LÊN (trên 1 kV): 2.095 đồng/kWh\n• Cấp điện áp HẠ ÁP (đến 1 kV): 2.181 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 2.2 Phụ lục kèm Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Hành chính", action: { type: "goto", nodeId: "admin" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 6: GIÁ THEO GIỜ (QĐ 963 đã áp dụng) =====
    tou: {
      id: "tou",
      message: "Anh/Chị cần tra cứu nội dung nào về giá điện theo giờ?",
      buttons: [
        { label: "Ai phải áp dụng ba giá?", action: { type: "goto", nodeId: "tou.who" } },
        { label: "Giờ cao điểm", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "Giờ bình thường", action: { type: "goto", nodeId: "tou.normal" } },
        { label: "Giờ thấp điểm", action: { type: "goto", nodeId: "tou.offpeak" } },
        { label: "Cách giảm chi phí giờ cao điểm", action: { type: "goto", nodeId: "tou.tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.who": {
      id: "tou.who",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "Đối tượng bắt buộc áp dụng giá theo thời gian sử dụng trong ngày (TOU) gồm:\n\n• Khách hàng sản xuất hoặc kinh doanh được cấp điện qua máy biến áp CHUYÊN DÙNG TỪ 25 kVA TRỞ LÊN\n• Hoặc có sản lượng điện trung bình 3 tháng liên tục TỪ 2.000 kWh/THÁNG TRỞ LÊN\n• Đơn vị bán lẻ điện tại khu công nghiệp, cụm công nghiệp\n• Đơn vị mua điện để bán lẻ ngoài mục đích sinh hoạt tại tổ hợp thương mại, dịch vụ, sinh hoạt\n\n📖 Thông tư 60/2025/TT-BCT và thông tin chính thức của EVN.",
      buttons: [
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.peak": {
      id: "tou.peak",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "Khung giờ CAO ĐIỂM áp dụng từ 22/4/2026 theo Quyết định 963/QĐ-BCT:\n\nTừ thứ Hai đến thứ Bảy: 17h30 – 22h30 (05 giờ/ngày)\n\nNgày Chủ nhật KHÔNG có giờ cao điểm.\n\n⚠️ Khung cũ (09h30–11h30 và 17h00–20h00) đã HẾT hiệu lực.\n\n📖 Điều 1 Quyết định 963/QĐ-BCT ngày 22/4/2026.",
      buttons: [
        { label: "Giờ bình thường", action: { type: "goto", nodeId: "tou.normal" } },
        { label: "Giờ thấp điểm", action: { type: "goto", nodeId: "tou.offpeak" } },
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.normal": {
      id: "tou.normal",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "Khung giờ BÌNH THƯỜNG theo Quyết định 963/QĐ-BCT (áp dụng từ 22/4/2026):\n\nTừ thứ Hai đến thứ Bảy:\n• 06h00 – 17h30\n• 22h30 – 24h00\n(Tổng 13 giờ/ngày)\n\nNgày Chủ nhật:\n• 06h00 – 24h00 (18 giờ/ngày — cả ngày không có cao điểm)\n\n📖 Điều 1 Quyết định 963/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.offpeak": {
      id: "tou.offpeak",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "Khung giờ THẤP ĐIỂM theo Quyết định 963/QĐ-BCT (áp dụng từ 22/4/2026):\n\n00h00 – 06h00, áp dụng TẤT CẢ CÁC NGÀY TRONG TUẦN (06 giờ/ngày).\n\n⚠️ Khung cũ (22h00 – 04h00 sáng hôm sau) đã HẾT hiệu lực.\n\nKhách hàng sản xuất hoặc kinh doanh có thể cân nhắc chuyển các phụ tải phù hợp sang khung giờ này, nhưng phải bảo đảm an toàn lao động, yêu cầu công nghệ, chất lượng sản phẩm và quy định vận hành.\n\n📖 Điều 1 Quyết định 963/QĐ-BCT.",
      buttons: [
        { label: "Mẹo tối ưu chi phí", action: { type: "goto", nodeId: "tou.tips" } },
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.tips": {
      id: "tou.tips",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "Doanh nghiệp có thể:\n\n• Rà soát biểu đồ phụ tải, tránh khởi động đồng thời nhiều thiết bị lớn trong khung 17h30–22h30\n• Chuyển công đoạn linh hoạt sang giờ bình thường hoặc thấp điểm (00h00–06h00)\n• Sử dụng hệ thống lưu trữ điện\n• Tối ưu vận hành điều hòa\n• Giảm thiết bị chạy không tải\n\nKhông nên dịch chuyển phụ tải nếu ảnh hưởng an toàn hoặc chất lượng sản phẩm. Trước khi thay đổi ca sản xuất, cần mô phỏng chi phí theo sản lượng thực tế từng khung giờ.",
      buttons: [
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 7: BÁN BUÔN (đang cập nhật theo QĐ 2892) =====
    wholesale: {
      id: "wholesale",
      parentId: "root",
      parentLabel: "Menu chính",
      message:
        "📦 Giá BÁN BUÔN điện áp dụng từ 01/11/2026 được quy định tại Phụ lục kèm Quyết định 2892/QĐ-BCT ngày 31/10/2026 (cho đơn vị bán lẻ điện nông thôn, xã, thị trấn, khu tập thể, tổ hợp thương mại, khu công nghiệp, chợ…).\n\nĐể tra cứu đúng mức giá bán buôn chi tiết theo đối tượng và cấp điện áp, Anh/Chị vui lòng:\n\n• Gọi tổng đài CSKH EVN: 1558\n• Hoặc liên hệ Điện lực nơi ký hợp đồng mua bán điện\n\nĐầu mối ký hợp đồng bán buôn luôn cần đối chiếu hợp đồng gốc và biên bản hiện trạng điểm đo trước khi áp giá.",
      buttons: [
        { label: "Gặp nhân viên tư vấn", action: { type: "goto", nodeId: "escalate" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 8: CÁCH TÍNH HÓA ĐƠN =====
    bill: {
      id: "bill",
      message: "Anh/Chị cần hỗ trợ nội dung nào?",
      buttons: [
        { label: "Tính hóa đơn sinh hoạt", action: { type: "goto", nodeId: "bill.residential" } },
        { label: "Tính hóa đơn ba giá", action: { type: "goto", nodeId: "bill.threephase" } },
        { label: "Hóa đơn tăng bất thường", action: { type: "goto", nodeId: "bill.increase" } },
        { label: "Nghi ngờ áp sai nhóm giá", action: { type: "goto", nodeId: "bill.wrong_group" } },
        { label: "Giá thay đổi giữa kỳ", action: { type: "goto", nodeId: "bill.midcycle" } },
        BACK_TO_ROOT,
      ],
    },
    "bill.residential": {
      id: "bill.residential",
      parentId: "bill",
      parentLabel: "Cách tính hóa đơn",
      message:
        "Quy trình tính hóa đơn sinh hoạt (theo biểu 5 bậc mới — QĐ 2892/QĐ-BCT):\n\n1️⃣ Nhận tổng sản lượng điện trong kỳ\n2️⃣ Chia sản lượng lần lượt vào 5 bậc (0–100, 101–200, 201–400, 401–700, từ 701+)\n3️⃣ Nhân sản lượng mỗi bậc với đơn giá tương ứng\n4️⃣ Cộng tiền của tất cả các bậc → tiền điện TRƯỚC thuế\n5️⃣ Tính thuế GTGT theo mức áp dụng\n6️⃣ Cộng các khoản điều chỉnh hợp lệ nếu có\n\nHãy yêu cầu hiển thị rõ sản lượng và tiền của từng bậc để dễ kiểm tra.",
      buttons: [
        { label: "Xem ví dụ 100 kWh", action: { type: "goto", nodeId: "residential.use100" } },
        { label: "Xem ví dụ 300 kWh", action: { type: "goto", nodeId: "residential.use300" } },
        { label: "🔙 Quay lại Cách tính hóa đơn", action: { type: "goto", nodeId: "bill" } },
        BACK_TO_ROOT,
      ],
    },
    "bill.threephase": {
      id: "bill.threephase",
      parentId: "bill",
      parentLabel: "Cách tính hóa đơn",
      message:
        "Tiền điện trước thuế của công tơ ba giá được tính riêng theo từng khung giờ (theo khung mới QĐ 963/QĐ-BCT):\n\n• Sản lượng giờ bình thường × giá giờ bình thường\n• Sản lượng giờ thấp điểm (00h00–06h00) × giá giờ thấp điểm\n• Sản lượng giờ cao điểm (17h30–22h30, T2–T7) × giá giờ cao điểm\n\nSau đó cộng ba khoản và tính thuế theo quy định.\n\nCần thông tin: mục đích sử dụng, cấp điện áp và sản lượng tại từng khung giờ; KHÔNG được dùng tổng sản lượng chung để ước tính nếu Anh/Chị cần kết quả chính xác.",
      buttons: [
        { label: "Khung giờ hiện hành", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "🔙 Quay lại Cách tính hóa đơn", action: { type: "goto", nodeId: "bill" } },
        BACK_TO_ROOT,
      ],
    },
    "bill.increase": {
      id: "bill.increase",
      parentId: "bill",
      parentLabel: "Cách tính hóa đơn",
      message:
        "Hóa đơn có thể tăng do:\n\n• Sản lượng sử dụng cao hơn, nhiều điện rơi vào bậc cao hoặc giờ cao điểm\n• Kỳ ghi chỉ số dài hơn\n• Thời tiết nóng, thiết bị hoạt động lâu hơn\n• Rò điện\n• Thay đổi mục đích sử dụng\n\nVới khách hàng ba giá: cần so sánh sản lượng từng khung giờ.\nVới hộ gia đình: cần so sánh tổng kWh và số kWh nằm ở từng bậc.",
      buttons: [
        { label: "Gặp nhân viên tư vấn", action: { type: "goto", nodeId: "escalate" } },
        { label: "🔙 Quay lại Cách tính hóa đơn", action: { type: "goto", nodeId: "bill" } },
        BACK_TO_ROOT,
      ],
    },
    "bill.wrong_group": {
      id: "bill.wrong_group",
      parentId: "bill",
      parentLabel: "Cách tính hóa đơn",
      message:
        "Anh/Chị cần kiểm tra:\n\n• Hợp đồng mua bán điện\n• Mục đích sử dụng thực tế\n• Cấp điện áp tại điểm giao nhận\n• Thông tin trên hóa đơn\n\nLưu ý từ 01/11/2026 có 3 nhóm giá kinh doanh riêng (lưu trú du lịch / sạc xe điện / kinh doanh khác) — khách sạn, nhà nghỉ, homestay thuộc nhóm LƯU TRÚ DU LỊCH với giá ưu đãi bằng sản xuất cùng cấp điện áp. Nếu bị áp sai sang \"kinh doanh khác\" thì cần kiến nghị điều chỉnh.\n\nNếu một địa điểm có nhiều mục đích, cần kiểm tra việc lắp công tơ riêng hoặc tỷ lệ phân bổ sản lượng.\n\nHãy gửi mã khách hàng, ảnh hóa đơn và mô tả hoạt động cho đơn vị điện lực để được đối chiếu. Chatbot không tự kết luận sai giá khi chưa có hồ sơ.",
      buttons: [
        { label: "Gặp nhân viên tư vấn", action: { type: "goto", nodeId: "escalate" } },
        { label: "🔙 Quay lại Cách tính hóa đơn", action: { type: "goto", nodeId: "bill" } },
        BACK_TO_ROOT,
      ],
    },
    "bill.midcycle": {
      id: "bill.midcycle",
      parentId: "bill",
      parentLabel: "Cách tính hóa đơn",
      message:
        "Hóa đơn cho KỲ ĐO BẮC CẦU ngày 01/11/2026 (ngày QĐ 2892/QĐ-BCT có hiệu lực): sản lượng được tách thành 2 phần theo thời gian — phần tiêu thụ TRƯỚC 01/11/2026 áp giá cũ (QĐ 1279), phần tiêu thụ TỪ 01/11/2026 áp giá mới (QĐ 2892). Cách phân bổ cụ thể phụ thuộc loại công tơ, dữ liệu đo xa và hướng dẫn tại thời điểm điều chỉnh.\n\nKHÔNG được áp toàn bộ sản lượng theo giá mới chỉ dựa vào ngày xuất hóa đơn.\n\n📖 Thông tư 60/2025/TT-BCT về quy định thực hiện giá bán lẻ điện.",
      buttons: [
        { label: "🔙 Quay lại Cách tính hóa đơn", action: { type: "goto", nodeId: "bill" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 9: GIÁ HIỆN HÀNH & CẬP NHẬT =====
    current: {
      id: "current",
      message: "Anh/Chị muốn kiểm tra nội dung nào?",
      buttons: [
        { label: "Căn cứ văn bản nào?", action: { type: "goto", nodeId: "current.decision" } },
        { label: "Giá bình quân hiện hành", action: { type: "goto", nodeId: "current.average" } },
        { label: "Cơ chế điều chỉnh 2026", action: { type: "goto", nodeId: "current.mechanism" } },
        { label: "Cách cập nhật dữ liệu", action: { type: "goto", nodeId: "current.update" } },
        BACK_TO_ROOT,
      ],
    },
    "current.decision": {
      id: "current.decision",
      parentId: "current",
      parentLabel: "Giá hiện hành & cập nhật",
      message:
        "Biểu giá đang áp dụng được ban hành kèm QUYẾT ĐỊNH SỐ 2892/QĐ-BCT ngày 31/10/2026 của Bộ Công Thương, hiệu lực TỪ NGÀY 01/11/2026. Quyết định này THAY THẾ biểu giá 6 bậc cũ của QĐ 1279/QĐ-BCT ngày 09/5/2025.\n\nKhung giờ TOU (cao điểm / bình thường / thấp điểm) theo Quyết định 963/QĐ-BCT ngày 22/4/2026, đã có hiệu lực từ 22/4/2026.\n\n📖 Quyết định 2892/QĐ-BCT và Quyết định 963/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Giá hiện hành", action: { type: "goto", nodeId: "current" } },
        BACK_TO_ROOT,
      ],
    },
    "current.average": {
      id: "current.average",
      parentId: "current",
      parentLabel: "Giá hiện hành & cập nhật",
      message:
        "Mức giá bán lẻ điện bình quân áp dụng từ 01/11/2026 là 2.159,9037 đồng/kWh, chưa bao gồm thuế GTGT (giảm 2% so với mức 2.204,0655 đồng/kWh trước đây).\n\nChính sách giảm 2% có thời hạn 5 tháng — từ 01/11/2026 đến hết 30/3/2027, sau đó Bộ Công Thương sẽ xem xét điều chỉnh tiếp.\n\nĐây là mức giá bình quân dùng trong điều hành giá điện, KHÔNG thay thế các mức giá chi tiết của từng nhóm khách hàng.\n\n📖 Quyết định 2892/QĐ-BCT ngày 31/10/2026.",
      buttons: [
        { label: "🔙 Quay lại Giá hiện hành", action: { type: "goto", nodeId: "current" } },
        BACK_TO_ROOT,
      ],
    },
    "current.mechanism": {
      id: "current.mechanism",
      parentId: "current",
      parentLabel: "Giá hiện hành & cập nhật",
      message:
        "Có. Chính phủ đã ban hành Nghị định số 278/2026/NĐ-CP ngày 09/7/2026 sửa đổi cơ chế và thời gian điều chỉnh giá bán lẻ điện bình quân; Bộ Công Thương đã ban hành văn bản hợp nhất số 68/2026/VBHN-BCT.\n\nQuyết định 2892/QĐ-BCT ngày 31/10/2026 là lần điều chỉnh gần nhất theo cơ chế mới, với các thay đổi quan trọng: chuyển biểu sinh hoạt từ 6 bậc sang 5 bậc, tách nhóm \"cơ sở lưu trú du lịch\" và \"trạm sạc xe điện\" thành nhóm riêng, giảm giá bình quân 2% trong 5 tháng.\n\n📖 Nghị định 278/2026/NĐ-CP, Văn bản hợp nhất 68/2026/VBHN-BCT, Quyết định 2892/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Giá hiện hành", action: { type: "goto", nodeId: "current" } },
        BACK_TO_ROOT,
      ],
    },
    "current.update": {
      id: "current.update",
      parentId: "current",
      parentLabel: "Giá hiện hành & cập nhật",
      message:
        "Hệ thống nên lưu các trường dữ liệu: số quyết định, ngày ban hành, ngày áp dụng, giá chưa thuế, trạng thái hiệu lực và ngày kiểm tra cuối.\n\nTrước khi trả lời, cần đối chiếu nguồn chính thức của Bộ Công Thương hoặc EVN. Nếu ngày kiểm tra đã quá thời hạn quản trị đặt trước, hệ thống phải cảnh báo \"Dữ liệu cần xác minh\" thay vì khẳng định đây là giá mới nhất.",
      buttons: [
        { label: "🔙 Quay lại Giá hiện hành", action: { type: "goto", nodeId: "current" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== ESCALATE =====
    escalate: {
      id: "escalate",
      message:
        "Để chuyên viên tư vấn hỗ trợ chính xác, Anh/Chị vui lòng gõ vào ô chat các thông tin sau:\n• Họ và tên hoặc tên đơn vị\n• Mã khách hàng sử dụng điện\n• Địa chỉ sử dụng điện\n• Mục đích sử dụng\n• Cấp điện áp\n• Sản lượng điện trong kỳ\n• Hình ảnh hóa đơn (nếu có)\n• Vấn đề cần kiểm tra\n• Số điện thoại hoặc phương thức liên hệ\n\nThông tin này được sử dụng để đối chiếu biểu giá và cách tính hóa đơn.",
      buttons: [BACK_TO_ROOT, SWITCH_TOPIC],
    },
  },
};
