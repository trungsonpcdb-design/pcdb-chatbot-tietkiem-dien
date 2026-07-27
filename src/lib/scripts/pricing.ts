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
        "Xin chào! Tôi là Trợ lý tư vấn giá bán điện.\nĐể tra cứu chính xác, Anh/Chị vui lòng chọn nhóm nội dung:\n\n📅 Dữ liệu cập nhật đến 27/07/2026 theo Quyết định 1279/QĐ-BCT. Các mức giá chưa gồm thuế GTGT.",
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
        { label: "Bảng giá 6 bậc", action: { type: "goto", nodeId: "residential.tiers" } },
        { label: "Cách tính theo bậc", action: { type: "goto", nodeId: "residential.calc" } },
        { label: "Công tơ trả trước", action: { type: "goto", nodeId: "residential.prepaid" } },
        { label: "Giá đã có VAT chưa?", action: { type: "goto", nodeId: "residential.vat" } },
        { label: "Giá bình quân là gì?", action: { type: "goto", nodeId: "residential.average" } },
        { label: "Ví dụ: dùng 100 kWh", action: { type: "goto", nodeId: "residential.use100" } },
        { label: "Ví dụ: dùng 200 kWh", action: { type: "goto", nodeId: "residential.use200" } },
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
        "Giá điện sinh hoạt được tính theo 6 bậc, KHÔNG áp dụng một mức duy nhất cho toàn bộ sản lượng:\n\n• Bậc 1 (0–50 kWh): 1.984 đồng/kWh\n• Bậc 2 (51–100 kWh): 2.050 đồng/kWh\n• Bậc 3 (101–200 kWh): 2.380 đồng/kWh\n• Bậc 4 (201–300 kWh): 2.998 đồng/kWh\n• Bậc 5 (301–400 kWh): 3.350 đồng/kWh\n• Bậc 6 (từ 401 kWh trở lên): 3.460 đồng/kWh\n\nCác mức giá chưa bao gồm thuế GTGT.\n\n📖 Mục 4.1 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "Cách tính 6 bậc", action: { type: "goto", nodeId: "residential.calc" } },
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
        "Sản lượng được chia lần lượt vào từng bậc. Với 250 kWh:\n\n• 50 kWh đầu tính theo bậc 1\n• 50 kWh tiếp theo bậc 2\n• 100 kWh tiếp theo bậc 3\n• 50 kWh còn lại bậc 4\n\nTiền điện trước thuế bằng tổng tiền của các phần sản lượng. Sau đó hóa đơn cộng thuế GTGT theo mức áp dụng tại thời điểm lập hóa đơn.\n\n📖 Cơ cấu giá bán lẻ điện sinh hoạt tại Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.prepaid": {
      id: "residential.prepaid",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "Giá bán lẻ điện sinh hoạt dùng công tơ thẻ trả trước là 2.909 đồng/kWh, chưa bao gồm thuế GTGT. Mức giá này áp dụng cho hình thức công tơ thẻ trả trước theo quy định, không phải giá bậc 3 của biểu giá sinh hoạt thông thường. Khách hàng cần xác nhận hợp đồng và loại công tơ đang sử dụng trước khi đối chiếu hóa đơn.\n\n📖 Mục 4.2 biểu giá kèm Quyết định 1279/QĐ-BCT.",
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
        "Chưa. Quyết định 1279/QĐ-BCT quy định các mức giá trong biểu giá chưa bao gồm thuế GTGT. Khi lập hóa đơn, tiền thuế được tính thêm theo chính sách thuế đang áp dụng tại thời điểm xuất hóa đơn. Vì mức thuế có thể thay đổi theo quy định pháp luật, không nên tự mặc định một tỷ lệ thuế nếu chưa kiểm tra dữ liệu hóa đơn hoặc văn bản hiện hành.\n\n📖 Điều 1 và Điều 2 Quyết định 1279/QĐ-BCT.",
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
        "Không. 2.204,0655 đồng/kWh là mức giá bán lẻ điện bình quân của toàn hệ thống, chưa bao gồm thuế GTGT. Hộ gia đình vẫn được tính tiền theo 6 bậc sinh hoạt dựa trên sản lượng thực tế. Giá bình quân được sử dụng trong cơ chế điều hành giá, không phải mức giá cố định áp dụng cho mọi kWh của từng hộ.\n\n📖 Điều 2 Quyết định 1279/QĐ-BCT và Quyết định 599/QĐ-EVN.",
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
        "100 kWh được chia thành hai phần:\n\n• 50 kWh đầu: 50 × 1.984 = 99.200 đồng\n• 50 kWh tiếp theo: 50 × 2.050 = 102.500 đồng\n\nTiền điện trước thuế: 201.700 đồng.\nSau đó cộng thuế GTGT theo mức áp dụng trên hóa đơn.",
      buttons: [
        { label: "Ví dụ 200 kWh", action: { type: "goto", nodeId: "residential.use200" } },
        { label: "🔙 Quay lại Sinh hoạt", action: { type: "goto", nodeId: "residential" } },
        BACK_TO_ROOT,
      ],
    },
    "residential.use200": {
      id: "residential.use200",
      parentId: "residential",
      parentLabel: "Điện sinh hoạt",
      message:
        "200 kWh chỉ được tính đến bậc 3 (chưa vào bậc 4):\n\n• 50 kWh × 1.984 = 99.200 đồng\n• 50 kWh × 2.050 = 102.500 đồng\n• 100 kWh × 2.380 = 238.000 đồng\n\nTiền điện trước thuế: 439.700 đồng.\nBậc 4 chỉ bắt đầu áp dụng cho phần sản lượng từ kWh thứ 201. Hóa đơn cuối còn cộng thuế GTGT và có thể điều chỉnh nếu kỳ ghi chỉ số không đủ hoặc vượt số ngày thông thường.",
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
        "Biểu giá sinh hoạt có đơn giá tăng dần theo bậc. Khi tổng sản lượng tăng, nhiều kWh hơn được tính ở các bậc cao như bậc 4, 5 hoặc 6, làm đơn giá bình quân của cả hóa đơn tăng. Ngoài ra, hóa đơn còn chịu ảnh hưởng của số ngày trong kỳ, thời tiết, thiết bị làm mát, thiết bị rò điện và thuế. Anh/Chị nên so sánh sản lượng kWh trước khi chỉ so sánh tổng tiền.",
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
        "Nếu thời hạn thuê dưới 12 tháng và chủ nhà không kê khai đầy đủ số người sử dụng điện, giá bán lẻ điện sinh hoạt BẬC 3 được áp dụng cho toàn bộ sản lượng tại công tơ. Mức giá bậc 3 hiện hành là 2.380 đồng/kWh, chưa bao gồm thuế GTGT. Trường hợp chủ nhà kê khai đầy đủ số người, bên bán điện có thể cấp định mức theo số người thực tế.\n\n📖 Hướng dẫn áp dụng biểu giá sinh hoạt được EVN công bố cùng Quyết định 1279/QĐ-BCT.",
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

    // ===== NHÁNH 3: SẢN XUẤT =====
    production: {
      id: "production",
      message: "Doanh nghiệp sử dụng điện ở cấp điện áp nào?",
      buttons: [
        { label: "Từ 110 kV trở lên", action: { type: "goto", nodeId: "production.110kv" } },
        { label: "Từ 22 đến dưới 110 kV", action: { type: "goto", nodeId: "production.22kv" } },
        { label: "Từ 6 đến dưới 22 kV", action: { type: "goto", nodeId: "production.6kv" } },
        { label: "Dưới 6 kV", action: { type: "goto", nodeId: "production.under6" } },
        { label: "Giá theo giờ là gì?", action: { type: "goto", nodeId: "tou.who" } },
        { label: "Chưa biết cấp điện áp", action: { type: "goto", nodeId: "escalate" } },
        { label: "Vì sao giá khác nhau?", action: { type: "goto", nodeId: "production.why" } },
        BACK_TO_ROOT,
      ],
    },
    "production.110kv": {
      id: "production.110kv",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Giá bán lẻ điện cho ngành sản xuất ở cấp điện áp TỪ 110 kV TRỞ LÊN:\n\n• Giờ bình thường: 1.811 đồng/kWh\n• Giờ thấp điểm: 1.146 đồng/kWh\n• Giờ cao điểm: 3.266 đồng/kWh\n\nCác mức giá chưa bao gồm thuế GTGT. Tiền điện thực tế được tính theo sản lượng công tơ ghi nhận tại từng khung giờ.\n\n📖 Mục 1.1 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "Xem khung giờ cao/thấp điểm", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },
    "production.22kv": {
      id: "production.22kv",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Giá bán lẻ điện sản xuất ở cấp điện áp TỪ 22 kV ĐẾN DƯỚI 110 kV:\n\n• Giờ bình thường: 1.833 đồng/kWh\n• Giờ thấp điểm: 1.190 đồng/kWh\n• Giờ cao điểm: 3.398 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 1.2 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "Xem khung giờ cao/thấp điểm", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },
    "production.6kv": {
      id: "production.6kv",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Cấp điện áp TỪ 6 kV ĐẾN DƯỚI 22 kV (áp dụng cho 10 kV, 15 kV...):\n\n• Giờ bình thường: 1.899 đồng/kWh\n• Giờ thấp điểm: 1.234 đồng/kWh\n• Giờ cao điểm: 3.508 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT. Cấp điện áp áp dụng cần được xác định theo điểm giao nhận điện và hợp đồng mua bán điện.\n\n📖 Mục 1.3 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },
    "production.under6": {
      id: "production.under6",
      parentId: "production",
      parentLabel: "Điện sản xuất",
      message:
        "Giá bán lẻ điện sản xuất ở cấp điện áp DƯỚI 6 kV:\n\n• Giờ bình thường: 1.987 đồng/kWh\n• Giờ thấp điểm: 1.300 đồng/kWh\n• Giờ cao điểm: 3.640 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 1.4 biểu giá kèm Quyết định 1279/QĐ-BCT.",
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
        "Giá điện sản xuất phụ thuộc cấp điện áp tại điểm giao nhận và sản lượng sử dụng trong từng khung giờ. Khách hàng nhận điện ở cấp điện áp cao thường có đơn giá thấp hơn vì tự đầu tư, quản lý một phần thiết bị hạ áp hoặc trạm biến áp. Ngoài ra, tỷ lệ điện dùng vào giờ cao điểm, bình thường và thấp điểm làm tổng chi phí của từng nhà máy khác nhau.",
      buttons: [
        { label: "Xem khung giờ hiện hành", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "Mẹo tối ưu ca sản xuất", action: { type: "goto", nodeId: "tou.tips" } },
        { label: "🔙 Quay lại Sản xuất", action: { type: "goto", nodeId: "production" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 4: KINH DOANH =====
    business: {
      id: "business",
      message: "Cơ sở kinh doanh sử dụng điện ở cấp điện áp nào?",
      buttons: [
        { label: "Từ 22 kV trở lên", action: { type: "goto", nodeId: "business.22kv" } },
        { label: "Từ 6 đến dưới 22 kV", action: { type: "goto", nodeId: "business.6kv" } },
        { label: "Dưới 6 kV", action: { type: "goto", nodeId: "business.under6" } },
        { label: "Giá theo giờ là gì?", action: { type: "goto", nodeId: "tou.who" } },
        { label: "Vì sao giá kinh doanh cao hơn sản xuất?", action: { type: "goto", nodeId: "business.why" } },
        { label: "Chưa biết cấp điện áp", action: { type: "goto", nodeId: "escalate" } },
        BACK_TO_ROOT,
      ],
    },
    "business.22kv": {
      id: "business.22kv",
      parentId: "business",
      parentLabel: "Điện kinh doanh",
      message:
        "Giá bán lẻ điện cho kinh doanh ở cấp điện áp TỪ 22 kV TRỞ LÊN:\n\n• Giờ bình thường: 2.887 đồng/kWh\n• Giờ thấp điểm: 1.609 đồng/kWh\n• Giờ cao điểm: 5.025 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 3.1 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Kinh doanh", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.6kv": {
      id: "business.6kv",
      parentId: "business",
      parentLabel: "Điện kinh doanh",
      message:
        "Giá bán lẻ điện kinh doanh ở cấp điện áp TỪ 6 kV ĐẾN DƯỚI 22 kV:\n\n• Giờ bình thường: 3.108 đồng/kWh\n• Giờ thấp điểm: 1.829 đồng/kWh\n• Giờ cao điểm: 5.202 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 3.2 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Kinh doanh", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.under6": {
      id: "business.under6",
      parentId: "business",
      parentLabel: "Điện kinh doanh",
      message:
        "Giá bán lẻ điện kinh doanh ở cấp điện áp DƯỚI 6 kV:\n\n• Giờ bình thường: 3.152 đồng/kWh\n• Giờ thấp điểm: 1.918 đồng/kWh\n• Giờ cao điểm: 5.422 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT. Mức giá thực tế phụ thuộc việc khách hàng có thuộc đối tượng áp dụng ba giá hay không.\n\n📖 Mục 3.3 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "Đối tượng bắt buộc ba giá", action: { type: "goto", nodeId: "tou.who" } },
        { label: "🔙 Quay lại Kinh doanh", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.why": {
      id: "business.why",
      parentId: "business",
      parentLabel: "Điện kinh doanh",
      message:
        "Biểu giá được xây dựng theo từng nhóm mục đích sử dụng điện. Hoạt động kinh doanh, thương mại và dịch vụ áp dụng nhóm giá kinh doanh, trong khi hoạt động trực tiếp sản xuất hàng hóa thuộc nhóm sản xuất nếu đáp ứng điều kiện và hồ sơ. Khi một địa điểm sử dụng điện cho nhiều mục đích, việc phân bổ sản lượng hoặc xác định giá phải thực hiện theo quy định và hợp đồng mua bán điện, không chỉ dựa vào tên đăng ký doanh nghiệp.",
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
        { label: "Bệnh viện, nhà trẻ, mẫu giáo, trường phổ thông", action: { type: "goto", nodeId: "admin.school" } },
        { label: "Chiếu sáng công cộng, hành chính sự nghiệp", action: { type: "goto", nodeId: "admin.public" } },
        BACK_TO_ROOT,
      ],
    },
    "admin.school": {
      id: "admin.school",
      parentId: "admin",
      parentLabel: "Hành chính, sự nghiệp",
      message:
        "Đối với bệnh viện, nhà trẻ, mẫu giáo và trường phổ thông:\n\n• Cấp điện áp TỪ 6 kV TRỞ LÊN: 1.940 đồng/kWh\n• Cấp điện áp DƯỚI 6 kV: 2.072 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT. Nhóm giá này KHÔNG chia theo giờ cao điểm, bình thường và thấp điểm trong biểu giá được công bố.\n\n📖 Mục 2.1 biểu giá kèm Quyết định 1279/QĐ-BCT.",
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
        "Đối với chiếu sáng công cộng và đơn vị hành chính sự nghiệp:\n\n• Cấp điện áp TỪ 6 kV TRỞ LÊN: 2.138 đồng/kWh\n• Cấp điện áp DƯỚI 6 kV: 2.226 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 2.2 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Hành chính", action: { type: "goto", nodeId: "admin" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 6: GIÁ THEO GIỜ =====
    tou: {
      id: "tou",
      message: "Anh/Chị cần tra cứu nội dung nào về giá điện theo giờ?",
      buttons: [
        { label: "Ai phải áp dụng ba giá?", action: { type: "goto", nodeId: "tou.who" } },
        { label: "Giờ cao điểm hiện hành", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "Giờ bình thường hiện hành", action: { type: "goto", nodeId: "tou.normal" } },
        { label: "Giờ thấp điểm hiện hành", action: { type: "goto", nodeId: "tou.offpeak" } },
        { label: "Khung giờ mới 2026", action: { type: "goto", nodeId: "tou.new" } },
        { label: "Khung giờ mới đã áp dụng chưa?", action: { type: "goto", nodeId: "tou.new_applied" } },
        { label: "Cách giảm chi phí giờ cao điểm", action: { type: "goto", nodeId: "tou.tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.who": {
      id: "tou.who",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "Đối tượng bắt buộc áp dụng giá theo thời gian sử dụng trong ngày gồm:\n\n• Khách hàng sản xuất hoặc kinh doanh được cấp điện qua máy biến áp CHUYÊN DÙNG TỪ 25 kVA TRỞ LÊN\n• Hoặc có sản lượng điện trung bình 3 tháng liên tục TỪ 2.000 kWh/THÁNG TRỞ LÊN\n• Đơn vị bán lẻ điện tại khu công nghiệp, cụm công nghiệp\n• Đơn vị mua điện để bán lẻ ngoài mục đích sinh hoạt tại tổ hợp thương mại, dịch vụ, sinh hoạt\n\n📖 Thông tư 60/2025/TT-BCT và thông tin chính thức của EVN.",
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
        "⚠️ Tại thời điểm cập nhật 27/07/2026, khung giờ cao điểm ĐANG ÁP DỤNG THỰC TẾ vẫn là:\n\nTừ thứ Hai đến thứ Bảy:\n• 09h30 – 11h30\n• 17h00 – 20h00\n\nNgày Chủ nhật KHÔNG có giờ cao điểm.\n\nNếu Anh/Chị hỏi sau ngày cập nhật, vui lòng kiểm tra lại thông báo chính thức của Bộ Công Thương hoặc EVN.\n\n📖 Thông tin của Bộ Công Thương tại họp báo quý II/2026.",
      buttons: [
        { label: "Giờ bình thường", action: { type: "goto", nodeId: "tou.normal" } },
        { label: "Giờ thấp điểm", action: { type: "goto", nodeId: "tou.offpeak" } },
        { label: "Khung giờ mới 2026", action: { type: "goto", nodeId: "tou.new" } },
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.normal": {
      id: "tou.normal",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "Khung giờ bình thường ĐANG ÁP DỤNG:\n\nTừ thứ Hai đến thứ Bảy:\n• 04h00 – 09h30\n• 11h30 – 17h00\n• 20h00 – 22h00\n\nNgày Chủ nhật:\n• 04h00 – 22h00\n\nKhung giờ này cần được cập nhật khi có thông báo chính thức áp dụng Quyết định 963/QĐ-BCT.",
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
        "Giờ thấp điểm ĐANG ÁP DỤNG: từ 22h00 đến 04h00 sáng hôm sau, áp dụng TẤT CẢ CÁC NGÀY TRONG TUẦN.\n\nKhách hàng sản xuất hoặc kinh doanh có thể cân nhắc chuyển các phụ tải phù hợp sang khung giờ này, nhưng phải bảo đảm an toàn lao động, yêu cầu công nghệ, chất lượng sản phẩm và quy định vận hành.",
      buttons: [
        { label: "Mẹo tối ưu chi phí", action: { type: "goto", nodeId: "tou.tips" } },
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.new": {
      id: "tou.new",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "⚠️ CHƯA ÁP DỤNG. Quyết định 963/QĐ-BCT quy định khung giờ mới như sau:\n\nTừ thứ Hai đến thứ Bảy:\n• Giờ cao điểm: 17h30 – 22h30\n• Giờ bình thường: 06h00 – 17h30 và 22h30 – 24h00\n\nTất cả các ngày:\n• Giờ thấp điểm: 00h00 – 06h00\n\nNgày Chủ nhật KHÔNG có giờ cao điểm; từ 06h00 – 24h00 là giờ bình thường.\n\n📖 Quyết định 963/QĐ-BCT ngày 22/4/2026.",
      buttons: [
        { label: "Đã áp dụng chưa?", action: { type: "goto", nodeId: "tou.new_applied" } },
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.new_applied": {
      id: "tou.new_applied",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "❌ CHƯA áp dụng trên thực tế tại thời điểm cập nhật 27/07/2026. Bộ Công Thương cho biết khung giờ cao điểm hiện hành vẫn là 09h30 – 11h30 và 17h00 – 20h00. Quyết định 963/QĐ-BCT đã ban hành khung giờ mới, nhưng việc áp dụng phải chờ điều kiện pháp lý và triển khai chính thức.\n\nVui lòng kiểm tra thông báo mới nhất của Bộ Công Thương hoặc EVN trước khi đối chiếu hóa đơn.\n\n📖 Họp báo thường kỳ quý II/2026 của Bộ Công Thương.",
      buttons: [
        { label: "Khung giờ đang áp dụng", action: { type: "goto", nodeId: "tou.peak" } },
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },
    "tou.tips": {
      id: "tou.tips",
      parentId: "tou",
      parentLabel: "Giá điện theo giờ",
      message:
        "Doanh nghiệp có thể:\n\n• Rà soát biểu đồ phụ tải, tránh khởi động đồng thời nhiều thiết bị lớn\n• Chuyển công đoạn linh hoạt sang giờ bình thường hoặc thấp điểm\n• Sử dụng hệ thống lưu trữ điện\n• Tối ưu vận hành điều hòa\n• Giảm thiết bị chạy không tải\n\nKhông nên dịch chuyển phụ tải nếu ảnh hưởng an toàn hoặc chất lượng sản phẩm. Trước khi thay đổi ca sản xuất, cần mô phỏng chi phí theo sản lượng thực tế từng khung giờ.",
      buttons: [
        { label: "🔙 Quay lại Giá theo giờ", action: { type: "goto", nodeId: "tou" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 7: BÁN BUÔN =====
    wholesale: {
      id: "wholesale",
      message: "Anh/Chị muốn tra cứu nhóm giá bán buôn nào?",
      buttons: [
        { label: "Nông thôn", action: { type: "goto", nodeId: "wholesale.rural" } },
        { label: "Khu tập thể, cụm dân cư (thành phố)", action: { type: "goto", nodeId: "wholesale.urban" } },
        { label: "Khu tập thể (thị trấn, huyện lỵ)", action: { type: "goto", nodeId: "wholesale.town" } },
        { label: "Tổ hợp thương mại, dịch vụ", action: { type: "goto", nodeId: "wholesale.complex" } },
        { label: "Khu công nghiệp — 110 kV", action: { type: "goto", nodeId: "wholesale.ind_110" } },
        { label: "Khu công nghiệp — trung áp", action: { type: "goto", nodeId: "wholesale.ind_mid" } },
        { label: "Chợ", action: { type: "goto", nodeId: "wholesale.market" } },
        BACK_TO_ROOT,
      ],
    },
    "wholesale.rural": {
      id: "wholesale.rural",
      parentId: "wholesale",
      parentLabel: "Giá bán buôn",
      message:
        "Giá bán buôn điện SINH HOẠT NÔNG THÔN theo 6 bậc:\n\n• Bậc 1: 1.658 đồng/kWh\n• Bậc 2: 1.724 đồng/kWh\n• Bậc 3: 1.876 đồng/kWh\n• Bậc 4: 2.327 đồng/kWh\n• Bậc 5: 2.635 đồng/kWh\n• Bậc 6: 2.744 đồng/kWh\n\nGiá bán buôn cho mục đích khác tại nông thôn: 1.735 đồng/kWh.\n\nCác mức giá chưa bao gồm thuế GTGT.\n\n📖 Mục 5 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Bán buôn", action: { type: "goto", nodeId: "wholesale" } },
        BACK_TO_ROOT,
      ],
    },
    "wholesale.urban": {
      id: "wholesale.urban",
      parentId: "wholesale",
      parentLabel: "Giá bán buôn",
      message:
        "Khu tập thể, cụm dân cư TẠI THÀNH PHỐ, THỊ XÃ — giá sinh hoạt 6 bậc:\n\n📌 Trạm biến áp do BÊN BÁN đầu tư:\n1.853 / 1.919 / 2.172 / 2.750 / 3.102 / 3.206 đồng/kWh\n\n📌 Trạm biến áp do BÊN MUA đầu tư:\n1.826 / 1.892 / 2.109 / 2.667 / 2.999 / 3.134 đồng/kWh\n\nGiá bán buôn cho mục đích khác: 1.750 đồng/kWh.\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 6.1 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Bán buôn", action: { type: "goto", nodeId: "wholesale" } },
        BACK_TO_ROOT,
      ],
    },
    "wholesale.town": {
      id: "wholesale.town",
      parentId: "wholesale",
      parentLabel: "Giá bán buôn",
      message:
        "Khu tập thể, cụm dân cư TẠI THỊ TRẤN, HUYỆN LỴ — giá sinh hoạt 6 bậc:\n\n📌 Trạm biến áp do BÊN BÁN đầu tư:\n1.790 / 1.856 / 2.062 / 2.611 / 2.937 / 3.035 đồng/kWh\n\n📌 Trạm biến áp do BÊN MUA đầu tư:\n1.762 / 1.828 / 2.017 / 2.503 / 2.834 / 2.929 đồng/kWh\n\nGiá bán buôn cho mục đích khác: 1.750 đồng/kWh.\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 6.2 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Bán buôn", action: { type: "goto", nodeId: "wholesale" } },
        BACK_TO_ROOT,
      ],
    },
    "wholesale.complex": {
      id: "wholesale.complex",
      parentId: "wholesale",
      parentLabel: "Giá bán buôn",
      message:
        "Tổ hợp thương mại, dịch vụ, sinh hoạt:\n\n📌 Phần điện SINH HOẠT — 6 bậc:\n1.947 / 2.011 / 2.334 / 2.941 / 3.286 / 3.393 đồng/kWh\n\n📌 Phần điện cho MỤC ĐÍCH KHÁC:\n• Giờ bình thường: 2.989 đồng/kWh\n• Giờ thấp điểm: 1.818 đồng/kWh\n• Giờ cao điểm: 5.140 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 7 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Bán buôn", action: { type: "goto", nodeId: "wholesale" } },
        BACK_TO_ROOT,
      ],
    },
    "wholesale.ind_110": {
      id: "wholesale.ind_110",
      parentId: "wholesale",
      parentLabel: "Giá bán buôn",
      message:
        "Khu công nghiệp — tại THANH CÁI 110 kV, giá phụ thuộc tổng công suất đặt của các máy biến áp:\n\n📌 TRÊN 100 MVA:\n• Bình thường: 1.744 đồng/kWh\n• Thấp điểm: 1.117 đồng/kWh\n• Cao điểm: 3.197 đồng/kWh\n\n📌 TỪ 50 ĐẾN 100 MVA:\n• Bình thường: 1.737 / Thấp điểm: 1.084 / Cao điểm: 3.183 đồng/kWh\n\n📌 DƯỚI 50 MVA:\n• Bình thường: 1.728 / Thấp điểm: 1.079 / Cao điểm: 3.164 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 8.1 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Bán buôn", action: { type: "goto", nodeId: "wholesale" } },
        BACK_TO_ROOT,
      ],
    },
    "wholesale.ind_mid": {
      id: "wholesale.ind_mid",
      parentId: "wholesale",
      parentLabel: "Giá bán buôn",
      message:
        "Khu công nghiệp — phía TRUNG ÁP của trạm 110 kV:\n\n📌 Cấp điện áp TỪ 22 kV ĐẾN DƯỚI 110 kV:\n• Bình thường: 1.800 / Thấp điểm: 1.168 / Cao điểm: 3.334 đồng/kWh\n\n📌 Cấp điện áp TỪ 6 kV ĐẾN DƯỚI 22 kV:\n• Bình thường: 1.865 / Thấp điểm: 1.210 / Cao điểm: 3.441 đồng/kWh\n\nGiá chưa bao gồm thuế GTGT.\n\n📖 Mục 8.2 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Bán buôn", action: { type: "goto", nodeId: "wholesale" } },
        BACK_TO_ROOT,
      ],
    },
    "wholesale.market": {
      id: "wholesale.market",
      parentId: "wholesale",
      parentLabel: "Giá bán buôn",
      message:
        "Giá bán buôn điện cho CHỢ: 2.818 đồng/kWh, chưa bao gồm thuế GTGT.\n\nViệc bán lại điện cho các hộ sử dụng trong chợ phải tuân thủ quy định về giá, đo đếm và hợp đồng bán lẻ điện. Nếu Anh/Chị đang hỏi giá bán trực tiếp cho một quầy kinh doanh, vui lòng kiểm tra loại hợp đồng.\n\n📖 Mục 9 biểu giá kèm Quyết định 1279/QĐ-BCT.",
      buttons: [
        { label: "🔙 Quay lại Bán buôn", action: { type: "goto", nodeId: "wholesale" } },
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
        "Quy trình tính hóa đơn sinh hoạt:\n\n1️⃣ Nhận tổng sản lượng điện trong kỳ\n2️⃣ Chia sản lượng lần lượt vào 6 bậc\n3️⃣ Nhân sản lượng mỗi bậc với đơn giá tương ứng\n4️⃣ Cộng tiền của tất cả các bậc → tiền điện TRƯỚC thuế\n5️⃣ Tính thuế GTGT theo mức áp dụng\n6️⃣ Cộng các khoản điều chỉnh hợp lệ nếu có\n\nHãy yêu cầu hiển thị rõ sản lượng và tiền của từng bậc để dễ kiểm tra.",
      buttons: [
        { label: "Xem ví dụ 100 kWh", action: { type: "goto", nodeId: "residential.use100" } },
        { label: "Xem ví dụ 200 kWh", action: { type: "goto", nodeId: "residential.use200" } },
        { label: "🔙 Quay lại Cách tính hóa đơn", action: { type: "goto", nodeId: "bill" } },
        BACK_TO_ROOT,
      ],
    },
    "bill.threephase": {
      id: "bill.threephase",
      parentId: "bill",
      parentLabel: "Cách tính hóa đơn",
      message:
        "Tiền điện trước thuế của công tơ ba giá được tính riêng theo từng khung giờ:\n\n• Sản lượng giờ bình thường × giá giờ bình thường\n• Sản lượng giờ thấp điểm × giá giờ thấp điểm\n• Sản lượng giờ cao điểm × giá giờ cao điểm\n\nSau đó cộng ba khoản và tính thuế theo quy định.\n\nCần thông tin: mục đích sử dụng, cấp điện áp và sản lượng tại từng khung giờ; KHÔNG được dùng tổng sản lượng chung để ước tính nếu Anh/Chị cần kết quả chính xác.",
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
        "Anh/Chị cần kiểm tra:\n\n• Hợp đồng mua bán điện\n• Mục đích sử dụng thực tế\n• Cấp điện áp tại điểm giao nhận\n• Thông tin trên hóa đơn\n\nNếu một địa điểm có nhiều mục đích, cần kiểm tra việc lắp công tơ riêng hoặc tỷ lệ phân bổ sản lượng.\n\nHãy gửi mã khách hàng, ảnh hóa đơn và mô tả hoạt động cho đơn vị điện lực để được đối chiếu. Chatbot không tự kết luận sai giá khi chưa có hồ sơ.",
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
        "Khi có điều chỉnh giá trong kỳ ghi chỉ số, sản lượng thường được phân bổ theo thời gian hoặc chốt chỉ số theo quy định thực hiện giá điện. Cách xử lý cụ thể phụ thuộc loại công tơ, dữ liệu đo xa và hướng dẫn tại thời điểm điều chỉnh.\n\nKhông được áp toàn bộ sản lượng theo giá mới chỉ dựa vào ngày xuất hóa đơn.",
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
        "Biểu giá trong kịch bản được ban hành kèm QUYẾT ĐỊNH SỐ 1279/QĐ-BCT ngày 09/5/2025 của Bộ Công Thương và áp dụng TỪ NGÀY 10/5/2025.\n\nTại thời điểm kiểm tra 27/07/2026, trang thông tin giá điện chính thức của EVN vẫn đang công bố biểu giá bán lẻ và bán buôn theo quyết định này.\n\n📖 Quyết định 1279/QĐ-BCT và chuyên mục Giá điện của EVN.",
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
        "Mức giá bán lẻ điện bình quân là 2.204,0655 đồng/kWh, chưa bao gồm thuế GTGT, áp dụng từ 10/5/2025.\n\nĐây là mức giá bình quân dùng trong điều hành giá điện, KHÔNG thay thế các mức giá chi tiết của từng nhóm khách hàng.\n\n📖 Quyết định 599/QĐ-EVN và Điều 2 Quyết định 1279/QĐ-BCT.",
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
        "Có. Chính phủ đã ban hành Nghị định số 278/2026/NĐ-CP ngày 09/7/2026 sửa đổi cơ chế và thời gian điều chỉnh giá bán lẻ điện bình quân; Bộ Công Thương đã ban hành văn bản hợp nhất số 68/2026/VBHN-BCT.\n\nTuy nhiên, VĂN BẢN VỀ CƠ CHẾ ĐIỀU CHỈNH KHÔNG TỰ ĐỘNG LÀM THAY ĐỔI CÁC MỨC GIÁ CHI TIẾT. Chỉ cập nhật biểu giá khi có quyết định giá mới được cơ quan có thẩm quyền công bố.\n\n📖 Nghị định 278/2026/NĐ-CP và Văn bản hợp nhất 68/2026/VBHN-BCT.",
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
