import type { ScriptTree } from "./types";

const BACK_TO_ROOT = { label: "🏠 Menu chính", action: { type: "root" as const } };
const SWITCH_TOPIC = { label: "🔄 Đổi chủ đề khác", action: { type: "picker" as const } };

export const officeScript: ScriptTree = {
  id: "office",
  title: "Tiết kiệm điện trong Văn phòng, tòa nhà, công nghiệp",
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      message:
        "Xin chào! Tôi là Trợ lý tư vấn sử dụng năng lượng tiết kiệm và hiệu quả.\nAnh/Chị vui lòng chọn khu vực cần tư vấn:",
      buttons: [
        { label: "🏢 Tiết kiệm điện văn phòng", action: { type: "goto", nodeId: "office" } },
        { label: "🏭 Tiết kiệm điện công nghiệp", action: { type: "goto", nodeId: "industry" } },
        { label: "🏙️ Tiết kiệm điện tòa nhà", action: { type: "goto", nodeId: "building" } },
        { label: "📊 Quản lý và kiểm toán năng lượng", action: { type: "goto", nodeId: "energy" } },
        { label: "☀️ Điện năng lượng mặt trời", action: { type: "goto", nodeId: "solar" } },
        { label: "👨‍💼 Gặp nhân viên tư vấn", action: { type: "goto", nodeId: "escalate" } },
        SWITCH_TOPIC,
      ],
    },

    // ===== NHÁNH 1: VĂN PHÒNG =====
    office: {
      id: "office",
      message: "Anh/Chị muốn tìm giải pháp cho thiết bị nào trong văn phòng?",
      buttons: [
        { label: "Điều hòa không khí", action: { type: "goto", nodeId: "office.ac" } },
        { label: "Máy in, photocopy, máy scan", action: { type: "goto", nodeId: "office.print" } },
        { label: "Máy tính", action: { type: "goto", nodeId: "office.pc" } },
        { label: "Màn hình máy tính", action: { type: "goto", nodeId: "office.monitor" } },
        { label: "Hệ thống chiếu sáng", action: { type: "goto", nodeId: "office.light" } },
        { label: "Camera giám sát", action: { type: "goto", nodeId: "office.camera" } },
        { label: "Kiểm tra toàn bộ văn phòng", action: { type: "goto", nodeId: "escalate" } },
        BACK_TO_ROOT,
      ],
    },
    "office.ac": {
      id: "office.ac",
      parentId: "office",
      parentLabel: "Tiết kiệm điện văn phòng",
      message:
        "Văn phòng nên lựa chọn điều hòa theo diện tích, số người, thiết bị sinh nhiệt và đặc điểm không gian. Ưu tiên sản phẩm có nhiều sao năng lượng, chỉ số CSPF hoặc EER cao. Công trình lớn nên thuê đơn vị chuyên môn lựa chọn hệ thống Multi-split, VRV, VRF hoặc Chiller. Tính đúng công suất và xác định vị trí lắp đặt bằng mô phỏng dòng khí có thể giúp tiết kiệm khoảng 10%–20% điện năng.",
      buttons: [
        { label: "Cài đặt nhiệt độ", action: { type: "goto", nodeId: "office.ac.temp" } },
        { label: "Hạn chế thất thoát lạnh", action: { type: "goto", nodeId: "office.ac.leak" } },
        { label: "Bảo dưỡng điều hòa", action: { type: "goto", nodeId: "office.ac.maintain" } },
        { label: "🔙 Quay lại Tiết kiệm điện văn phòng", action: { type: "goto", nodeId: "office" } },
        BACK_TO_ROOT,
      ],
    },
    "office.ac.temp": {
      id: "office.ac.temp",
      parentId: "office.ac",
      parentLabel: "Điều hòa văn phòng",
      message:
        "Nhiệt độ trong và ngoài văn phòng chỉ nên chênh nhau khoảng 7–10°C. Ban ngày có thể cài đặt từ 26–28°C; ban đêm từ 25–27°C và kết hợp quạt đảo gió. Cách vận hành này có thể giúp tiết kiệm khoảng 2%–3% điện năng tiêu thụ của điều hòa. Không nên đặt nhiệt độ quá thấp vì máy phải hoạt động liên tục, làm tăng tiền điện và giảm tuổi thọ thiết bị.",
      buttons: [
        { label: "🔙 Quay lại Điều hòa", action: { type: "goto", nodeId: "office.ac" } },
        BACK_TO_ROOT,
      ],
    },
    "office.ac.leak": {
      id: "office.ac.leak",
      parentId: "office.ac",
      parentLabel: "Điều hòa văn phòng",
      message:
        "Văn phòng nên dùng rèm hoặc màn chắn để hạn chế ánh nắng chiếu trực tiếp, đóng cửa khi điều hòa hoạt động và bảo đảm lớp vỏ công trình có khả năng cách nhiệt. Cần bố trí thông gió hợp lý, khoảng 20–30 m³ không khí tươi mỗi giờ cho một người. Cải thiện lớp vỏ công trình có thể tiết kiệm 10%–15%, kiểm soát thông gió và thất thoát lạnh tốt có thể tiết kiệm thêm 5%–7% điện điều hòa.",
      buttons: [
        { label: "🔙 Quay lại Điều hòa", action: { type: "goto", nodeId: "office.ac" } },
        BACK_TO_ROOT,
      ],
    },
    "office.ac.maintain": {
      id: "office.ac.maintain",
      parentId: "office.ac",
      parentLabel: "Điều hòa văn phòng",
      message:
        "Dàn lạnh, dàn nóng, bộ lọc và đường dẫn gió cần được kiểm tra, vệ sinh định kỳ. Không để vật cản phía trước dàn nóng hoặc để luồng khí nóng quay trở lại thiết bị. Thực hiện đầy đủ các chế độ vận hành, bảo dưỡng, sửa chữa và vệ sinh hệ thống có thể tiết kiệm khoảng 3%–5% điện năng. Tần suất cụ thể phụ thuộc môi trường bụi, thời gian sử dụng và hướng dẫn của nhà sản xuất.",
      buttons: [
        { label: "🔙 Quay lại Điều hòa", action: { type: "goto", nodeId: "office.ac" } },
        BACK_TO_ROOT,
      ],
    },
    "office.print": {
      id: "office.print",
      parentId: "office",
      parentLabel: "Tiết kiệm điện văn phòng",
      message:
        "Văn phòng nên ưu tiên thiết bị đa chức năng tích hợp in, photocopy, scan và fax để giảm số lượng máy, tiết kiệm không gian và chi phí vận hành. Cần chọn thiết bị có nhãn năng lượng, tốc độ phù hợp với khối lượng công việc và chức năng tự chuyển sang chế độ ngủ. Không nên mua máy công nghiệp công suất lớn nếu số lượng bản in hằng tháng thấp.",
      buttons: [
        { label: "Bật chế độ ngủ khi rảnh", action: { type: "goto", nodeId: "office.print.sleep" } },
        { label: "In hai mặt", action: { type: "goto", nodeId: "office.print.duplex" } },
        { label: "🔙 Quay lại Tiết kiệm điện văn phòng", action: { type: "goto", nodeId: "office" } },
        BACK_TO_ROOT,
      ],
    },
    "office.print.sleep": {
      id: "office.print.sleep",
      parentId: "office.print",
      parentLabel: "Máy in, photocopy",
      message:
        "Hãy kích hoạt chế độ ngủ để máy tự giảm điện tiêu thụ khi không có lệnh in. Chỉ bật thiết bị khi cần sử dụng và tắt nguồn nếu văn phòng nghỉ nhiều ngày. Máy photocopy không nên vận hành liên tục quá hai giờ vì nhiệt độ máy tăng có thể làm giảm chất lượng bản in và tăng điện năng. Không nên bật, tắt liên tục; sau khi tắt cần chờ khoảng 10–15 giây trước khi bật lại.",
      buttons: [
        { label: "🔙 Quay lại Máy in", action: { type: "goto", nodeId: "office.print" } },
        BACK_TO_ROOT,
      ],
    },
    "office.print.duplex": {
      id: "office.print.duplex",
      parentId: "office.print",
      parentLabel: "Máy in, photocopy",
      message:
        "Có. Khi tài liệu không yêu cầu trình bày đặc biệt, văn phòng nên chọn chế độ in hoặc photocopy hai mặt. Theo cẩm nang, giải pháp này có thể tiết kiệm khoảng 50% lượng giấy sử dụng. Trước khi in, nên kiểm tra nội dung trên màn hình, gom các tài liệu cần in và hạn chế in thử nhiều lần. Tiết kiệm giấy cũng giúp giảm số lần vận hành máy, lượng mực tiêu thụ và chi phí xử lý tài liệu.",
      buttons: [
        { label: "🔙 Quay lại Máy in", action: { type: "goto", nodeId: "office.print" } },
        BACK_TO_ROOT,
      ],
    },
    "office.pc": {
      id: "office.pc",
      parentId: "office",
      parentLabel: "Tiết kiệm điện văn phòng",
      message:
        "Khi tạm nghỉ, nên sử dụng chế độ ngủ thay vì liên tục tắt và bật máy. Cẩm nang khuyến nghị chỉ tắt hoàn toàn khi không sử dụng trên 5 giờ. Hãy giảm độ sáng màn hình, kích hoạt tính năng tiết kiệm năng lượng, đóng chương trình không cần thiết và chỉ kết nối máy in, loa hoặc webcam khi sử dụng. Ổ SSD cũng có thể giúp giảm mức tiêu thụ năng lượng và cải thiện hiệu suất máy tính.",
      buttons: [
        { label: "Chọn cấu hình phù hợp", action: { type: "goto", nodeId: "office.pc.spec" } },
        { label: "Cài đặt màn hình tiết kiệm", action: { type: "goto", nodeId: "office.monitor" } },
        { label: "🔙 Quay lại Tiết kiệm điện văn phòng", action: { type: "goto", nodeId: "office" } },
        BACK_TO_ROOT,
      ],
    },
    "office.pc.spec": {
      id: "office.pc.spec",
      parentId: "office.pc",
      parentLabel: "Máy tính văn phòng",
      message:
        "Cấu hình máy tính nên phù hợp với từng vị trí công việc. Nhân viên xử lý văn bản không cần máy có bộ xử lý hoặc card đồ họa quá mạnh; máy thiết kế mới cần cấu hình cao hơn. Nếu không lưu trữ nhiều dữ liệu, không nên mua ổ cứng có dung lượng quá lớn. Trang bị đồng loạt máy cấu hình cao hơn nhu cầu sẽ làm tăng chi phí đầu tư, công suất nguồn và điện năng tiêu thụ trong suốt thời gian sử dụng.",
      buttons: [
        { label: "🔙 Quay lại Máy tính", action: { type: "goto", nodeId: "office.pc" } },
        BACK_TO_ROOT,
      ],
    },
    "office.monitor": {
      id: "office.monitor",
      parentId: "office",
      parentLabel: "Tiết kiệm điện văn phòng",
      message:
        "Nên chọn màn hình có nhãn năng lượng và kích thước phù hợp với công việc. Nhu cầu văn phòng thông thường có thể sử dụng màn hình khoảng 19–21 inch. Trong quá trình sử dụng, hãy giảm độ sáng đến mức thoải mái, điều chỉnh độ tương phản phù hợp và thiết lập tự động tắt màn hình khi không làm việc. Màn hình lớn hoặc có độ phân giải quá cao thường tiêu thụ nhiều điện hơn màn hình vừa đủ nhu cầu.",
      buttons: [
        { label: "🔙 Quay lại Tiết kiệm điện văn phòng", action: { type: "goto", nodeId: "office" } },
        BACK_TO_ROOT,
      ],
    },
    "office.light": {
      id: "office.light",
      parentId: "office",
      parentLabel: "Tiết kiệm điện văn phòng",
      message:
        "Văn phòng nên thay đèn huỳnh quang bằng đèn LED, chia hệ thống thành từng khu vực và tận dụng ánh sáng tự nhiên. Theo cẩm nang, thay đèn bằng công nghệ LED có thể tiết kiệm khoảng 50%–70% năng lượng chiếu sáng. Cảm biến hiện diện, cảm biến ánh sáng hoặc bộ hẹn giờ có thể giúp tiết kiệm thêm khoảng 10%–25%, đặc biệt tại hành lang, nhà vệ sinh, kho và phòng họp.",
      buttons: [
        { label: "🔙 Quay lại Tiết kiệm điện văn phòng", action: { type: "goto", nodeId: "office" } },
        BACK_TO_ROOT,
      ],
    },
    "office.camera": {
      id: "office.camera",
      parentId: "office",
      parentLabel: "Tiết kiệm điện văn phòng",
      message:
        "Camera phục vụ an ninh thường cần hoạt động liên tục, vì vậy không nên rút nguồn đột ngột hoặc bật, tắt nhiều lần. Để hệ thống vận hành ổn định, cần chọn đúng loại camera cho từng khu vực, duy trì nguồn điện ổn định, vệ sinh thiết bị, kiểm tra đường truyền và cập nhật phần mềm định kỳ. Không nên lắp camera có độ phân giải, tầm nhìn hoặc chức năng cao hơn nhu cầu vì sẽ tăng chi phí thiết bị, lưu trữ và vận hành.",
      buttons: [
        { label: "🔙 Quay lại Tiết kiệm điện văn phòng", action: { type: "goto", nodeId: "office" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 2: CÔNG NGHIỆP =====
    industry: {
      id: "industry",
      message: "Doanh nghiệp cần tư vấn về hệ thống nào?",
      buttons: [
        { label: "Quản lý phụ tải điện", action: { type: "goto", nodeId: "industry.load" } },
        { label: "Động cơ và biến tần", action: { type: "goto", nodeId: "industry.motor" } },
        { label: "Máy nén khí", action: { type: "goto", nodeId: "industry.compressor" } },
        { label: "Máy bơm", action: { type: "goto", nodeId: "industry.pump" } },
        { label: "Quạt công nghiệp", action: { type: "goto", nodeId: "industry.fan" } },
        { label: "Nồi hơi", action: { type: "goto", nodeId: "industry.boiler" } },
        { label: "Hệ thống phân phối hơi", action: { type: "goto", nodeId: "industry.steam" } },
        { label: "Chiếu sáng nhà xưởng", action: { type: "goto", nodeId: "industry.light" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.load": {
      id: "industry.load",
      parentId: "industry",
      parentLabel: "Tiết kiệm điện công nghiệp",
      message:
        "Doanh nghiệp nên lập danh sách phụ tải quan trọng và phụ tải có thể điều chỉnh. Trong giờ cao điểm, có thể giảm hoặc tạm ngừng các thiết bị không cần thiết, bố trí lại lịch sản xuất và tránh khởi động đồng thời nhiều máy công suất lớn. Cần lắp thiết bị đo đếm để theo dõi công suất tác dụng, công suất phản kháng và điện năng từng khu vực. Dữ liệu đo đếm giúp phát hiện thiết bị chạy không tải và thời điểm tiêu thụ bất thường.",
      buttons: [
        { label: "SCADA/BMS", action: { type: "goto", nodeId: "industry.scada" } },
        { label: "🔙 Quay lại Công nghiệp", action: { type: "goto", nodeId: "industry" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.scada": {
      id: "industry.scada",
      parentId: "industry.load",
      parentLabel: "Quản lý phụ tải",
      message:
        "Có. SCADA hoặc hệ thống giám sát tự động giúp theo dõi liên tục điện áp, dòng điện, tần số, công suất và trạng thái thiết bị. Khi phát hiện quá tải, điện áp bất thường hoặc máy hoạt động ngoài lịch, hệ thống có thể cảnh báo để người vận hành xử lý. SCADA không tự tạo ra mức tiết kiệm nếu không có quy trình quản lý phù hợp, nhưng cung cấp dữ liệu cần thiết để tối ưu vận hành và kiểm soát tổn thất.",
      buttons: [
        { label: "🔙 Quay lại Quản lý phụ tải", action: { type: "goto", nodeId: "industry.load" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.motor": {
      id: "industry.motor",
      parentId: "industry",
      parentLabel: "Tiết kiệm điện công nghiệp",
      message:
        "Doanh nghiệp nên chọn động cơ có công suất phù hợp với tải thực tế và ưu tiên cấp hiệu suất cao như IE3, IE4 hoặc IE5. Động cơ quá lớn thường làm việc ở tải thấp và có hiệu suất kém; động cơ quá nhỏ dễ quá tải. Cần duy trì điện áp ổn định, cân bằng ba pha và kiểm soát sóng hài. Động cơ cũng phải được bôi trơn, làm mát và kiểm tra định kỳ để hạn chế ma sát, quá nhiệt và suy giảm hiệu suất.",
      buttons: [
        { label: "Khi nào nên lắp biến tần?", action: { type: "goto", nodeId: "industry.motor.vfd" } },
        { label: "Khởi động mềm vs biến tần", action: { type: "goto", nodeId: "industry.motor.soft" } },
        { label: "🔙 Quay lại Công nghiệp", action: { type: "goto", nodeId: "industry" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.motor.vfd": {
      id: "industry.motor.vfd",
      parentId: "industry.motor",
      parentLabel: "Động cơ và biến tần",
      message:
        "Biến tần phù hợp với động cơ có tải thay đổi theo thời gian, đặc biệt là quạt, bơm và máy nén khí. Thiết bị điều chỉnh tốc độ động cơ theo nhu cầu thay vì để máy luôn chạy ở tốc độ tối đa rồi tiết lưu bằng van. Theo cẩm nang, biến tần có thể giảm khoảng 5%–15% điện tiêu thụ; trong một số ứng dụng bơm và quạt, mức tiết kiệm có thể đạt tới 35%.",
      buttons: [
        { label: "🔙 Quay lại Động cơ", action: { type: "goto", nodeId: "industry.motor" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.motor.soft": {
      id: "industry.motor.soft",
      parentId: "industry.motor",
      parentLabel: "Động cơ và biến tần",
      message:
        "Không hoàn toàn. Bộ khởi động mềm chủ yếu làm giảm dòng điện và tác động cơ học khi động cơ khởi động hoặc dừng. Biến tần ngoài khả năng khởi động còn điều chỉnh tốc độ trong suốt quá trình vận hành. Nếu động cơ luôn chạy ở một tốc độ cố định, bộ khởi động mềm có thể phù hợp. Nếu lưu lượng, áp suất hoặc tải thường xuyên thay đổi, biến tần thường mang lại khả năng tiết kiệm điện lớn hơn.",
      buttons: [
        { label: "🔙 Quay lại Động cơ", action: { type: "goto", nodeId: "industry.motor" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.compressor": {
      id: "industry.compressor",
      parentId: "industry",
      parentLabel: "Tiết kiệm điện công nghiệp",
      message:
        "Cần kiểm tra áp suất đặt, bộ lọc khí, hệ thống làm mát, đường ống và tình trạng rò rỉ. Không nên duy trì áp suất cao hơn nhu cầu thiết bị sử dụng. Cẩm nang cho biết giảm áp suất từ 8 xuống 7 kg/cm² có thể tiết kiệm khoảng 9% điện. Các vị trí rò rỉ phổ biến gồm mối nối, ống mềm, gioăng, van và bẫy ngưng. Có thể sử dụng thiết bị siêu âm để phát hiện rò rỉ.",
      buttons: [
        { label: "Dùng khí nén cho áp suất thấp?", action: { type: "goto", nodeId: "industry.compressor.lp" } },
        { label: "🔙 Quay lại Công nghiệp", action: { type: "goto", nodeId: "industry" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.compressor.lp": {
      id: "industry.compressor.lp",
      parentId: "industry.compressor",
      parentLabel: "Máy nén khí",
      message:
        "Cần cân nhắc kỹ. Khí nén là dạng năng lượng có chi phí cao, không nên dùng cho những công việc chỉ cần áp suất thấp nếu có thiết bị phù hợp hơn. Cẩm nang khuyến nghị các ứng dụng như khuấy, vận chuyển khí hoặc cấp khí áp suất thấp nên xem xét sử dụng quạt thổi chuyên dụng. Việc thay thế đúng thiết bị giúp giảm điện cho máy nén và tránh phải duy trì toàn bộ mạng khí nén ở áp suất cao.",
      buttons: [
        { label: "🔙 Quay lại Máy nén khí", action: { type: "goto", nodeId: "industry.compressor" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.pump": {
      id: "industry.pump",
      parentId: "industry",
      parentLabel: "Tiết kiệm điện công nghiệp",
      message:
        "Có. Máy bơm có thể vẫn hoạt động nhưng tiêu thụ điện cao do thiết kế dư công suất, van tiết lưu đóng nhiều, trở lực đường ống lớn hoặc điểm làm việc không phù hợp. Doanh nghiệp nên đo lưu lượng, cột áp, công suất và hiệu suất thực tế. Khi lưu lượng thay đổi thường xuyên, có thể sử dụng biến tần thay cho điều chỉnh bằng van. Đồng thời cần kiểm tra rò rỉ, tắc nghẽn, độ rung, vòng bi và tình trạng bánh công tác.",
      buttons: [
        { label: "🔙 Quay lại Công nghiệp", action: { type: "goto", nodeId: "industry" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.fan": {
      id: "industry.fan",
      parentId: "industry",
      parentLabel: "Tiết kiệm điện công nghiệp",
      message:
        "Nếu nhu cầu lưu lượng thay đổi, nên xem xét điều chỉnh tốc độ quạt bằng biến tần thay vì luôn chạy đủ tốc độ rồi đóng van hoặc cửa gió. Cần lựa chọn quạt đúng công suất, kiểm tra đường ống gió, bộ lọc, cánh quạt, dây đai và các vị trí gây cản trở dòng khí. Bộ lọc bẩn hoặc đường gió bố trí không hợp lý làm tăng trở lực, khiến quạt phải hoạt động với công suất cao hơn.",
      buttons: [
        { label: "🔙 Quay lại Công nghiệp", action: { type: "goto", nodeId: "industry" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.boiler": {
      id: "industry.boiler",
      parentId: "industry",
      parentLabel: "Tiết kiệm điện công nghiệp",
      message:
        "Cẩm nang cho biết nồi hơi thường vận hành hiệu quả trong khoảng 65%–85% tải. Trong nhiều trường hợp, chạy ít nồi ở mức tải hợp lý sẽ hiệu quả hơn vận hành nhiều nồi ở tải thấp. Cần kiểm soát khí dư, nhiệt độ khói, xả đáy, nước cấp và tình trạng cáu cặn. Nồi quá lớn, quá nhỏ, cũ hoặc không còn phù hợp với nhu cầu hiện tại nên được đánh giá để cải tạo hoặc thay thế.",
      buttons: [
        { label: "Vệ sinh cáu cặn và muội lò", action: { type: "goto", nodeId: "industry.boiler.scale" } },
        { label: "Tổn thất hệ thống hơi", action: { type: "goto", nodeId: "industry.steam" } },
        { label: "🔙 Quay lại Công nghiệp", action: { type: "goto", nodeId: "industry" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.boiler.scale": {
      id: "industry.boiler.scale",
      parentId: "industry.boiler",
      parentLabel: "Nồi hơi",
      message:
        "Có. Cáu cặn và muội bám tạo thành lớp cản trở trao đổi nhiệt, làm nhiệt không truyền hiệu quả sang nước hoặc sản phẩm. Cẩm nang cho biết lớp ám muội dày khoảng 3 mm có thể làm tăng khoảng 2,5% nhiên liệu sử dụng; lớp gỉ dày 1 mm trên bề mặt phía nước có thể làm tăng lượng dầu tiêu thụ khoảng 5%–8%. Vì vậy, lò và bề mặt truyền nhiệt phải được vệ sinh định kỳ.",
      buttons: [
        { label: "🔙 Quay lại Nồi hơi", action: { type: "goto", nodeId: "industry.boiler" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.steam": {
      id: "industry.steam",
      parentId: "industry",
      parentLabel: "Tiết kiệm điện công nghiệp",
      message:
        "Đường ống hơi cần có kích thước phù hợp, lớp bảo ôn tốt, độ dốc đúng và bố trí bẫy hơi tại các vị trí cần thiết. Phải thường xuyên kiểm tra rò rỉ, van, mối nối và bẫy hơi bị hỏng. Nước ngưng nên được thu hồi và đưa về hệ thống nước cấp. Theo cẩm nang, tích hợp hệ thống quản lý thu hồi hơi nước có thể giúp tăng thêm khoảng 15%–20% lượng hơi thu hồi và tiết kiệm đáng kể năng lượng.",
      buttons: [
        { label: "🔙 Quay lại Công nghiệp", action: { type: "goto", nodeId: "industry" } },
        BACK_TO_ROOT,
      ],
    },
    "industry.light": {
      id: "industry.light",
      parentId: "industry",
      parentLabel: "Tiết kiệm điện công nghiệp",
      message:
        "Doanh nghiệp nên thay đèn hiệu suất thấp bằng LED, phân vùng chiếu sáng theo dây chuyền và chỉ bật khu vực đang sản xuất. Có thể kết hợp cảm biến, bộ hẹn giờ và tận dụng ánh sáng tự nhiên qua mái hoặc cửa lấy sáng phù hợp. Cần vệ sinh đèn, chóa và bề mặt lấy sáng định kỳ. Theo cẩm nang, thay đèn huỳnh quang bằng LED có thể tiết kiệm khoảng 50%–70% điện năng chiếu sáng.",
      buttons: [
        { label: "🔙 Quay lại Công nghiệp", action: { type: "goto", nodeId: "industry" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 3: TÒA NHÀ =====
    building: {
      id: "building",
      message: "Anh/Chị cần tư vấn hệ thống nào trong tòa nhà?",
      buttons: [
        { label: "Hệ thống BMS", action: { type: "goto", nodeId: "building.bms" } },
        { label: "Điều hòa trung tâm", action: { type: "goto", nodeId: "building.ac" } },
        { label: "Chiếu sáng", action: { type: "goto", nodeId: "building.light" } },
        { label: "Vật liệu cách nhiệt", action: { type: "goto", nodeId: "building.insulation" } },
        { label: "Kính cách nhiệt", action: { type: "goto", nodeId: "building.glass" } },
        { label: "Hệ thống nước nóng", action: { type: "goto", nodeId: "building.water" } },
        { label: "Bơm và quạt", action: { type: "goto", nodeId: "building.pump" } },
        { label: "Điện mặt trời mái nhà", action: { type: "goto", nodeId: "building.solar" } },
        { label: "Đánh giá hiệu quả tòa nhà", action: { type: "goto", nodeId: "energy.audit_compare" } },
        BACK_TO_ROOT,
      ],
    },
    "building.bms": {
      id: "building.bms",
      parentId: "building",
      parentLabel: "Tiết kiệm điện tòa nhà",
      message:
        "BMS là hệ thống quản lý và điều khiển tập trung các thiết bị kỹ thuật của tòa nhà như điều hòa, chiếu sáng, bơm, điện, nước nóng và thông gió. Hệ thống giúp theo dõi nhiệt độ, điện áp, dòng điện, lịch vận hành và trạng thái thiết bị. BMS có thể cảnh báo khi thiết bị hoạt động ngoài lịch, quá tải hoặc tiêu thụ bất thường. Hiệu quả tiết kiệm phụ thuộc vào việc thiết lập đúng lịch, điểm đặt và quy trình vận hành.",
      buttons: [
        { label: "Điều khiển chiếu sáng", action: { type: "goto", nodeId: "building.light" } },
        { label: "🔙 Quay lại Tòa nhà", action: { type: "goto", nodeId: "building" } },
        BACK_TO_ROOT,
      ],
    },
    "building.ac": {
      id: "building.ac",
      parentId: "building",
      parentLabel: "Tiết kiệm điện tòa nhà",
      message:
        "Lựa chọn phụ thuộc quy mô và hình thức sử dụng. Hệ thống VRV, VRF hoặc Multi-V phù hợp với văn phòng có nhiều khu vực cần điều chỉnh riêng và dễ kết nối BMS. Chiller phù hợp với tòa nhà cao tầng, bệnh viện, nhà máy hoặc không gian rất lớn. Nhiều máy cục bộ có thể dễ lắp đặt nhưng khó quản lý và tự động hóa. Thiết kế đúng công suất, phân vùng tải và lịch vận hành quan trọng hơn việc chỉ lựa chọn loại máy.",
      buttons: [
        { label: "🔙 Quay lại Tòa nhà", action: { type: "goto", nodeId: "building" } },
        BACK_TO_ROOT,
      ],
    },
    "building.light": {
      id: "building.light",
      parentId: "building",
      parentLabel: "Tiết kiệm điện tòa nhà",
      message:
        "Hệ thống chiếu sáng nên được chia thành các vùng theo chức năng, hướng mặt trời và thời gian sử dụng. Hành lang, cầu thang, nhà vệ sinh, kho và tầng hầm nên sử dụng cảm biến chuyển động hoặc hẹn giờ. Khu vực gần cửa kính có thể dùng cảm biến ánh sáng để giảm công suất đèn khi ánh sáng tự nhiên đủ. Theo cẩm nang, cảm biến hoặc thiết bị điều khiển ánh sáng có thể giúp tiết kiệm khoảng 10%–25% điện chiếu sáng.",
      buttons: [
        { label: "🔙 Quay lại Tòa nhà", action: { type: "goto", nodeId: "building" } },
        BACK_TO_ROOT,
      ],
    },
    "building.insulation": {
      id: "building.insulation",
      parentId: "building",
      parentLabel: "Tiết kiệm điện tòa nhà",
      message:
        "Vật liệu cách nhiệt hạn chế nhiệt bên ngoài xâm nhập vào mùa hè và giảm thất thoát nhiệt vào mùa đông. Nhờ đó, hệ thống điều hòa hoặc sưởi không phải hoạt động liên tục với công suất cao. Tùy vị trí, tòa nhà có thể sử dụng tôn cách nhiệt, túi khí, sơn chống nóng, tấm XPS, thạch cao, bông thủy tinh hoặc gạch chống nóng. Việc lựa chọn cần căn cứ kết cấu, khí hậu, chống cháy và yêu cầu sử dụng.",
      buttons: [
        { label: "Túi khí cách nhiệt", action: { type: "goto", nodeId: "building.insulation.airbag" } },
        { label: "🔙 Quay lại Tòa nhà", action: { type: "goto", nodeId: "building" } },
        BACK_TO_ROOT,
      ],
    },
    "building.insulation.airbag": {
      id: "building.insulation.airbag",
      parentId: "building.insulation",
      parentLabel: "Vật liệu cách nhiệt",
      message:
        "Có thể sử dụng cho kho hàng, nhà ga, mái, trần, sàn và vách công trình. Theo cẩm nang, túi khí cách nhiệt có khả năng ngăn phần lớn nhiệt bức xạ bên ngoài, hỗ trợ giảm hấp thụ nhiệt mùa hè và thoát nhiệt mùa đông. Vật liệu cần được trải căng, cố định đúng kỹ thuật và lắp đúng vị trí. Hiệu quả thực tế phụ thuộc chất lượng vật liệu, khoảng không khí và toàn bộ cấu tạo lớp mái hoặc vách.",
      buttons: [
        { label: "🔙 Quay lại Vật liệu cách nhiệt", action: { type: "goto", nodeId: "building.insulation" } },
        BACK_TO_ROOT,
      ],
    },
    "building.glass": {
      id: "building.glass",
      parentId: "building",
      parentLabel: "Tiết kiệm điện tòa nhà",
      message:
        "Tòa nhà có thể xem xét kính phản quang, kính Low-e, kính dán an toàn hoặc kính cường lực cách nhiệt. Kính phản quang giúp giảm nhiệt và độ chói; theo cẩm nang có thể giảm gần 21% nhiệt lượng không khí tại tòa nhà cao tầng. Kính Low-e có lớp phủ giúp làm chậm truyền nhiệt và ngăn sức nóng mặt trời. Việc lựa chọn cần xét hướng công trình, tỷ lệ kính, yêu cầu lấy sáng và chi phí đầu tư.",
      buttons: [
        { label: "🔙 Quay lại Tòa nhà", action: { type: "goto", nodeId: "building" } },
        BACK_TO_ROOT,
      ],
    },
    "building.water": {
      id: "building.water",
      parentId: "building",
      parentLabel: "Tiết kiệm điện tòa nhà",
      message:
        "Tòa nhà có nhu cầu nước nóng lớn có thể kết hợp bơm nhiệt Heat Pump, năng lượng mặt trời và thiết bị điện thông thường. Hệ thống trung tâm giúp tập trung thiết bị tại khu kỹ thuật, dễ kiểm soát và bảo dưỡng. Nhiệt độ nước đầu ra nên được ổn định bằng van pha nhiệt để hạn chế nguy cơ bỏng. Cẩm nang cũng khuyến nghị tận thu nhiệt, kiểm soát lò hơi và bảo dưỡng hệ thống định kỳ từ khoảng 3–6 tháng một lần.",
      buttons: [
        { label: "🔙 Quay lại Tòa nhà", action: { type: "goto", nodeId: "building" } },
        BACK_TO_ROOT,
      ],
    },
    "building.pump": {
      id: "building.pump",
      parentId: "building",
      parentLabel: "Tiết kiệm điện tòa nhà",
      message:
        "Bơm và quạt cần được vận hành theo nhu cầu thực tế thay vì luôn chạy đủ công suất. Có thể kết nối biến tần với cảm biến áp suất, lưu lượng hoặc nhiệt độ để tự điều chỉnh tốc độ. Cần kiểm tra đường ống, van, bộ lọc, dây đai, vòng bi và tình trạng rung động. Khi tòa nhà ít người hoặc ngoài giờ làm việc, BMS có thể giảm lưu lượng thông gió, bơm nước và tắt các thiết bị không cần thiết theo từng khu vực.",
      buttons: [
        { label: "🔙 Quay lại Tòa nhà", action: { type: "goto", nodeId: "building" } },
        BACK_TO_ROOT,
      ],
    },
    "building.solar": {
      id: "building.solar",
      parentId: "building",
      parentLabel: "Tiết kiệm điện tòa nhà",
      message:
        "Điện mặt trời có thể cấp điện cho các phụ tải hoạt động ban ngày như điều hòa, chiếu sáng, bơm và thiết bị văn phòng. Hệ thống sử dụng tấm quang điện tạo dòng điện một chiều, sau đó inverter chuyển thành điện xoay chiều. Tòa nhà có thể lựa chọn hệ thống độc lập, nối lưới hoặc kết hợp lưu trữ. Quy mô cần được tính theo diện tích mái, biểu đồ phụ tải, khả năng tự sử dụng và điều kiện kỹ thuật của công trình.",
      buttons: [
        { label: "Tìm hiểu điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        { label: "🔙 Quay lại Tòa nhà", action: { type: "goto", nodeId: "building" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 4: QUẢN LÝ VÀ KIỂM TOÁN NĂNG LƯỢNG =====
    energy: {
      id: "energy",
      message: "Anh/Chị muốn tìm hiểu nội dung nào?",
      buttons: [
        { label: "Quản lý năng lượng là gì?", action: { type: "goto", nodeId: "energy.what" } },
        { label: "Lợi ích của quản lý năng lượng", action: { type: "goto", nodeId: "energy.benefit" } },
        { label: "Kiểm toán năng lượng là gì?", action: { type: "goto", nodeId: "energy.audit" } },
        { label: "Sơ bộ vs chi tiết", action: { type: "goto", nodeId: "energy.audit_compare" } },
        { label: "Quy trình kiểm toán", action: { type: "goto", nodeId: "energy.audit_process" } },
        { label: "Bắt đầu từ đâu?", action: { type: "goto", nodeId: "energy.start" } },
        BACK_TO_ROOT,
      ],
    },
    "energy.what": {
      id: "energy.what",
      parentId: "energy",
      parentLabel: "Quản lý và kiểm toán năng lượng",
      message:
        "Quản lý năng lượng là quá trình chủ động phối hợp việc cung cấp, chuyển đổi, phân phối và sử dụng năng lượng để đạt các mục tiêu kinh tế và môi trường. Mục tiêu không chỉ là giảm hóa đơn điện mà còn loại bỏ lãng phí, tối ưu vận hành, nâng cao năng suất và giảm tác động môi trường. Hệ thống quản lý năng lượng cần có chính sách, mục tiêu, kế hoạch hành động, người phụ trách và cơ chế theo dõi kết quả liên tục.",
      buttons: [
        { label: "🔙 Quay lại Quản lý NL", action: { type: "goto", nodeId: "energy" } },
        BACK_TO_ROOT,
      ],
    },
    "energy.benefit": {
      id: "energy.benefit",
      parentId: "energy",
      parentLabel: "Quản lý và kiểm toán năng lượng",
      message:
        "Hệ thống quản lý năng lượng giúp doanh nghiệp theo dõi chi phí, phát hiện lãng phí, cải thiện quy trình và nâng cao khả năng cạnh tranh. Về lâu dài, kết quả tiết kiệm có thể được đo đếm và duy trì thay vì chỉ thực hiện một chiến dịch ngắn hạn. Hệ thống còn giúp nâng cao nhận thức nhân viên, giảm sự phụ thuộc vào nguồn cung năng lượng, cải thiện hình ảnh doanh nghiệp và hỗ trợ các tiêu chuẩn quốc tế về chất lượng, năng lượng và môi trường.",
      buttons: [
        { label: "🔙 Quay lại Quản lý NL", action: { type: "goto", nodeId: "energy" } },
        BACK_TO_ROOT,
      ],
    },
    "energy.audit": {
      id: "energy.audit",
      parentId: "energy",
      parentLabel: "Quản lý và kiểm toán năng lượng",
      message:
        "Kiểm toán năng lượng là hoạt động đo lường, phân tích, tính toán và đánh giá để xác định mức tiêu thụ, tiềm năng tiết kiệm và các giải pháp sử dụng năng lượng hiệu quả. Kiểm toán giúp thiết lập cân bằng năng lượng, xác định dòng năng lượng theo từng hệ thống và lượng hóa tổn thất. Báo cáo kiểm toán cần nêu rõ giải pháp kỹ thuật, lượng năng lượng có thể tiết kiệm, lợi ích môi trường, chi phí đầu tư và hiệu quả tài chính.",
      buttons: [
        { label: "🔙 Quay lại Quản lý NL", action: { type: "goto", nodeId: "energy" } },
        BACK_TO_ROOT,
      ],
    },
    "energy.audit_compare": {
      id: "energy.audit_compare",
      parentId: "energy",
      parentLabel: "Quản lý và kiểm toán năng lượng",
      message:
        "Kiểm toán sơ bộ chủ yếu sử dụng hóa đơn, số liệu sẵn có và khảo sát nhanh để xác định các cơ hội tiết kiệm tổng quát. Kiểm toán chi tiết cần đo đạc nhiều hơn và phân tích riêng từng hệ thống như bơm, quạt, khí nén, lạnh, hơi hoặc gia nhiệt. Kết quả kiểm toán chi tiết thường bao gồm thời gian hoàn vốn, giá trị hiện tại ròng, tỷ suất hoàn vốn nội bộ và các đề xuất kỹ thuật cụ thể hơn.",
      buttons: [
        { label: "🔙 Quay lại Quản lý NL", action: { type: "goto", nodeId: "energy" } },
        BACK_TO_ROOT,
      ],
    },
    "energy.audit_process": {
      id: "energy.audit_process",
      parentId: "energy",
      parentLabel: "Quản lý và kiểm toán năng lượng",
      message:
        "Quy trình được trình bày trong cẩm nang gồm sáu bước chính: xác định phạm vi kiểm toán; thành lập nhóm kiểm toán; ước tính thời gian và kinh phí; thu thập dữ liệu hiện có; kiểm tra thực địa và đo đạc; cuối cùng là phân tích số liệu. Sau khi phân tích, doanh nghiệp cần lựa chọn giải pháp theo mức tiết kiệm, chi phí đầu tư, thời gian hoàn vốn, ảnh hưởng đến sản xuất và khả năng triển khai thực tế.",
      buttons: [
        { label: "🔙 Quay lại Quản lý NL", action: { type: "goto", nodeId: "energy" } },
        BACK_TO_ROOT,
      ],
    },
    "energy.start": {
      id: "energy.start",
      parentId: "energy",
      parentLabel: "Quản lý và kiểm toán năng lượng",
      message:
        "Trước tiên, hãy thu thập hóa đơn điện và nhiên liệu tối thiểu 12 tháng, lập danh sách thiết bị tiêu thụ lớn và xác định giờ vận hành. Tiếp theo, lắp công tơ phụ cho các hệ thống quan trọng như điều hòa, động cơ, khí nén, bơm hoặc dây chuyền sản xuất. Doanh nghiệp nên chọn một đường cơ sở năng lượng, xây dựng chỉ tiêu theo sản lượng hoặc diện tích và theo dõi định kỳ để xác định xu hướng và mức tiêu thụ bất thường.",
      buttons: [
        { label: "🔙 Quay lại Quản lý NL", action: { type: "goto", nodeId: "energy" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 5: ĐIỆN NĂNG LƯỢNG MẶT TRỜI =====
    solar: {
      id: "solar",
      message: "Anh/Chị muốn tìm hiểu nội dung nào về điện mặt trời?",
      buttons: [
        { label: "Điện mặt trời hoạt động thế nào?", action: { type: "goto", nodeId: "solar.how" } },
        { label: "Độc lập vs nối lưới", action: { type: "goto", nodeId: "solar.compare" } },
        { label: "Lắp cho tòa nhà", action: { type: "goto", nodeId: "building.solar" } },
        { label: "Cần tư vấn cụ thể", action: { type: "goto", nodeId: "escalate" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.how": {
      id: "solar.how",
      parentId: "solar",
      parentLabel: "Điện năng lượng mặt trời",
      message:
        "Các tấm quang điện hấp thụ ánh sáng mặt trời và tạo ra dòng điện một chiều. Inverter chuyển đổi dòng điện này thành điện xoay chiều để sử dụng cho thiết bị. Điện mặt trời phù hợp với phụ tải hoạt động ban ngày như điều hòa, chiếu sáng, bơm, máy tính và một số dây chuyền sản xuất. Hiệu quả phụ thuộc vào diện tích lắp đặt, bức xạ mặt trời, hướng mái, bóng che và mức độ tự sử dụng điện tại công trình.",
      buttons: [
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },
    "solar.compare": {
      id: "solar.compare",
      parentId: "solar",
      parentLabel: "Điện năng lượng mặt trời",
      message:
        "Hệ thống độc lập thường có pin lưu trữ và hoạt động không phụ thuộc lưới điện, phù hợp nơi chưa có điện hoặc nguồn điện không ổn định. Hệ thống nối lưới cung cấp điện trực tiếp cho phụ tải và sử dụng điện lưới khi điện mặt trời không đủ. Loại nối lưới thường không có lưu trữ nên chi phí đầu tư thấp hơn. Hệ thống kết hợp có thể vừa nối lưới vừa có pin nhưng yêu cầu đầu tư và quản lý phức tạp hơn.",
      buttons: [
        { label: "🔙 Quay lại Điện mặt trời", action: { type: "goto", nodeId: "solar" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== ESCALATE =====
    escalate: {
      id: "escalate",
      message:
        "Để chuyên viên hỗ trợ chính xác, Anh/Chị vui lòng gõ vào ô chat các thông tin sau:\n• Loại hình: văn phòng, nhà máy hay tòa nhà\n• Địa điểm công trình\n• Diện tích hoặc quy mô sản xuất\n• Hóa đơn điện trung bình mỗi tháng\n• Thời gian vận hành\n• Hệ thống tiêu thụ điện chính\n• Vấn đề đang gặp phải\n• Số điện thoại hoặc phương thức liên hệ\n\nThông tin này sẽ được sử dụng để phân loại nhu cầu và đề xuất giải pháp phù hợp.",
      buttons: [BACK_TO_ROOT, SWITCH_TOPIC],
    },
  },
};
