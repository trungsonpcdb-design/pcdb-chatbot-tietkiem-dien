import type { ScriptTree } from "./types";

const BACK_TO_ROOT = { label: "🏠 Menu chính", action: { type: "root" as const } };
const SWITCH_TOPIC = { label: "🔄 Đổi chủ đề khác", action: { type: "picker" as const } };

export const cskhScript: ScriptTree = {
  id: "cskh",
  title: "Liên hệ Chăm sóc khách hàng",
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      message: "Xin chào! Anh/Chị cần tra cứu dịch vụ chăm sóc khách hàng nào?",
      buttons: [
        { label: "🌐 Cổng Dịch vụ công", action: { type: "goto", nodeId: "dvc" } },
        { label: "📞 Điện lực miền Bắc (EVNNPC)", action: { type: "goto", nodeId: "north" } },
        { label: "📞 Điện lực miền Trung", action: { type: "goto", nodeId: "central" } },
        { label: "📞 Điện lực miền Nam", action: { type: "goto", nodeId: "south" } },
        { label: "📞 Điện lực Hà Nội", action: { type: "goto", nodeId: "hanoi" } },
        { label: "📞 Điện lực TP. Hồ Chí Minh", action: { type: "goto", nodeId: "hcmc" } },
        { label: "📋 Chuẩn bị thông tin hỗ trợ", action: { type: "goto", nodeId: "info" } },
        SWITCH_TOPIC,
      ],
    },

    dvc: {
      id: "dvc",
      parentId: "root",
      parentLabel: "CSKH",
      message:
        "Khách hàng có thể truy cập Cổng Dịch vụ công quốc gia:\n🔗 https://dichvucong.gov.vn\n\nĐể tìm kiếm và thực hiện các thủ tục hành chính trực tuyến liên quan. Khi tra cứu, Anh/Chị nên chuẩn bị:\n• Thông tin chủ hợp đồng điện\n• Địa chỉ sử dụng điện\n• Mã khách hàng\n• Nội dung cần hỗ trợ",
      buttons: [
        { label: "📋 Chuẩn bị thông tin hỗ trợ", action: { type: "goto", nodeId: "info" } },
        BACK_TO_ROOT,
      ],
    },
    north: {
      id: "north",
      parentId: "root",
      parentLabel: "CSKH",
      message:
        "Khách hàng thuộc phạm vi Tổng công ty Điện lực miền Bắc (EVNNPC) — bao gồm cả PC Điện Biên — có thể liên hệ:\n\n☎️ Tổng đài: 1900 6769\n🔗 Website: https://npc.com.vn\n\nKhi liên hệ, Anh/Chị nên cung cấp mã khách hàng, địa chỉ sử dụng điện và nội dung yêu cầu để được xử lý nhanh hơn.",
      buttons: [
        { label: "📋 Chuẩn bị thông tin hỗ trợ", action: { type: "goto", nodeId: "info" } },
        BACK_TO_ROOT,
      ],
    },
    central: {
      id: "central",
      parentId: "root",
      parentLabel: "CSKH",
      message:
        "Khách hàng thuộc phạm vi Tổng công ty Điện lực miền Trung có thể liên hệ:\n\n☎️ Tổng đài: 1900 1909\n\nTổng đài hỗ trợ tiếp nhận yêu cầu về sử dụng điện, dịch vụ điện và các vấn đề liên quan tại khu vực quản lý. Anh/Chị nên chuẩn bị mã khách hàng và địa chỉ sử dụng điện trước khi liên hệ.",
      buttons: [
        { label: "📋 Chuẩn bị thông tin hỗ trợ", action: { type: "goto", nodeId: "info" } },
        BACK_TO_ROOT,
      ],
    },
    south: {
      id: "south",
      parentId: "root",
      parentLabel: "CSKH",
      message:
        "Khách hàng thuộc phạm vi Tổng công ty Điện lực miền Nam có thể liên hệ các số tổng đài:\n\n☎️ 1900 1006\n☎️ 1900 9000\n\nAnh/Chị cần cung cấp mã khách hàng, số điện thoại đăng ký và nội dung cần giải quyết để nhân viên xác minh và hỗ trợ.",
      buttons: [
        { label: "📋 Chuẩn bị thông tin hỗ trợ", action: { type: "goto", nodeId: "info" } },
        BACK_TO_ROOT,
      ],
    },
    hanoi: {
      id: "hanoi",
      parentId: "root",
      parentLabel: "CSKH",
      message:
        "Khách hàng tại Hà Nội có thể liên hệ Trung tâm Chăm sóc khách hàng Tổng công ty Điện lực thành phố Hà Nội:\n\n☎️ Tổng đài: 1900 1288\n\nKhi liên hệ, Anh/Chị nên chuẩn bị mã khách hàng hoặc thông tin địa chỉ sử dụng điện để việc tra cứu được nhanh và chính xác.",
      buttons: [
        { label: "📋 Chuẩn bị thông tin hỗ trợ", action: { type: "goto", nodeId: "info" } },
        BACK_TO_ROOT,
      ],
    },
    hcmc: {
      id: "hcmc",
      parentId: "root",
      parentLabel: "CSKH",
      message:
        "Khách hàng tại TP. Hồ Chí Minh có thể liên hệ Trung tâm Chăm sóc khách hàng Tổng công ty Điện lực TP. Hồ Chí Minh:\n\n☎️ Tổng đài: 1900 545454\n\nHãy chuẩn bị mã khách hàng, địa chỉ sử dụng điện và mô tả ngắn gọn vấn đề cần hỗ trợ trước khi gọi.",
      buttons: [
        { label: "📋 Chuẩn bị thông tin hỗ trợ", action: { type: "goto", nodeId: "info" } },
        BACK_TO_ROOT,
      ],
    },
    info: {
      id: "info",
      parentId: "root",
      parentLabel: "CSKH",
      message:
        "Để được hỗ trợ nhanh, Anh/Chị nên chuẩn bị các thông tin sau:\n\n• Mã khách hàng sử dụng điện\n• Họ tên chủ hợp đồng\n• Địa chỉ sử dụng điện\n• Số điện thoại đăng ký\n• Nội dung cần tư vấn\n• Ảnh công tơ, hóa đơn hoặc thiết bị (nếu có sự cố)\n• Thời điểm xảy ra sự việc",
      buttons: [
        { label: "🌐 Cổng Dịch vụ công", action: { type: "goto", nodeId: "dvc" } },
        BACK_TO_ROOT,
      ],
    },
  },
};
