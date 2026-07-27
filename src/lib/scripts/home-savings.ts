import type { ScriptTree } from "./types";

const BACK_TO_ROOT = { label: "🏠 Menu chính", action: { type: "root" as const } };

export const homeSavingsScript: ScriptTree = {
  id: "home-savings",
  title: "Tiết kiệm điện gia đình",
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      message:
        "Xin chào! Tôi là Trợ lý tư vấn sử dụng điện tiết kiệm và an toàn trong gia đình.\nAnh/Chị cần tìm hiểu nội dung nào?",
      buttons: [
        { label: "🛒 Chọn mua thiết bị", action: { type: "goto", nodeId: "buy" } },
        { label: "💡 Mẹo sử dụng tiết kiệm", action: { type: "goto", nodeId: "tips" } },
        { label: "⚡ An toàn điện", action: { type: "goto", nodeId: "safety" } },
        { label: "☀️ Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        { label: "🔎 Tra cứu dịch vụ điện", action: { type: "goto", nodeId: "contact" } },
        { label: "🔄 Đổi chủ đề khác", action: { type: "picker" } },
      ],
    },

    // ===== NHÁNH 1: CHỌN MUA THIẾT BỊ =====
    buy: {
      id: "buy",
      message: "Anh/Chị muốn được tư vấn chọn mua thiết bị nào?",
      buttons: [
        { label: "Nhãn năng lượng", action: { type: "goto", nodeId: "buy.label" } },
        { label: "Thiết bị Inverter", action: { type: "goto", nodeId: "buy.inverter" } },
        { label: "Điều hòa", action: { type: "goto", nodeId: "buy.ac" } },
        { label: "Tủ lạnh", action: { type: "goto", nodeId: "buy.fridge" } },
        { label: "Máy giặt", action: { type: "goto", nodeId: "buy.washer" } },
        { label: "Bình nước nóng", action: { type: "goto", nodeId: "buy.heater" } },
        { label: "Thiết bị chiếu sáng", action: { type: "goto", nodeId: "buy.lighting" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.label": {
      id: "buy.label",
      parentId: "buy",
      parentLabel: "Chọn mua thiết bị",
      message:
        "Nhãn năng lượng cung cấp thông tin về hiệu suất và mức tiêu thụ điện của thiết bị. Nhãn giúp người mua so sánh những sản phẩm cùng loại để lựa chọn thiết bị có hiệu suất cao và sử dụng ít điện hơn. Khi mua điều hòa, tủ lạnh, máy giặt, quạt điện hoặc bình nước nóng, Anh/Chị nên kiểm tra số sao, công suất, dung tích và thông số tiêu thụ điện thay vì chỉ so sánh giá bán.",
      buttons: [
        { label: "Ý nghĩa số sao", action: { type: "goto", nodeId: "buy.label.stars" } },
        { label: "Nhãn hiệu suất cao nhất", action: { type: "goto", nodeId: "buy.label.top" } },
        { label: "🔙 Quay lại Chọn mua thiết bị", action: { type: "goto", nodeId: "buy" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.label.stars": {
      id: "buy.label.stars",
      parentId: "buy.label",
      parentLabel: "Nhãn năng lượng",
      message:
        "Trong cùng một nhóm thiết bị, sản phẩm được xếp hạng 5 sao có hiệu suất năng lượng tốt nhất theo hệ thống nhãn so sánh. Tuy nhiên, thiết bị 5 sao có dung tích hoặc công suất quá lớn vẫn có thể tiêu thụ nhiều điện. Vì vậy, Anh/Chị nên chọn sản phẩm vừa có số sao cao, vừa phù hợp với số người, diện tích phòng và nhu cầu sử dụng thực tế của gia đình.",
      buttons: [
        { label: "🔙 Quay lại Nhãn năng lượng", action: { type: "goto", nodeId: "buy.label" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.label.top": {
      id: "buy.label.top",
      parentId: "buy.label",
      parentLabel: "Nhãn năng lượng",
      message:
        "Đây là nhãn tự nguyện dành cho những sản phẩm có hiệu suất năng lượng vượt trội, trên mức 5 sao theo tiêu chuẩn áp dụng. Nhãn thường đi kèm mã QR để người tiêu dùng tra cứu công suất, hiệu suất năng lượng, đơn vị thử nghiệm, thông số kỹ thuật và hướng dẫn sử dụng tiết kiệm. Anh/Chị có thể quét mã QR trước khi mua để kiểm tra thông tin của sản phẩm.",
      buttons: [
        { label: "🔙 Quay lại Nhãn năng lượng", action: { type: "goto", nodeId: "buy.label" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.inverter": {
      id: "buy.inverter",
      parentId: "buy",
      parentLabel: "Chọn mua thiết bị",
      message:
        "Công nghệ Inverter giúp thiết bị điều chỉnh công suất theo nhu cầu thực tế, hạn chế việc động cơ liên tục khởi động và dừng. Nhờ đó, thiết bị có thể hoạt động ổn định, êm hơn và tiết kiệm điện. Công nghệ này được sử dụng trên điều hòa, tủ lạnh, máy giặt, bếp từ và lò vi sóng. Hiệu quả tiết kiệm thực tế còn phụ thuộc vào thời gian và cách sử dụng thiết bị.",
      buttons: [
        { label: "🔙 Quay lại Chọn mua thiết bị", action: { type: "goto", nodeId: "buy" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.ac": {
      id: "buy.ac",
      parentId: "buy",
      parentLabel: "Chọn mua thiết bị",
      message:
        "Anh/Chị nên chọn điều hòa có công suất phù hợp với diện tích và đặc điểm của phòng, ưu tiên sản phẩm có nhãn năng lượng cao. Chỉ số CSPF càng lớn thì hiệu quả làm mát theo mùa càng tốt. Có thể ưu tiên các công nghệ như Inverter, ECO hoặc cảm biến thông minh. Không nên chọn máy quá nhỏ vì phải chạy liên tục, nhưng cũng không nên chọn máy quá lớn gây lãng phí chi phí đầu tư.",
      buttons: [
        { label: "Cách dùng điều hòa tiết kiệm", action: { type: "goto", nodeId: "tips.ac" } },
        { label: "Công nghệ Inverter", action: { type: "goto", nodeId: "buy.inverter" } },
        { label: "🔙 Quay lại Chọn mua thiết bị", action: { type: "goto", nodeId: "buy" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.fridge": {
      id: "buy.fridge",
      parentId: "buy",
      parentLabel: "Chọn mua thiết bị",
      message:
        "Nên chọn tủ lạnh có dung tích phù hợp với số người và nhu cầu bảo quản thực phẩm. Ưu tiên sản phẩm có nhãn năng lượng cao và công nghệ Inverter. Tủ nhiều ngăn có thể giảm thất thoát hơi lạnh vì người dùng chỉ cần mở ngăn cần thiết. Không nên chọn tủ quá lớn để sử dụng như nơi chứa thực phẩm dư thừa, vì vừa làm tăng điện tiêu thụ vừa ảnh hưởng chất lượng thực phẩm.",
      buttons: [
        { label: "Cách dùng tủ lạnh tiết kiệm", action: { type: "goto", nodeId: "tips.fridge" } },
        { label: "🔙 Quay lại Chọn mua thiết bị", action: { type: "goto", nodeId: "buy" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.washer": {
      id: "buy.washer",
      parentId: "buy",
      parentLabel: "Chọn mua thiết bị",
      message:
        "Anh/Chị nên chọn máy giặt có khối lượng giặt phù hợp với số thành viên và lượng quần áo hằng ngày. Cần kiểm tra mức tiêu hao điện và nước, ưu tiên thiết bị có nhãn năng lượng cao, công nghệ Inverter và các chế độ giặt tiết kiệm. Máy có khả năng điều chỉnh lượng nước, nhiệt độ và thời gian sẽ giúp người dùng kiểm soát điện năng hiệu quả hơn.",
      buttons: [
        { label: "Cách dùng máy giặt tiết kiệm", action: { type: "goto", nodeId: "tips.washer" } },
        { label: "🔙 Quay lại Chọn mua thiết bị", action: { type: "goto", nodeId: "buy" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.heater": {
      id: "buy.heater",
      parentId: "buy",
      parentLabel: "Chọn mua thiết bị",
      message:
        "Gia đình 1–2 người có thể tham khảo bình khoảng 15 lít; 2–3 người khoảng 20 lít; 3–4 người khoảng 30 lít và 4–5 người khoảng 40 lít. Bình có dung tích quá lớn sẽ làm tăng lượng nước cần đun và điện năng tiêu thụ. Nên chọn bình có lớp bảo ôn tốt, điều chỉnh được nhiệt độ và có các tính năng bảo vệ an toàn.",
      buttons: [
        { label: "🔙 Quay lại Chọn mua thiết bị", action: { type: "goto", nodeId: "buy" } },
        BACK_TO_ROOT,
      ],
    },
    "buy.lighting": {
      id: "buy.lighting",
      parentId: "buy",
      parentLabel: "Chọn mua thiết bị",
      message:
        "Có. Theo cẩm nang, đèn LED có thể tiết kiệm khoảng 80%–90% năng lượng so với bóng đèn sợi đốt hoặc bóng huỳnh quang. Đèn LED có tuổi thọ dài và không chứa thủy ngân. Khi chọn đèn, Anh/Chị nên căn cứ vào diện tích phòng, mục đích sử dụng và độ sáng cần thiết, tránh chọn bóng công suất quá lớn gây chói mắt và lãng phí điện.",
      buttons: [
        { label: "Khi nào nên tắt đèn?", action: { type: "goto", nodeId: "tips.light" } },
        { label: "🔙 Quay lại Chọn mua thiết bị", action: { type: "goto", nodeId: "buy" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 2: MẸO SỬ DỤNG =====
    tips: {
      id: "tips",
      message: "Anh/Chị muốn tìm mẹo tiết kiệm điện cho thiết bị nào?",
      buttons: [
        { label: "Điều hòa", action: { type: "goto", nodeId: "tips.ac" } },
        { label: "Tủ lạnh", action: { type: "goto", nodeId: "tips.fridge" } },
        { label: "Máy giặt", action: { type: "goto", nodeId: "tips.washer" } },
        { label: "Quạt điện", action: { type: "goto", nodeId: "tips.fan" } },
        { label: "Đèn chiếu sáng", action: { type: "goto", nodeId: "tips.light" } },
        { label: "Nồi cơm điện", action: { type: "goto", nodeId: "tips.rice" } },
        { label: "Ấm siêu tốc", action: { type: "goto", nodeId: "tips.kettle" } },
        { label: "Bếp từ", action: { type: "goto", nodeId: "tips.stove" } },
        { label: "Tivi", action: { type: "goto", nodeId: "tips.tv" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.ac": {
      id: "tips.ac",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Không nên tắt và bật điều hòa liên tục vì mỗi lần khởi động, máy cần nhiều năng lượng hơn. Chỉ sử dụng chế độ làm lạnh nhanh khi mới bật, sau đó chuyển về mức phù hợp. Cần đóng kín cửa, hạn chế ánh nắng vào phòng và vệ sinh bộ lọc định kỳ. Dàn nóng nên đặt ở nơi thông thoáng, có mái che và không bị vật cản phía trước.",
      buttons: [
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.fridge": {
      id: "tips.fridge",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Đặt tủ lạnh ở nơi thoáng mát, tránh ánh nắng và nguồn nhiệt, cách tường khoảng 15–20 cm. Không mở cửa tủ quá lâu và cần kiểm tra gioăng cửa thường xuyên. Gioăng bị hở làm hơi lạnh thoát ra, khiến máy nén phải hoạt động nhiều hơn. Không nên cho thức ăn nóng vào tủ và cần bọc kín thực phẩm trước khi bảo quản.",
      buttons: [
        { label: "Có cho thức ăn nóng vào tủ?", action: { type: "goto", nodeId: "tips.fridge.hotfood" } },
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.fridge.hotfood": {
      id: "tips.fridge.hotfood",
      parentId: "tips.fridge",
      parentLabel: "Sử dụng tủ lạnh",
      message:
        "Không nên. Thức ăn nóng làm nhiệt độ và độ ẩm bên trong tủ tăng, khiến hệ thống làm lạnh phải hoạt động nhiều hơn. Anh/Chị nên để thức ăn nguội đến mức phù hợp, sau đó đậy kín trước khi cho vào tủ. Việc đậy kín cũng giúp hạn chế mùi, giảm độ ẩm và tránh làm thực phẩm khác bị ảnh hưởng.",
      buttons: [
        { label: "🔙 Quay lại Sử dụng tủ lạnh", action: { type: "goto", nodeId: "tips.fridge" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.washer": {
      id: "tips.washer",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Giặt nước nóng tiêu thụ nhiều điện hơn vì phần lớn năng lượng của chu trình được dùng để đun nước. Theo cẩm nang, năng lượng đun nước có thể chiếm khoảng 90% năng lượng cần thiết để vận hành một chu trình giặt nóng. Quần áo thông thường nên giặt bằng nước lạnh. Với quần áo ít bẩn, có thể chọn chế độ giặt nhanh hoặc chế độ tiết kiệm điện.",
      buttons: [
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.fan": {
      id: "tips.fan",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Không nhất thiết. Nên đặt quạt ở vị trí tạo luồng gió phù hợp và sử dụng mức gió nhẹ hoặc trung bình. Bật tốc độ cao nhất liên tục sẽ làm tăng điện tiêu thụ nhưng không phải lúc nào cũng tạo cảm giác thoải mái hơn. Khi dùng ban đêm, nên bật chế độ hẹn giờ. Các chức năng phun sương, tạo ion hoặc đèn trang trí nên tắt nếu không cần thiết.",
      buttons: [
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.light": {
      id: "tips.light",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Cẩm nang khuyến nghị nên tắt hết đèn nếu ra khỏi phòng từ khoảng 15 phút trở lên. Mỗi đèn hoặc cụm đèn nên có công tắc riêng để chỉ bật khu vực cần sử dụng. Hãy tận dụng ánh sáng tự nhiên và thường xuyên vệ sinh bóng, máng hoặc chóa đèn. Bụi bẩn có thể làm giảm khoảng 10%–20% độ sáng của đèn.",
      buttons: [
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.rice": {
      id: "tips.rice",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Không nên. Chế độ giữ ấm kéo dài vẫn tiêu thụ điện và có thể làm cơm khô. Nên nấu cơm trước bữa ăn khoảng 30–45 phút và chỉ giữ ấm khoảng 10–15 phút sau khi cơm chín. Thường xuyên vệ sinh lòng nồi, mâm nhiệt và van thoát hơi để tăng hiệu quả truyền nhiệt. Không dùng chung ổ cắm với thiết bị có công suất lớn.",
      buttons: [
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.kettle": {
      id: "tips.kettle",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Chỉ đun lượng nước vừa đủ, đậy kín nắp và bảo đảm nước nằm trong giới hạn tối thiểu, tối đa của ấm. Không bật ấm khi không có nước và không đun liên tục nhiều lần vì mâm nhiệt có thể bị quá nóng. Cần vệ sinh cặn bám thường xuyên để tăng khả năng truyền nhiệt. Không rút phích cắm khi tay đang ướt.",
      buttons: [
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.stove": {
      id: "tips.stove",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Nên sử dụng nồi có đáy nhiễm từ và kích thước phù hợp với vùng nấu. Đặt nồi lên bếp trước khi bật và sử dụng mức nhiệt vừa phải, tránh tăng giảm công suất đột ngột. Bếp cần có ổ cắm riêng và dây dẫn đủ công suất. Với bếp từ di động, không nên rút điện ngay sau khi tắt vì quạt tản nhiệt có thể vẫn đang hoạt động.",
      buttons: [
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },
    "tips.tv": {
      id: "tips.tv",
      parentId: "tips",
      parentLabel: "Mẹo sử dụng tiết kiệm",
      message:
        "Sau khi xem, nên tắt hẳn tivi thay vì chỉ để ở chế độ chờ. Có thể rút phích nguồn nếu không sử dụng trong thời gian dài. Độ sáng, màu sắc và độ tương phản nên được điều chỉnh ở mức phù hợp, khoảng 50%, vừa hạn chế chói mắt vừa giảm điện tiêu thụ. Kích thước màn hình cũng nên phù hợp với khoảng cách xem và diện tích phòng.",
      buttons: [
        { label: "🔙 Quay lại Mẹo sử dụng", action: { type: "goto", nodeId: "tips" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 3: AN TOÀN ĐIỆN =====
    safety: {
      id: "safety",
      message: "Anh/Chị cần hướng dẫn về tình huống an toàn điện nào?",
      buttons: [
        { label: "Tay ướt và thiết bị điện", action: { type: "goto", nodeId: "safety.wet" } },
        { label: "Dây điện bị hở", action: { type: "goto", nodeId: "safety.exposed" } },
        { label: "Lắp đặt, sửa chữa điện", action: { type: "goto", nodeId: "safety.diy" } },
        { label: "Mưa bão, ngập nước", action: { type: "goto", nodeId: "safety.storm" } },
        { label: "Cháy thiết bị điện", action: { type: "goto", nodeId: "safety.fire" } },
        { label: "An toàn cho trẻ em", action: { type: "goto", nodeId: "safety.kids" } },
        { label: "Thiết bị chống rò điện", action: { type: "goto", nodeId: "safety.rccb" } },
        BACK_TO_ROOT,
      ],
    },
    "safety.wet": {
      id: "safety.wet",
      parentId: "safety",
      parentLabel: "An toàn điện",
      message:
        "Không. Khi tay ướt hoặc nền nhà ẩm, không được chạm vào ổ cắm, công tắc, cầu dao hoặc thiết bị điện. Nếu cần thao tác trong khu vực ẩm ướt, phải cắt nguồn điện trước và đứng trên vật cách điện khô. Khu vực phòng tắm, bếp hoặc nơi có nguy cơ ngập nước nên được lắp thiết bị chống rò điện phù hợp.",
      buttons: [
        { label: "🔙 Quay lại An toàn điện", action: { type: "goto", nodeId: "safety" } },
        BACK_TO_ROOT,
      ],
    },
    "safety.exposed": {
      id: "safety.exposed",
      parentId: "safety",
      parentLabel: "An toàn điện",
      message:
        "Không chạm trực tiếp vào phần dây bị hở khi chưa cắt nguồn điện. Hãy ngắt cầu dao hoặc aptomat của khu vực, cảnh báo các thành viên tránh xa và liên hệ thợ điện có chuyên môn. Không nên chỉ quấn tạm bằng băng keo rồi tiếp tục sử dụng lâu dài. Dây dẫn cần có tiết diện phù hợp với công suất và được luồn trong ống hoặc hệ thống bảo vệ.",
      buttons: [
        { label: "🔙 Quay lại An toàn điện", action: { type: "goto", nodeId: "safety" } },
        BACK_TO_ROOT,
      ],
    },
    "safety.diy": {
      id: "safety.diy",
      parentId: "safety",
      parentLabel: "An toàn điện",
      message:
        "Chỉ nên tự thực hiện những thao tác đơn giản khi có kiến thức và đã cắt nguồn điện hoàn toàn. Việc lắp đặt hoặc sửa chữa đường dây, tủ điện và thiết bị ngoài trời nên được thực hiện bởi người có chuyên môn. Thiết bị điện ngoài trời phải có hộp chống nước và tuân thủ tiêu chuẩn kỹ thuật. Khi không chắc chắn, hãy liên hệ thợ điện hoặc đơn vị quản lý điện để được hướng dẫn.",
      buttons: [
        { label: "🔙 Quay lại An toàn điện", action: { type: "goto", nodeId: "safety" } },
        BACK_TO_ROOT,
      ],
    },
    "safety.storm": {
      id: "safety.storm",
      parentId: "safety",
      parentLabel: "An toàn điện",
      message:
        "Khi có nguy cơ ngập, tốc mái hoặc đổ tường, cần cắt cầu dao điện để bảo đảm an toàn. Rút phích cắm của tivi, máy tính và tách cáp ăngten để hạn chế sét lan truyền. Không đóng mở cầu dao khi tay ướt. Tuyệt đối không chạm vào cột điện, dây điện, dây chằng, hộp công tơ hoặc thùng cầu dao khi có mưa bão.",
      buttons: [
        { label: "🔙 Quay lại An toàn điện", action: { type: "goto", nodeId: "safety" } },
        BACK_TO_ROOT,
      ],
    },
    "safety.fire": {
      id: "safety.fire",
      parentId: "safety",
      parentLabel: "An toàn điện",
      message:
        "Không dùng nước để chữa cháy khi chưa cắt nguồn điện vì nước có thể dẫn điện và gây điện giật. Trước tiên, hãy ngắt cầu dao nếu có thể thực hiện an toàn. Sau đó sử dụng bình chữa cháy phù hợp và gọi lực lượng cứu hỏa khi đám cháy vượt khả năng xử lý. Không đặt tivi, bàn là, bếp điện hoặc thiết bị phát nhiệt gần rèm, giấy và vật liệu dễ cháy.",
      buttons: [
        { label: "🔙 Quay lại An toàn điện", action: { type: "goto", nodeId: "safety" } },
        BACK_TO_ROOT,
      ],
    },
    "safety.kids": {
      id: "safety.kids",
      parentId: "safety",
      parentLabel: "An toàn điện",
      message:
        "Ổ cắm ở vị trí trẻ có thể tiếp cận cần được lắp nắp che hoặc thiết bị bảo vệ. Không để dây sạc, dây điện hoặc ổ cắm kéo dài trong tầm với của trẻ. Khi sạc xong, nên rút bộ sạc khỏi ổ điện. Không cho trẻ chơi gần tủ điện, cầu dao, thiết bị phát nhiệt hoặc khu vực có dây điện hở. Người lớn cần thường xuyên kiểm tra ổ cắm và thiết bị điện trong nhà.",
      buttons: [
        { label: "🔙 Quay lại An toàn điện", action: { type: "goto", nodeId: "safety" } },
        BACK_TO_ROOT,
      ],
    },
    "safety.rccb": {
      id: "safety.rccb",
      parentId: "safety",
      parentLabel: "An toàn điện",
      message:
        "Nên lắp thiết bị chống rò điện, đặc biệt tại phòng tắm, nhà bếp, sân ngoài trời và khu vực có nguy cơ ẩm ướt hoặc ngập nước. Thiết bị đóng cắt và bảo vệ phải được lựa chọn phù hợp với tổng công suất sử dụng. Aptomat không đúng công suất có thể không bảo vệ hiệu quả khi quá tải, chạm chập hoặc rò điện.",
      buttons: [
        { label: "🔙 Quay lại An toàn điện", action: { type: "goto", nodeId: "safety" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 4: ĐIỆN MẶT TRỜI =====
    solar: {
      id: "solar",
      message: "Anh/Chị muốn tìm hiểu nội dung nào về điện mặt trời mái nhà?",
      buttons: [
        { label: "Điện mặt trời mái nhà là gì?", action: { type: "goto", nodeId: "solar.what" } },
        { label: "Các loại hệ thống", action: { type: "goto", nodeId: "solar.types" } },
        { label: "Lợi ích", action: { type: "goto", nodeId: "solar.benefit" } },
        { label: "Có cần pin lưu trữ?", action: { type: "goto", nodeId: "solar.battery" } },
        { label: "Lưu ý khi lắp đặt", action: { type: "goto", nodeId: "solar.install" } },
        { label: "Bảo trì và vệ sinh", action: { type: "goto", nodeId: "solar.maintain" } },
        { label: "Quy định và thủ tục", action: { type: "goto", nodeId: "solar.procedure" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.what": {
      id: "solar.what",
      parentId: "solar",
      parentLabel: "Điện mặt trời",
      message:
        "Điện mặt trời mái nhà là hệ thống sử dụng các tấm quang điện được lắp trên mái hoặc gắn với công trình để sản xuất điện. Điện tạo ra có thể được sử dụng trực tiếp cho các thiết bị trong gia đình. Khi sản lượng không đủ, gia đình sử dụng thêm điện lưới. Việc xử lý phần điện dư cần thực hiện theo quy định pháp luật và cơ chế áp dụng tại thời điểm triển khai.",
      buttons: [
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.types": {
      id: "solar.types",
      parentId: "solar",
      parentLabel: "Điện mặt trời",
      message:
        "Cẩm nang giới thiệu ba mô hình phổ biến: hệ thống độc lập Off-grid, hệ thống nối lưới On-grid và hệ thống kết hợp Hybrid. Off-grid thường sử dụng pin lưu trữ và không phụ thuộc lưới điện. On-grid hoạt động cùng lưới điện. Hybrid kết hợp nối lưới với pin lưu trữ. Việc lựa chọn mô hình cần dựa trên nhu cầu, khả năng mất điện, thời gian sử dụng và ngân sách của gia đình.",
      buttons: [
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.benefit": {
      id: "solar.benefit",
      parentId: "solar",
      parentLabel: "Điện mặt trời",
      message:
        "Điện mặt trời mái nhà tận dụng diện tích mái sẵn có, không cần sử dụng thêm đất và có thể hỗ trợ giảm nóng cho công trình. Điện được tạo ra tại nơi sử dụng nên giúp giảm lượng điện mua từ lưới trong thời gian có nắng. Hệ thống cũng góp phần giảm tác động môi trường và giảm chi phí tiền điện nếu được thiết kế phù hợp với nhu cầu tiêu thụ của gia đình.",
      buttons: [
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.battery": {
      id: "solar.battery",
      parentId: "solar",
      parentLabel: "Điện mặt trời",
      message:
        "Không phải mọi hệ thống đều bắt buộc có pin lưu trữ. Hệ thống nối lưới có thể vận hành mà không cần pin, trong khi hệ thống độc lập thường cần pin để sử dụng điện khi không có nắng. Hệ thống Hybrid kết hợp cả lưới điện và pin. Pin lưu trữ làm tăng khả năng chủ động nhưng cũng làm tăng chi phí đầu tư, yêu cầu không gian lắp đặt và bảo trì.",
      buttons: [
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.install": {
      id: "solar.install",
      parentId: "solar",
      parentLabel: "Điện mặt trời",
      message:
        "Không đứng lên tấm pin vì có thể làm vỡ hoặc xước bề mặt kính. Không lắp đặt khi tấm pin đang ướt hoặc trong điều kiện mưa gió. Tấm pin tạo ra điện một chiều nên phải đấu đúng cực và các mối nối phải được cách điện đúng kỹ thuật. Khung giá đỡ phải chắc chắn, chịu được điều kiện gió bão và phù hợp với kết cấu mái.",
      buttons: [
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.maintain": {
      id: "solar.maintain",
      parentId: "solar",
      parentLabel: "Điện mặt trời",
      message:
        "Thời gian vệ sinh phụ thuộc vào bụi, chất lượng không khí và điều kiện khu vực. Cẩm nang khuyến nghị có thể vệ sinh khoảng ba tháng một lần trong điều kiện thông thường. Vào mùa mưa, tần suất có thể giảm nếu nước mưa đã làm sạch bề mặt. Ngoài tấm pin, cần kiểm tra tủ điện, dây dẫn, đầu nối và các vị trí ốc vít quan trọng.",
      buttons: [
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.procedure": {
      id: "solar.procedure",
      parentId: "solar",
      parentLabel: "Điện mặt trời",
      message:
        "Cẩm nang tập trung chủ yếu vào lựa chọn, vận hành và bảo dưỡng hệ thống, không trình bày đầy đủ thủ tục pháp lý hiện hành. Để được hướng dẫn chính xác, Anh/Chị nên liên hệ đơn vị điện lực quản lý khu vực, cơ quan nhà nước tại địa phương hoặc tra cứu Cổng Dịch vụ công quốc gia. Quy định có thể khác nhau tùy hình thức đấu nối, công suất và nhu cầu bán điện dư.",
      buttons: [
        { label: "Tra cứu dịch vụ điện", action: { type: "goto", nodeId: "contact" } },
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 5: TRA CỨU DỊCH VỤ =====
    contact: {
      id: "contact",
      message: "Anh/Chị cần tra cứu dịch vụ nào?",
      buttons: [
        { label: "Cổng Dịch vụ công", action: { type: "goto", nodeId: "contact.dvc" } },
        { label: "Điện lực miền Bắc", action: { type: "goto", nodeId: "contact.north" } },
        { label: "Điện lực miền Trung", action: { type: "goto", nodeId: "contact.central" } },
        { label: "Điện lực miền Nam", action: { type: "goto", nodeId: "contact.south" } },
        { label: "Điện lực Hà Nội", action: { type: "goto", nodeId: "contact.hanoi" } },
        { label: "Điện lực TP. Hồ Chí Minh", action: { type: "goto", nodeId: "contact.hcmc" } },
        { label: "Chuẩn bị thông tin hỗ trợ", action: { type: "goto", nodeId: "contact.info" } },
        BACK_TO_ROOT,
      ],
    },
    "contact.dvc": {
      id: "contact.dvc",
      parentId: "contact",
      parentLabel: "Tra cứu dịch vụ điện",
      message:
        "Khách hàng có thể truy cập Cổng Dịch vụ công quốc gia để tìm kiếm và thực hiện các thủ tục hành chính trực tuyến liên quan. Khi tra cứu, Anh/Chị nên chuẩn bị thông tin chủ hợp đồng điện, địa chỉ sử dụng điện, mã khách hàng và nội dung cần hỗ trợ.",
      buttons: [
        { label: "🔙 Quay lại Tra cứu dịch vụ", action: { type: "goto", nodeId: "contact" } },
        BACK_TO_ROOT,
      ],
    },
    "contact.north": {
      id: "contact.north",
      parentId: "contact",
      parentLabel: "Tra cứu dịch vụ điện",
      message:
        "Khách hàng thuộc phạm vi Tổng công ty Điện lực miền Bắc có thể liên hệ Trung tâm Chăm sóc khách hàng qua tổng đài 1900 6769. Khi gọi, Anh/Chị nên cung cấp mã khách hàng, địa chỉ sử dụng điện và nội dung yêu cầu để được xử lý nhanh hơn.",
      buttons: [
        { label: "🔙 Quay lại Tra cứu dịch vụ", action: { type: "goto", nodeId: "contact" } },
        BACK_TO_ROOT,
      ],
    },
    "contact.central": {
      id: "contact.central",
      parentId: "contact",
      parentLabel: "Tra cứu dịch vụ điện",
      message:
        "Khách hàng thuộc phạm vi Tổng công ty Điện lực miền Trung có thể liên hệ tổng đài 1900 1909. Tổng đài hỗ trợ tiếp nhận yêu cầu về sử dụng điện, dịch vụ điện và các vấn đề liên quan tại khu vực quản lý. Anh/Chị nên chuẩn bị mã khách hàng và địa chỉ sử dụng điện trước khi liên hệ.",
      buttons: [
        { label: "🔙 Quay lại Tra cứu dịch vụ", action: { type: "goto", nodeId: "contact" } },
        BACK_TO_ROOT,
      ],
    },
    "contact.south": {
      id: "contact.south",
      parentId: "contact",
      parentLabel: "Tra cứu dịch vụ điện",
      message:
        "Khách hàng thuộc phạm vi Tổng công ty Điện lực miền Nam có thể liên hệ các số tổng đài được nêu trong cẩm nang là 1900 1006 hoặc 1900 9000. Anh/Chị cần cung cấp mã khách hàng, số điện thoại đăng ký và nội dung cần giải quyết để nhân viên xác minh và hỗ trợ.",
      buttons: [
        { label: "🔙 Quay lại Tra cứu dịch vụ", action: { type: "goto", nodeId: "contact" } },
        BACK_TO_ROOT,
      ],
    },
    "contact.hanoi": {
      id: "contact.hanoi",
      parentId: "contact",
      parentLabel: "Tra cứu dịch vụ điện",
      message:
        "Khách hàng tại Hà Nội có thể liên hệ Trung tâm Chăm sóc khách hàng Tổng công ty Điện lực thành phố Hà Nội qua tổng đài 1900 1288. Khi liên hệ, Anh/Chị nên chuẩn bị mã khách hàng hoặc thông tin địa chỉ sử dụng điện để việc tra cứu được nhanh và chính xác.",
      buttons: [
        { label: "🔙 Quay lại Tra cứu dịch vụ", action: { type: "goto", nodeId: "contact" } },
        BACK_TO_ROOT,
      ],
    },
    "contact.hcmc": {
      id: "contact.hcmc",
      parentId: "contact",
      parentLabel: "Tra cứu dịch vụ điện",
      message:
        "Khách hàng tại TP. Hồ Chí Minh có thể liên hệ Trung tâm Chăm sóc khách hàng Tổng công ty Điện lực TP. Hồ Chí Minh qua tổng đài 1900 545454. Hãy chuẩn bị mã khách hàng, địa chỉ sử dụng điện và mô tả ngắn gọn vấn đề cần hỗ trợ trước khi gọi.",
      buttons: [
        { label: "🔙 Quay lại Tra cứu dịch vụ", action: { type: "goto", nodeId: "contact" } },
        BACK_TO_ROOT,
      ],
    },
    "contact.info": {
      id: "contact.info",
      parentId: "contact",
      parentLabel: "Tra cứu dịch vụ điện",
      message:
        "Để được hỗ trợ nhanh, Anh/Chị nên chuẩn bị:\n• Mã khách hàng sử dụng điện\n• Họ tên chủ hợp đồng\n• Địa chỉ sử dụng điện\n• Số điện thoại đăng ký\n• Nội dung cần tư vấn\n• Ảnh công tơ, hóa đơn hoặc thiết bị nếu có sự cố\n• Thời điểm xảy ra sự việc",
      buttons: [
        { label: "🔙 Quay lại Tra cứu dịch vụ", action: { type: "goto", nodeId: "contact" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== ESCALATE =====
    escalate: {
      id: "escalate",
      message:
        "Để nhân viên hỗ trợ chính xác, Anh/Chị vui lòng gõ vào ô chat các thông tin sau:\n• Họ và tên\n• Tỉnh hoặc thành phố\n• Số điện thoại\n• Loại thiết bị hoặc dịch vụ cần hỗ trợ\n• Nội dung vấn đề\n• Hình ảnh liên quan nếu có\n\nNhân viên sẽ căn cứ vào thông tin này để phân loại và hỗ trợ phù hợp.",
      buttons: [BACK_TO_ROOT],
    },
  },
};
