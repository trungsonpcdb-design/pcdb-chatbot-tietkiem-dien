import type { ScriptTree } from "./types";

const BACK_TO_ROOT = { label: "🏠 Menu chính", action: { type: "root" as const } };
const SWITCH_TOPIC = { label: "🔄 Đổi chủ đề khác", action: { type: "picker" as const } };

export const solarScript: ScriptTree = {
  id: "solar",
  title: "Tư vấn Điện mặt trời mái nhà tự sản xuất, tự tiêu thụ",
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      message:
        "Xin chào! Tôi là Trợ lý tư vấn điện mặt trời mái nhà tự sản xuất, tự tiêu thụ.\nAnh/Chị vui lòng chọn nhóm nội dung cần tư vấn:",
      buttons: [
        { label: "🏠 Hộ gia đình", action: { type: "goto", nodeId: "household" } },
        { label: "🏭 Doanh nghiệp, nhà xưởng", action: { type: "goto", nodeId: "business" } },
        { label: "🏛️ Cơ quan, tổ chức, tài sản công", action: { type: "goto", nodeId: "publicorg" } },
        { label: "🚫 Không bán điện dư", action: { type: "goto", nodeId: "nosurplus" } },
        { label: "💰 Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        { label: "📄 Thủ tục và hồ sơ", action: { type: "goto", nodeId: "docs" } },
        { label: "⚙️ Kỹ thuật và an toàn", action: { type: "goto", nodeId: "tech" } },
        { label: "🔧 Hệ thống đã lắp đặt", action: { type: "goto", nodeId: "existing" } },
        { label: "👨‍💼 Gặp nhân viên tư vấn", action: { type: "goto", nodeId: "escalate" } },
        SWITCH_TOPIC,
      ],
    },

    // ===== NHÁNH 1: HỘ GIA ĐÌNH =====
    household: {
      id: "household",
      message: "Anh/Chị muốn tìm hiểu nội dung nào dành cho hộ gia đình?",
      buttons: [
        { label: "Nhà ở có được lắp không?", action: { type: "goto", nodeId: "household.eligible" } },
        { label: "Đấu nối hạ áp", action: { type: "goto", nodeId: "household.low_voltage" } },
        { label: "Có bán điện dư", action: { type: "goto", nodeId: "household.sale" } },
        { label: "Không nối lưới", action: { type: "goto", nodeId: "household.off_grid" } },
        { label: "Chọn công suất", action: { type: "goto", nodeId: "household.capacity" } },
        { label: "Pin lưu trữ", action: { type: "goto", nodeId: "household.battery" } },
        { label: "An toàn trước khi sử dụng", action: { type: "goto", nodeId: "household.safety" } },
        BACK_TO_ROOT,
      ],
    },
    "household.eligible": {
      id: "household.eligible",
      parentId: "household",
      parentLabel: "Hộ gia đình",
      message:
        "Có. Nhà ở riêng lẻ hoặc công trình có kết cấu dạng nhà được lắp điện mặt trời trên mái theo hình thức tự sản xuất, tự tiêu thụ, với điều kiện bảo đảm an toàn điện, an toàn xây dựng và phòng cháy, chữa cháy. Hệ thống cũng có thể được lắp trên bề mặt bao che phù hợp của công trình và được áp dụng quy định như điện mặt trời mái nhà. Trước khi lắp, nên kiểm tra khả năng chịu lực của mái và phương án đấu nối.\n\n📖 Điều 13 Văn bản hợp nhất số 52/VBHN-BCT.",
      buttons: [
        { label: "Đấu nối hạ áp", action: { type: "goto", nodeId: "household.low_voltage" } },
        { label: "Có bán điện dư", action: { type: "goto", nodeId: "household.sale" } },
        { label: "Chọn công suất", action: { type: "goto", nodeId: "household.capacity" } },
        { label: "Yêu cầu an toàn", action: { type: "goto", nodeId: "household.safety" } },
        { label: "🔙 Quay lại Hộ gia đình", action: { type: "goto", nodeId: "household" } },
        BACK_TO_ROOT,
      ],
    },
    "household.low_voltage": {
      id: "household.low_voltage",
      parentId: "household",
      parentLabel: "Hộ gia đình",
      message:
        "Anh/Chị phải gửi Thông báo theo Mẫu số 01 đến Ủy ban nhân dân cấp xã nơi lắp đặt. Thông báo được thực hiện chủ yếu qua Cổng Dịch vụ công quốc gia hoặc Ứng dụng định danh quốc gia, trước ngày dự kiến lắp đặt ít nhất 10 ngày làm việc. Trường hợp tổng công suất inverter nhỏ hơn 1 kW thì không bắt buộc thực hiện thủ tục thông báo này.\n\n📖 Điều 15 và Mẫu số 01.",
      buttons: [
        { label: "Thời hạn phản hồi 10 ngày", action: { type: "goto", nodeId: "docs.reply_time" } },
        { label: "Lưới điện quá tải", action: { type: "goto", nodeId: "surplus.reject" } },
        { label: "Có bán điện dư", action: { type: "goto", nodeId: "household.sale" } },
        { label: "🔙 Quay lại Hộ gia đình", action: { type: "goto", nodeId: "household" } },
        BACK_TO_ROOT,
      ],
    },
    "household.sale": {
      id: "household.sale",
      parentId: "household",
      parentLabel: "Hộ gia đình",
      message:
        "Hộ gia đình sử dụng nhà ở riêng lẻ, lắp điện mặt trời mái nhà tự sản xuất, tự tiêu thụ, đấu nối ở cấp điện áp hạ áp và có bán điện dư được miễn hoặc không phải điều chỉnh Giấy chứng nhận đăng ký hộ kinh doanh. Tuy nhiên, hộ gia đình vẫn phải hoàn thành thủ tục thông báo, đáp ứng yêu cầu kỹ thuật, nghiệm thu đo đếm và ký hợp đồng mua bán điện dư trước khi được thanh toán.\n\n📖 Khoản 2 Điều 13 và Điều 24.",
      buttons: [
        { label: "Hồ sơ bán điện", action: { type: "goto", nodeId: "surplus.dossier" } },
        { label: "Công tơ hai chiều", action: { type: "goto", nodeId: "tech.meter" } },
        { label: "Sản lượng được mua", action: { type: "goto", nodeId: "surplus.limit" } },
        { label: "Giá mua điện dư", action: { type: "goto", nodeId: "surplus.price" } },
        { label: "🔙 Quay lại Hộ gia đình", action: { type: "goto", nodeId: "household" } },
        BACK_TO_ROOT,
      ],
    },
    "household.off_grid": {
      id: "household.off_grid",
      parentId: "household",
      parentLabel: "Hộ gia đình",
      message:
        "Nếu hệ thống điện mặt trời mái nhà không đấu nối với hệ thống điện quốc gia và có công suất từ 100 kW trở lên, chủ sở hữu phải gửi thông báo đến Ủy ban nhân dân cấp xã nơi lắp đặt. Hệ thống dưới 100 kW không thuộc trường hợp bắt buộc thông báo theo quy định này. Dù không nối lưới, việc đầu tư và lắp đặt vẫn phải tuân thủ quy định về xây dựng, môi trường, an toàn và phòng cháy, chữa cháy.\n\n📖 Khoản 1 Điều 15.",
      buttons: [
        { label: "Chọn công suất", action: { type: "goto", nodeId: "household.capacity" } },
        { label: "Pin lưu trữ", action: { type: "goto", nodeId: "household.battery" } },
        { label: "An toàn điện", action: { type: "goto", nodeId: "tech.safety" } },
        { label: "🔙 Quay lại Hộ gia đình", action: { type: "goto", nodeId: "household" } },
        BACK_TO_ROOT,
      ],
    },
    "household.capacity": {
      id: "household.capacity",
      parentId: "household",
      parentLabel: "Hộ gia đình",
      message:
        "Không hoàn toàn. Công suất lắp đặt phải phù hợp với nhu cầu phụ tải và không được vượt quá công suất tối đa Pmax xác định theo thông số điện áp, dòng điện và hệ số đo lường của công tơ. Công suất phát triển điện mặt trời mái nhà được xác định theo tổng công suất định mức của inverter. Với hệ thống không đấu nối lưới điện quốc gia, chủ sở hữu tự tính toán công suất phù hợp với nhu cầu sử dụng.\n\n📖 Điều 11 và khoản 5 Điều 13.",
      buttons: [
        { label: "Công suất inverter và tấm pin", action: { type: "goto", nodeId: "tech.inverter" } },
        { label: "Pmax là gì?", action: { type: "goto", nodeId: "tech.pmax" } },
        { label: "Nhờ điện lực hướng dẫn", action: { type: "goto", nodeId: "tech.support" } },
        { label: "Pin lưu trữ", action: { type: "goto", nodeId: "household.battery" } },
        { label: "🔙 Quay lại Hộ gia đình", action: { type: "goto", nodeId: "household" } },
        BACK_TO_ROOT,
      ],
    },
    "household.battery": {
      id: "household.battery",
      parentId: "household",
      parentLabel: "Hộ gia đình",
      message:
        "Có. Pháp luật khuyến khích lắp hệ thống lưu trữ phù hợp với công suất nguồn điện và nhu cầu phụ tải. Pin có thể tích điện vào thời điểm có nắng để sử dụng khi điện mặt trời không đủ. Khi bán điện dư, sản lượng điện từ pin lưu trữ chỉ được tính vào lượng điện mua bán nếu pin được tích điện từ chính nguồn điện mặt trời mái nhà.\n\n📖 Điều 11 và Điều 14.",
      buttons: [
        { label: "Điện từ pin có được bán?", action: { type: "goto", nodeId: "surplus.battery" } },
        { label: "🔙 Quay lại Hộ gia đình", action: { type: "goto", nodeId: "household" } },
        BACK_TO_ROOT,
      ],
    },
    "household.safety": {
      id: "household.safety",
      parentId: "household",
      parentLabel: "Hộ gia đình",
      message:
        "Trước khi đưa hệ thống vào sử dụng, hộ gia đình phải thực hiện các yêu cầu về an toàn điện, an toàn xây dựng và phòng cháy, chữa cháy. Hệ thống cần được lắp đúng sơ đồ đấu nối, đúng công suất đã thông báo hoặc được cấp giấy chứng nhận và sử dụng thiết bị phù hợp. Nếu có bán điện dư, cần phối hợp với bên mua điện nghiệm thu thiết bị đo đếm trước khi ký hợp đồng.\n\n📖 Điều 21 và Điều 23.",
      buttons: [
        { label: "🔙 Quay lại Hộ gia đình", action: { type: "goto", nodeId: "household" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 2: DOANH NGHIỆP, NHÀ XƯỞNG =====
    business: {
      id: "business",
      message: "Doanh nghiệp dự kiến triển khai theo phương án nào?",
      buttons: [
        { label: "Đấu nối hạ áp", action: { type: "goto", nodeId: "business.low_voltage" } },
        { label: "Trung áp, không bán điện", action: { type: "goto", nodeId: "business.medium_no_sale" } },
        { label: "Trung áp, có bán điện", action: { type: "goto", nodeId: "business.medium_sale" } },
        { label: "Không đấu nối lưới", action: { type: "goto", nodeId: "nosurplus.off_grid" } },
        { label: "Hồ sơ đăng ký phát triển", action: { type: "goto", nodeId: "business.dossier" } },
        { label: "Thay đổi công suất/chủ sở hữu", action: { type: "goto", nodeId: "business.change" } },
        { label: "Nghiệm thu hệ thống", action: { type: "goto", nodeId: "business.acceptance" } },
        BACK_TO_ROOT,
      ],
    },
    "business.low_voltage": {
      id: "business.low_voltage",
      parentId: "business",
      parentLabel: "Doanh nghiệp",
      message:
        "Doanh nghiệp lắp điện mặt trời mái nhà đấu nối với hệ thống điện quốc gia ở cấp hạ áp phải gửi Thông báo theo Mẫu số 01 đến Ủy ban nhân dân cấp xã nơi lắp đặt. Thông báo phải được gửi trước ngày dự kiến lắp đặt ít nhất 10 ngày làm việc. Nếu đăng ký bán điện dư, doanh nghiệp cần tiếp tục thực hiện thủ tục đo đếm, nghiệm thu và ký hợp đồng với bên mua điện dư.\n\n📖 Điều 15 và Điều 24.",
      buttons: [
        { label: "Mẫu số 01", action: { type: "goto", nodeId: "docs.form01" } },
        { label: "Lưới điện quá tải", action: { type: "goto", nodeId: "surplus.reject" } },
        { label: "Nghiệm thu", action: { type: "goto", nodeId: "business.acceptance" } },
        { label: "🔙 Quay lại Doanh nghiệp", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.medium_no_sale": {
      id: "business.medium_no_sale",
      parentId: "business",
      parentLabel: "Doanh nghiệp",
      message:
        "Doanh nghiệp phải gửi Thông báo theo Mẫu số 02 đến Ủy ban nhân dân cấp tỉnh trước ngày lắp đặt ít nhất 10 ngày làm việc. Hệ thống phải đáp ứng yêu cầu kỹ thuật, bảo vệ, giám sát và điều khiển. Chủ đầu tư phải trang bị thiết bị bật, tắt phát ngược Zero-Export; thiết bị được vận hành theo yêu cầu của cấp điều độ trong trường hợp cần thiết để bảo đảm an toàn hệ thống điện.\n\n📖 Điều 10 và Điều 15.",
      buttons: [
        { label: "Zero-Export là gì?", action: { type: "goto", nodeId: "tech.zero_export" } },
        { label: "Mẫu số 02", action: { type: "goto", nodeId: "docs.form02" } },
        { label: "Yêu cầu điều độ", action: { type: "goto", nodeId: "tech.dispatch" } },
        { label: "Nghiệm thu thiết bị", action: { type: "goto", nodeId: "business.acceptance" } },
        { label: "🔙 Quay lại Doanh nghiệp", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.medium_sale": {
      id: "business.medium_sale",
      parentId: "business",
      parentLabel: "Doanh nghiệp",
      message:
        "Trường hợp đấu nối từ trung áp trở lên và có bán điện dư, doanh nghiệp thuộc diện phải xin Giấy chứng nhận đăng ký phát triển tại Ủy ban nhân dân cấp tỉnh. Doanh nghiệp chỉ được lắp đặt sau khi được cấp giấy chứng nhận. Hệ thống còn phải trang bị thiết bị giám sát, điều khiển, kết nối với hệ thống của cấp điều độ và thỏa thuận công tơ đo đếm hai chiều với bên mua điện dư.\n\n📖 Điều 10 và Điều 16.",
      buttons: [
        { label: "Hồ sơ đăng ký", action: { type: "goto", nodeId: "business.dossier" } },
        { label: "Thời gian giải quyết", action: { type: "goto", nodeId: "business.time" } },
        { label: "Công tơ hai chiều", action: { type: "goto", nodeId: "tech.meter" } },
        { label: "Hồ sơ bán điện", action: { type: "goto", nodeId: "surplus.dossier" } },
        { label: "🔙 Quay lại Doanh nghiệp", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.dossier": {
      id: "business.dossier",
      parentId: "business",
      parentLabel: "Doanh nghiệp",
      message:
        "Hồ sơ gồm một Giấy đăng ký theo Mẫu số 03; sơ đồ lắp đặt và đấu nối nguồn điện với phụ tải và lưới điện; tài liệu về thẩm định thiết kế hoặc nghiệm thu phòng cháy, chữa cháy nếu công trình thuộc diện phải thực hiện. Hồ sơ gồm một bộ, nộp đến Ủy ban nhân dân cấp tỉnh, chủ yếu qua Cổng Dịch vụ công quốc gia hoặc Ứng dụng định danh quốc gia.\n\n📖 Điều 17.",
      buttons: [
        { label: "Thời gian cấp giấy", action: { type: "goto", nodeId: "business.time" } },
        { label: "Điều kiện cấp giấy", action: { type: "goto", nodeId: "docs.conditions" } },
        { label: "Điều chỉnh hồ sơ", action: { type: "goto", nodeId: "business.change" } },
        { label: "🔙 Quay lại Doanh nghiệp", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.time": {
      id: "business.time",
      parentId: "business",
      parentLabel: "Doanh nghiệp",
      message:
        "Nếu hồ sơ thiếu, không hợp lệ hoặc công suất không đáp ứng quy định, trong 3 ngày làm việc, Ủy ban nhân dân cấp tỉnh phải thông báo lý do để doanh nghiệp bổ sung. Với hồ sơ đầy đủ, hợp lệ, thời hạn cấp Giấy chứng nhận là 10 ngày làm việc kể từ ngày tiếp nhận. Đơn vị quản lý lưới điện được lấy ý kiến về nguy cơ quá tải và chất lượng điện năng.\n\n📖 Điều 18.",
      buttons: [
        { label: "Lưới điện quá tải", action: { type: "goto", nodeId: "surplus.reject" } },
        { label: "Điều kiện cấp giấy", action: { type: "goto", nodeId: "docs.conditions" } },
        { label: "🔙 Quay lại Doanh nghiệp", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.change": {
      id: "business.change",
      parentId: "business",
      parentLabel: "Doanh nghiệp",
      message:
        "Có. Giấy chứng nhận phải được điều chỉnh, bổ sung khi thay đổi chủ sở hữu công trình, quy mô công suất, thời gian hoàn thành lắp đặt hoặc hình thức phát và bán điện dư. Hồ sơ và trình tự điều chỉnh được thực hiện tương tự thủ tục cấp giấy lần đầu. Nếu sau 60 ngày kể từ ngày được cấp giấy mà không triển khai lắp đặt, giấy chứng nhận có thể bị xem xét thu hồi.\n\n📖 Điều 19 và Điều 20.",
      buttons: [
        { label: "Trường hợp thu hồi", action: { type: "goto", nodeId: "docs.revoke" } },
        { label: "🔙 Quay lại Doanh nghiệp", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },
    "business.acceptance": {
      id: "business.acceptance",
      parentId: "business",
      parentLabel: "Doanh nghiệp",
      message:
        "Có. Tổ chức không phải hộ gia đình phải thực hiện nghiệm thu đầu tư xây dựng theo quy định về xây dựng, điện lực, phòng cháy, chữa cháy và bảo vệ môi trường trước khi đưa hệ thống vào khai thác. Hệ thống phải bảo đảm chất lượng điện năng và an toàn vận hành. Việc không đấu nối với lưới quốc gia không làm mất nghĩa vụ tuân thủ các quy định chuyên ngành.\n\n📖 Điều 23.",
      buttons: [
        { label: "🔙 Quay lại Doanh nghiệp", action: { type: "goto", nodeId: "business" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 3: CƠ QUAN, TÀI SẢN CÔNG =====
    publicorg: {
      id: "publicorg",
      message: "Anh/Chị muốn tìm hiểu nội dung nào dành cho cơ quan, tổ chức?",
      buttons: [
        { label: "Cơ quan có được lắp không?", action: { type: "goto", nodeId: "publicorg.eligible" } },
        { label: "Chỉ tự sử dụng", action: { type: "goto", nodeId: "publicorg.selfuse" } },
        { label: "Có bán điện dư", action: { type: "goto", nodeId: "publicorg.sale" } },
        { label: "Nghiệm thu", action: { type: "goto", nodeId: "publicorg.acceptance" } },
        BACK_TO_ROOT,
      ],
    },
    "publicorg.eligible": {
      id: "publicorg.eligible",
      parentId: "publicorg",
      parentLabel: "Cơ quan, tổ chức",
      message:
        "Có. Cơ quan, tổ chức, trường học, bệnh viện và đơn vị sự nghiệp có thể lắp điện mặt trời trên mái hoặc bề mặt bao che của công trình có kết cấu dạng nhà. Công trình phải bảo đảm an toàn điện, an toàn xây dựng và phòng cháy, chữa cháy. Thủ tục thông báo hoặc đăng ký phát triển được xác định theo cấp điện áp đấu nối và việc có bán điện dư hay không.\n\n📖 Điều 13, Điều 15 và Điều 16.",
      buttons: [
        { label: "🔙 Quay lại Cơ quan", action: { type: "goto", nodeId: "publicorg" } },
        BACK_TO_ROOT,
      ],
    },
    "publicorg.selfuse": {
      id: "publicorg.selfuse",
      parentId: "publicorg",
      parentLabel: "Cơ quan, tổ chức",
      message:
        "Nếu đấu nối hạ áp, cơ quan gửi Thông báo theo Mẫu số 01 đến Ủy ban nhân dân cấp xã. Nếu đấu nối từ trung áp trở lên và không bán điện dư, cơ quan gửi Mẫu số 02 đến Ủy ban nhân dân cấp tỉnh, đồng thời trang bị thiết bị bật, tắt phát ngược và tuân thủ yêu cầu điều độ. Thông báo phải được gửi trước ngày dự kiến lắp đặt ít nhất 10 ngày làm việc.\n\n📖 Điều 10 và Điều 15.",
      buttons: [
        { label: "Mẫu số 01", action: { type: "goto", nodeId: "docs.form01" } },
        { label: "Mẫu số 02", action: { type: "goto", nodeId: "docs.form02" } },
        { label: "🔙 Quay lại Cơ quan", action: { type: "goto", nodeId: "publicorg" } },
        BACK_TO_ROOT,
      ],
    },
    "publicorg.sale": {
      id: "publicorg.sale",
      parentId: "publicorg",
      parentLabel: "Cơ quan, tổ chức",
      message:
        "Có thể. Điện mặt trời mái nhà lắp tại công trình là tài sản công thuộc nhóm được bán điện dư. Tuy nhiên, việc mua bán phải đồng thời tuân thủ quy định về quản lý, sử dụng tài sản công, các quy định pháp luật liên quan và phải phù hợp với chức năng, nhiệm vụ của đơn vị bán điện. Cơ quan vẫn phải hoàn thành thủ tục phát triển, nghiệm thu, đo đếm và ký hợp đồng mua bán điện.\n\n📖 Điểm d khoản 1 Điều 14.",
      buttons: [
        { label: "Hồ sơ bán điện", action: { type: "goto", nodeId: "surplus.dossier" } },
        { label: "Sản lượng được mua", action: { type: "goto", nodeId: "surplus.limit" } },
        { label: "Giá mua điện", action: { type: "goto", nodeId: "surplus.price" } },
        { label: "🔙 Quay lại Cơ quan", action: { type: "goto", nodeId: "publicorg" } },
        BACK_TO_ROOT,
      ],
    },
    "publicorg.acceptance": {
      id: "publicorg.acceptance",
      parentId: "publicorg",
      parentLabel: "Cơ quan, tổ chức",
      message:
        "Cơ quan phải nghiệm thu đầu tư xây dựng theo quy định về xây dựng, điện lực, phòng cháy, chữa cháy và bảo vệ môi trường. Nếu hệ thống có thiết bị giám sát, điều khiển, Zero-Export hoặc công tơ đo đếm phục vụ bán điện, đơn vị điện lực phối hợp nghiệm thu theo cấp điện áp và phương án vận hành. Sau khi nhận đề nghị, đơn vị điện lực có trách nhiệm tổ chức phối hợp nghiệm thu trong 5 ngày làm việc.\n\n📖 Điều 23.",
      buttons: [
        { label: "🔙 Quay lại Cơ quan", action: { type: "goto", nodeId: "publicorg" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 4: KHÔNG BÁN ĐIỆN DƯ =====
    nosurplus: {
      id: "nosurplus",
      message: "Anh/Chị dự kiến hệ thống không bán điện dư theo phương án nào?",
      buttons: [
        { label: "Đấu nối hạ áp", action: { type: "goto", nodeId: "nosurplus.lowv" } },
        { label: "Đấu nối trung áp", action: { type: "goto", nodeId: "nosurplus.medium" } },
        { label: "Không nối lưới", action: { type: "goto", nodeId: "nosurplus.off_grid" } },
        { label: "Có cần Zero-Export?", action: { type: "goto", nodeId: "tech.zero_export" } },
        { label: "Điện phát lên lưới có được trả tiền?", action: { type: "goto", nodeId: "nosurplus.payment" } },
        BACK_TO_ROOT,
      ],
    },
    "nosurplus.lowv": {
      id: "nosurplus.lowv",
      parentId: "nosurplus",
      parentLabel: "Không bán điện dư",
      message:
        "Theo văn bản, nguồn điện đấu nối hạ áp không phải trang bị thiết bị giám sát, điều khiển hoặc Zero-Export theo yêu cầu áp dụng cho nguồn đấu nối từ trung áp trở lên. Tuy nhiên, hệ thống vẫn phải đáp ứng phương án đấu nối, an toàn điện và yêu cầu kỹ thuật của đơn vị quản lý lưới điện. Chủ đầu tư nên cung cấp sơ đồ hệ thống để được hướng dẫn phù hợp trước khi lắp đặt.\n\n📖 Điểm d khoản 5 Điều 10.",
      buttons: [
        { label: "🔙 Quay lại Không bán điện dư", action: { type: "goto", nodeId: "nosurplus" } },
        BACK_TO_ROOT,
      ],
    },
    "nosurplus.medium": {
      id: "nosurplus.medium",
      parentId: "nosurplus",
      parentLabel: "Không bán điện dư",
      message:
        "Có. Nguồn điện đấu nối từ trung áp trở lên và không bán điện dư phải trang bị thiết bị bật, tắt phát ngược. Thiết bị có thể được tích hợp trong inverter, hệ thống giám sát hoặc lắp độc lập. Thiết bị thường ở chế độ cho phép phát công suất lên lưới và được chuyển sang chế độ ngăn phát ngược theo yêu cầu của cấp điều độ khi cần bảo đảm an toàn hệ thống điện.\n\n📖 Điểm c khoản 5 Điều 10.",
      buttons: [
        { label: "Zero-Export hoạt động thế nào?", action: { type: "goto", nodeId: "tech.zero_export" } },
        { label: "Nghiệm thu thiết bị", action: { type: "goto", nodeId: "business.acceptance" } },
        { label: "Yêu cầu điều độ", action: { type: "goto", nodeId: "tech.dispatch" } },
        { label: "Mẫu số 02", action: { type: "goto", nodeId: "docs.form02" } },
        { label: "🔙 Quay lại Không bán điện dư", action: { type: "goto", nodeId: "nosurplus" } },
        BACK_TO_ROOT,
      ],
    },
    "nosurplus.payment": {
      id: "nosurplus.payment",
      parentId: "nosurplus",
      parentLabel: "Không bán điện dư",
      message:
        "Không. Việc điện thực tế phát lên lưới không đồng nghĩa với việc được thanh toán. Muốn bán điện dư, chủ sở hữu phải thuộc đối tượng được phép, hoàn thành thủ tục thông báo hoặc đăng ký phát triển, thỏa thuận đo đếm, nghiệm thu công tơ và ký hợp đồng mua bán điện. Sản lượng phát lên lưới trước khi có hợp đồng hoặc không đáp ứng điều kiện mua bán không tự động trở thành sản lượng được thanh toán.\n\n📖 Điều 14 và Điều 24.",
      buttons: [
        { label: "Ai được bán điện dư?", action: { type: "goto", nodeId: "surplus.who" } },
        { label: "🔙 Quay lại Không bán điện dư", action: { type: "goto", nodeId: "nosurplus" } },
        BACK_TO_ROOT,
      ],
    },
    "nosurplus.off_grid": {
      id: "nosurplus.off_grid",
      parentId: "nosurplus",
      parentLabel: "Không bán điện dư",
      message:
        "Với nguồn điện không đấu nối hệ thống điện quốc gia, tổ chức hoặc cá nhân tự tính toán và xác định công suất phù hợp với nhu cầu phụ tải của mình. Hệ thống không bị xác định Pmax theo công tơ đấu nối lưới, nhưng vẫn phải tuân thủ quy định về đầu tư, xây dựng, môi trường, an toàn điện và phòng cháy, chữa cháy. Hệ thống từ 100 kW trở lên phải thông báo cho Ủy ban nhân dân cấp xã.\n\n📖 Điều 11 và Điều 15.",
      buttons: [
        { label: "🔙 Quay lại Không bán điện dư", action: { type: "goto", nodeId: "nosurplus" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 5: CÓ BÁN ĐIỆN DƯ =====
    surplus: {
      id: "surplus",
      message: "Anh/Chị muốn tìm hiểu nội dung nào về bán điện dư?",
      buttons: [
        { label: "Ai được bán điện dư?", action: { type: "goto", nodeId: "surplus.who" } },
        { label: "Được bán bao nhiêu?", action: { type: "goto", nodeId: "surplus.limit" } },
        { label: "Điện từ pin lưu trữ", action: { type: "goto", nodeId: "surplus.battery" } },
        { label: "Cách tính sản lượng", action: { type: "goto", nodeId: "surplus.payment" } },
        { label: "Giá mua điện dư", action: { type: "goto", nodeId: "surplus.price" } },
        { label: "Giấy phép điện lực", action: { type: "goto", nodeId: "surplus.license" } },
        { label: "Hồ sơ bán điện", action: { type: "goto", nodeId: "surplus.dossier" } },
        { label: "Hợp đồng mua bán điện", action: { type: "goto", nodeId: "surplus.contract" } },
        { label: "Lưới điện quá tải", action: { type: "goto", nodeId: "surplus.reject" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.who": {
      id: "surplus.who",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Các nhóm được bán điện dư gồm hộ gia đình sử dụng nhà ở riêng lẻ; hệ thống đấu nối ở cấp hạ áp; hệ thống tại miền núi, biên giới, hải đảo có lưới điện nhưng chưa liên kết hệ thống điện quốc gia; hệ thống lắp tại công trình là tài sản công; và các nguồn khác có đấu nối, thuộc quy mô công suất trong quy hoạch hoặc kế hoạch, phương án phát triển lưới điện theo quy định.\n\n📖 Khoản 1 Điều 14.",
      buttons: [
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.limit": {
      id: "surplus.limit",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Thông thường, sản lượng điện dư được mua bán theo thỏa thuận nhưng không vượt quá 50% sản lượng điện phát theo cường độ bức xạ. Đến hết ngày 31/12/2030, hai bên có thể thỏa thuận tỷ lệ cao hơn 50% nếu lưới điện có khả năng tiếp nhận và bảo đảm vận hành an toàn. Khu vực miền núi, biên giới, hải đảo chưa được cấp điện từ hệ thống điện quốc gia không bị giới hạn tỷ lệ này.\n\n📖 Khoản 2 Điều 14.",
      buttons: [
        { label: "Cách tính sản lượng thanh toán", action: { type: "goto", nodeId: "surplus.payment" } },
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.battery": {
      id: "surplus.battery",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Có thể được tính nếu pin lưu trữ được tích điện từ chính nguồn điện mặt trời mái nhà. Sản lượng mua bán gồm điện dư trực tiếp từ nguồn mặt trời và điện từ hệ thống lưu trữ đã được nạp bằng nguồn điện mặt trời đó. Điện được nạp từ nguồn khác không thuộc phạm vi sản lượng điện dư nêu trong cơ chế này. Việc đo đếm và xác định sản lượng phải phù hợp với thiết kế và thỏa thuận với bên mua điện.\n\n📖 Khoản 2 Điều 14.",
      buttons: [
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.payment": {
      id: "surplus.payment",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Sản lượng phát tham chiếu trong tháng được tính từ hệ số PVout của địa phương nhân với tổng công suất định mức tấm quang điện thực tế. Hai bên thỏa thuận một tỷ lệ mua để xác định mức sản lượng tối đa được thanh toán. Nếu điện thực tế phát lên lưới cao hơn mức thỏa thuận, chỉ thanh toán theo mức thỏa thuận. Nếu thấp hơn, thanh toán toàn bộ lượng điện thực tế được công tơ ghi nhận.\n\n📖 Khoản 3 và khoản 4 Điều 14.",
      buttons: [
        { label: "Công suất inverter và tấm pin", action: { type: "goto", nodeId: "tech.inverter" } },
        { label: "Công tơ hai chiều", action: { type: "goto", nodeId: "tech.meter" } },
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.price": {
      id: "surplus.price",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Giá mua điện dư được xác định theo giá điện năng thị trường điện bình quân của năm trước liền kề, tính bằng đồng Việt Nam trên kWh. Nếu mức giá này cao hơn giá tối đa của khung giá phát điện điện mặt trời mặt đất không có pin lưu trữ tương ứng theo miền, giá mua được giới hạn bằng mức giá tối đa của khung giá đó. Mức giá được xác định chưa bao gồm thuế giá trị gia tăng.\n\n📖 Khoản 5 Điều 14.",
      buttons: [
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.license": {
      id: "surplus.license",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Tổ chức hoặc cá nhân bán điện dư phải thực hiện thủ tục cấp giấy phép hoạt động điện lực, trừ trường hợp thuộc diện được miễn theo quy định pháp luật. Việc có được miễn hay không phụ thuộc vào quy mô, tính chất và điều kiện của nguồn điện. Anh/Chị nên kiểm tra điều kiện miễn giấy phép với cơ quan quản lý hoặc đơn vị điện lực trước khi hoàn tất hợp đồng mua bán điện.\n\n📖 Khoản 6 Điều 14 và Điều 23.",
      buttons: [
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.dossier": {
      id: "surplus.dossier",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Hồ sơ gồm văn bản đề nghị bán điện; tài liệu kỹ thuật; chứng nhận xuất xứ CO; chứng nhận chất lượng CQ của tấm quang điện, inverter, pin lưu trữ nếu có và các thiết bị cấu thành khác; cùng bản sao Thông báo hoặc Giấy chứng nhận đăng ký phát triển. Bên bán chịu trách nhiệm về tính chính xác, đầy đủ và hiệu lực pháp lý của hồ sơ.\n\n📖 Khoản 1 và khoản 5 Điều 24.",
      buttons: [
        { label: "Thời gian xử lý và ký hợp đồng", action: { type: "goto", nodeId: "surplus.contract" } },
        { label: "Công tơ hai chiều", action: { type: "goto", nodeId: "tech.meter" } },
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.contract": {
      id: "surplus.contract",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Trong 5 ngày làm việc kể từ khi nhận đủ hồ sơ, bên mua điện dư có trách nhiệm phối hợp kiểm tra hiện trạng kỹ thuật, lắp đặt công tơ đo đếm, chốt chỉ số công tơ và ký hợp đồng mua bán điện. Hợp đồng được lập theo các nội dung chính tại Mẫu số 05. Thời hạn hợp đồng là 5 năm kể từ ngày hệ thống được nghiệm thu và bên bán đã cung cấp đủ hồ sơ.\n\n📖 Khoản 2, khoản 3 và khoản 4 Điều 24.",
      buttons: [
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },
    "surplus.reject": {
      id: "surplus.reject",
      parentId: "surplus",
      parentLabel: "Có bán điện dư",
      message:
        "Không phải trong mọi trường hợp. Đơn vị điện lực có quyền từ chối mua điện dư nếu việc mua điện gây quá tải lưới điện hạ áp hoặc trung áp tại khu vực. Sản lượng được mua còn phụ thuộc khả năng tiếp nhận của lưới, tỷ lệ thỏa thuận và các điều kiện vận hành an toàn. Vì vậy, chủ đầu tư nên kiểm tra khả năng tiếp nhận trước khi xác định quy mô hệ thống và phương án tài chính.\n\n📖 Điều 36 và Điều 14.",
      buttons: [
        { label: "🔙 Quay lại Có bán điện dư", action: { type: "goto", nodeId: "surplus" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 6: THỦ TỤC VÀ HỒ SƠ =====
    docs: {
      id: "docs",
      message: "Anh/Chị cần tra cứu thủ tục nào?",
      buttons: [
        { label: "Mẫu số 01", action: { type: "goto", nodeId: "docs.form01" } },
        { label: "Mẫu số 02", action: { type: "goto", nodeId: "docs.form02" } },
        { label: "Mẫu số 03 (Giấy đăng ký)", action: { type: "goto", nodeId: "business.dossier" } },
        { label: "Khi nào cần Giấy chứng nhận?", action: { type: "goto", nodeId: "docs.when_required" } },
        { label: "Thời hạn 10 ngày", action: { type: "goto", nodeId: "docs.reply_time" } },
        { label: "Cơ quan xử lý thông báo", action: { type: "goto", nodeId: "docs.processing" } },
        { label: "Điều kiện cấp Giấy chứng nhận", action: { type: "goto", nodeId: "docs.conditions" } },
        { label: "Thu hồi Giấy chứng nhận", action: { type: "goto", nodeId: "docs.revoke" } },
        { label: "Hồ sơ bán điện", action: { type: "goto", nodeId: "surplus.dossier" } },
        BACK_TO_ROOT,
      ],
    },
    "docs.form01": {
      id: "docs.form01",
      parentId: "docs",
      parentLabel: "Thủ tục và hồ sơ",
      message:
        "Mẫu số 01 dùng để thông báo lắp đặt điện mặt trời mái nhà tự sản xuất, tự tiêu thụ có đấu nối với hệ thống điện quốc gia tại cấp điện áp hạ áp. Thông báo được gửi đến Ủy ban nhân dân cấp xã nơi lắp đặt. Hệ thống có công suất inverter nhỏ hơn 1 kW không bắt buộc gửi Mẫu số 01. Người dùng nên chuẩn bị thông tin chủ sở hữu, địa điểm, công suất, sơ đồ và phương án xử lý điện dư.\n\n📖 Khoản 2 Điều 15 và Phụ lục Mẫu số 01.",
      buttons: [
        { label: "🔙 Quay lại Thủ tục", action: { type: "goto", nodeId: "docs" } },
        BACK_TO_ROOT,
      ],
    },
    "docs.form02": {
      id: "docs.form02",
      parentId: "docs",
      parentLabel: "Thủ tục và hồ sơ",
      message:
        "Mẫu số 02 áp dụng cho tổ chức hoặc cá nhân lắp điện mặt trời mái nhà đấu nối với hệ thống điện quốc gia từ cấp điện áp trung áp trở lên và không đăng ký bán điện dư. Thông báo được gửi đến Ủy ban nhân dân cấp tỉnh trước ngày dự kiến lắp đặt ít nhất 10 ngày làm việc. Hệ thống phải đáp ứng yêu cầu về Zero-Export, bảo vệ, giám sát và điều độ.\n\n📖 Khoản 3 và khoản 4 Điều 15.",
      buttons: [
        { label: "Zero-Export là gì?", action: { type: "goto", nodeId: "tech.zero_export" } },
        { label: "🔙 Quay lại Thủ tục", action: { type: "goto", nodeId: "docs" } },
        BACK_TO_ROOT,
      ],
    },
    "docs.reply_time": {
      id: "docs.reply_time",
      parentId: "docs",
      parentLabel: "Thủ tục và hồ sơ",
      message:
        "Thông báo phải được gửi trước ngày bắt đầu lắp đặt ít nhất 10 ngày làm việc. Nếu sau 10 ngày làm việc kể từ ngày gửi mà không nhận được phản hồi của cơ quan tiếp nhận, tổ chức hoặc cá nhân được phép lắp đặt theo nội dung đã thông báo và các quy định pháp luật liên quan. Nếu nhận được thông tin có nguy cơ quá tải, chủ đầu tư phải tạm dừng để phối hợp xử lý.\n\n📖 Khoản 4, khoản 5 và khoản 6 Điều 15.",
      buttons: [
        { label: "🔙 Quay lại Thủ tục", action: { type: "goto", nodeId: "docs" } },
        BACK_TO_ROOT,
      ],
    },
    "docs.processing": {
      id: "docs.processing",
      parentId: "docs",
      parentLabel: "Thủ tục và hồ sơ",
      message:
        "Trong 3 ngày làm việc, cơ quan tiếp nhận gửi bản sao điện tử của thông báo đến các đơn vị quản lý về xây dựng, phòng cháy, môi trường và đơn vị quản lý lưới điện để theo dõi, hướng dẫn. Nếu hệ thống hạ áp đăng ký bán điện dư, Ủy ban nhân dân cấp xã gửi bản sao thông báo đến Ủy ban nhân dân cấp tỉnh trong 5 ngày làm việc.\n\n📖 Khoản 4 Điều 15.",
      buttons: [
        { label: "🔙 Quay lại Thủ tục", action: { type: "goto", nodeId: "docs" } },
        BACK_TO_ROOT,
      ],
    },
    "docs.when_required": {
      id: "docs.when_required",
      parentId: "docs",
      parentLabel: "Thủ tục và hồ sơ",
      message:
        "Trường hợp bắt buộc là nguồn điện mặt trời mái nhà đấu nối với hệ thống điện quốc gia từ trung áp trở lên và có bán điện dư. Các trường hợp đấu nối khác cũng có thể đề nghị cấp giấy chứng nhận nếu có nhu cầu. Đối tượng thuộc diện đăng ký chỉ được bắt đầu lắp đặt sau khi được cấp Giấy chứng nhận đăng ký phát triển.\n\n📖 Điều 16.",
      buttons: [
        { label: "Hồ sơ đăng ký (Mẫu số 03)", action: { type: "goto", nodeId: "business.dossier" } },
        { label: "🔙 Quay lại Thủ tục", action: { type: "goto", nodeId: "docs" } },
        BACK_TO_ROOT,
      ],
    },
    "docs.conditions": {
      id: "docs.conditions",
      parentId: "docs",
      parentLabel: "Thủ tục và hồ sơ",
      message:
        "Chủ đầu tư phải có đầy đủ hồ sơ theo Điều 17; công suất đăng ký phải phù hợp quy hoạch, kế hoạch hoặc phương án phát triển lưới điện theo quy định; đồng thời phải có ý kiến của đơn vị quản lý lưới điện xác nhận hệ thống không gây quá tải trạm biến áp, lưới hạ áp hoặc lưới phân phối tại khu vực đăng ký.\n\n📖 Khoản 4 Điều 16.",
      buttons: [
        { label: "🔙 Quay lại Thủ tục", action: { type: "goto", nodeId: "docs" } },
        BACK_TO_ROOT,
      ],
    },
    "docs.revoke": {
      id: "docs.revoke",
      parentId: "docs",
      parentLabel: "Thủ tục và hồ sơ",
      message:
        "Giấy chứng nhận có thể bị thu hồi khi công trình thuộc diện thu hồi đất, giải phóng mặt bằng; chủ sở hữu đề nghị dừng phát triển hoặc vận hành; hồ sơ có tài liệu giả mạo; giấy được cấp sai thẩm quyền; sau 60 ngày kể từ ngày cấp mà chủ đầu tư không triển khai lắp đặt; hoặc thuộc trường hợp khác theo yêu cầu của cơ quan quản lý nhà nước.\n\n📖 Điều 20.",
      buttons: [
        { label: "🔙 Quay lại Thủ tục", action: { type: "goto", nodeId: "docs" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 7: KỸ THUẬT VÀ AN TOÀN =====
    tech: {
      id: "tech",
      message: "Anh/Chị cần tư vấn nội dung kỹ thuật nào?",
      buttons: [
        { label: "Công suất inverter và tấm pin", action: { type: "goto", nodeId: "tech.inverter" } },
        { label: "Công suất Pmax", action: { type: "goto", nodeId: "tech.pmax" } },
        { label: "Công tơ hai chiều", action: { type: "goto", nodeId: "tech.meter" } },
        { label: "Zero-Export", action: { type: "goto", nodeId: "tech.zero_export" } },
        { label: "Thiết bị giám sát và điều độ", action: { type: "goto", nodeId: "tech.dispatch" } },
        { label: "An toàn và PCCC", action: { type: "goto", nodeId: "tech.safety" } },
        { label: "Thiết bị đã qua sử dụng", action: { type: "goto", nodeId: "tech.used" } },
        { label: "Hướng dẫn từ điện lực", action: { type: "goto", nodeId: "tech.support" } },
        BACK_TO_ROOT,
      ],
    },
    "tech.inverter": {
      id: "tech.inverter",
      parentId: "tech",
      parentLabel: "Kỹ thuật và an toàn",
      message:
        "Công suất phát triển điện mặt trời mái nhà tự sản xuất, tự tiêu thụ được xác định theo công suất tại bộ chuyển đổi nghịch lưu inverter. Tuy nhiên, khi tính sản lượng phát theo cường độ bức xạ để xác định giới hạn điện dư, tổng công suất định mức thực tế của các tấm quang điện được sử dụng. Vì vậy, hồ sơ thường phải thể hiện cả công suất tấm pin kWp và công suất inverter kW.\n\n📖 Khoản 5 Điều 13 và Điều 14.",
      buttons: [
        { label: "🔙 Quay lại Kỹ thuật", action: { type: "goto", nodeId: "tech" } },
        BACK_TO_ROOT,
      ],
    },
    "tech.pmax": {
      id: "tech.pmax",
      parentId: "tech",
      parentLabel: "Kỹ thuật và an toàn",
      message:
        "Pmax là mức công suất tối đa mà nguồn điện tự sản xuất, tự tiêu thụ được phép lắp đặt trong trường hợp có đấu nối, được tính theo thông số điện áp, dòng điện và hệ số đo lường của công tơ. Công thức khác nhau giữa công tơ một pha và ba pha. Chủ đầu tư cần đối chiếu nhãn công tơ, biến dòng và biến áp đo lường để xác định đúng giới hạn trước khi thiết kế hệ thống.\n\n📖 Điều 11.",
      buttons: [
        { label: "🔙 Quay lại Kỹ thuật", action: { type: "goto", nodeId: "tech" } },
        BACK_TO_ROOT,
      ],
    },
    "tech.meter": {
      id: "tech.meter",
      parentId: "tech",
      parentLabel: "Kỹ thuật và an toàn",
      message:
        "Công tơ hai chiều được thỏa thuận với bên mua điện dư khi chủ sở hữu đăng ký bán điện. Với hệ thống đấu nối từ trung áp trở lên và có bán điện, công tơ hai chiều là một phần yêu cầu đo đếm, giám sát. Với hệ thống hạ áp có bán điện, bên mua điện phối hợp nghiệm thu thiết bị đo đếm và có thể kết nối dữ liệu từ xa. Không bán điện thì không phát sinh đo đếm để thanh toán điện dư.\n\n📖 Điều 10 và Điều 23.",
      buttons: [
        { label: "🔙 Quay lại Kỹ thuật", action: { type: "goto", nodeId: "tech" } },
        BACK_TO_ROOT,
      ],
    },
    "tech.zero_export": {
      id: "tech.zero_export",
      parentId: "tech",
      parentLabel: "Kỹ thuật và an toàn",
      message:
        "Zero-Export là thiết bị có chức năng cho phép hoặc ngăn công suất hữu công phát ngược lên lưới. Thiết bị có thể tích hợp trong inverter, trong hệ thống giám sát, điều khiển hoặc lắp độc lập. Theo văn bản, nguồn đấu nối từ trung áp trở lên và không bán điện dư phải trang bị thiết bị này để cấp điều độ có thể yêu cầu ngăn phát ngược khi cần bảo đảm an toàn hệ thống.\n\n📖 Điều 3 và Điều 10.",
      buttons: [
        { label: "🔙 Quay lại Kỹ thuật", action: { type: "goto", nodeId: "tech" } },
        BACK_TO_ROOT,
      ],
    },
    "tech.dispatch": {
      id: "tech.dispatch",
      parentId: "tech",
      parentLabel: "Kỹ thuật và an toàn",
      message:
        "Chủ đầu tư phải trang bị thiết bị và phương tiện kết nối với hệ thống thu thập, giám sát, điều khiển của cấp điều độ theo yêu cầu kỹ thuật được công bố. Hệ thống cũng phải có phương án đo đếm hai chiều và tuân thủ lệnh điều độ, điều khiển. Trước khi vận hành, cấp điều độ và bên mua điện phối hợp nghiệm thu hệ thống giám sát, kết nối thông tin và thiết bị đo đếm.\n\n📖 Điều 10 và Điều 23.",
      buttons: [
        { label: "🔙 Quay lại Kỹ thuật", action: { type: "goto", nodeId: "tech" } },
        BACK_TO_ROOT,
      ],
    },
    "tech.safety": {
      id: "tech.safety",
      parentId: "tech",
      parentLabel: "Kỹ thuật và an toàn",
      message:
        "Công trình phải tuân thủ quy định về đầu tư, xây dựng, đất đai, bảo vệ môi trường, an toàn điện và phòng cháy, chữa cháy. Thiết kế phải phù hợp kết cấu mái, sơ đồ đấu nối và công suất đã thông báo hoặc đăng ký. Hộ gia đình phải hoàn thành yêu cầu an toàn trước khi sử dụng; tổ chức phải thực hiện nghiệm thu theo quy định chuyên ngành trước khi đưa hệ thống vào khai thác.\n\n📖 Điều 10, Điều 13 và Điều 23.",
      buttons: [
        { label: "🔙 Quay lại Kỹ thuật", action: { type: "goto", nodeId: "tech" } },
        BACK_TO_ROOT,
      ],
    },
    "tech.used": {
      id: "tech.used",
      parentId: "tech",
      parentLabel: "Kỹ thuật và an toàn",
      message:
        "Tổ chức hoặc cá nhân không được nhập khẩu thiết bị điện đã qua sử dụng để đầu tư nguồn điện tự sản xuất, tự tiêu thụ có bán điện dư vào hệ thống điện quốc gia. Khi đề nghị bán điện dư, chủ sở hữu phải cung cấp tài liệu kỹ thuật, chứng nhận xuất xứ CO và chứng nhận chất lượng CQ của tấm pin, inverter, pin lưu trữ và các thiết bị cấu thành khác.\n\n📖 Khoản 4 Điều 10 và Điều 24.",
      buttons: [
        { label: "🔙 Quay lại Kỹ thuật", action: { type: "goto", nodeId: "tech" } },
        BACK_TO_ROOT,
      ],
    },
    "tech.support": {
      id: "tech.support",
      parentId: "tech",
      parentLabel: "Kỹ thuật và an toàn",
      message:
        "Có. Khi hệ thống đấu nối với hệ thống điện quốc gia, chủ đầu tư có thể đề nghị đơn vị điện lực quản lý lưới hướng dẫn lắp đặt và đấu nối kỹ thuật để bảo đảm an toàn. Cơ quan quản lý nhà nước và đơn vị điện lực có trách nhiệm hướng dẫn trong 5 ngày làm việc kể từ ngày nhận được Thông báo hoặc Giấy chứng nhận đăng ký phát triển.\n\n📖 Khoản 3 Điều 21.",
      buttons: [
        { label: "🔙 Quay lại Kỹ thuật", action: { type: "goto", nodeId: "tech" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== NHÁNH 8: HỆ THỐNG ĐÃ LẮP ĐẶT =====
    existing: {
      id: "existing",
      message: "Hệ thống của Anh/Chị thuộc trường hợp nào?",
      buttons: [
        { label: "Lắp trước năm 2021 (đã có hợp đồng bán)", action: { type: "goto", nodeId: "existing.pre2021" } },
        { label: "Lắp từ năm 2021 nhưng chưa làm thủ tục", action: { type: "goto", nodeId: "existing.post2021" } },
        BACK_TO_ROOT,
      ],
    },
    "existing.pre2021": {
      id: "existing.pre2021",
      parentId: "existing",
      parentLabel: "Hệ thống đã lắp đặt",
      message:
        "Có thể phát triển thêm nguồn điện mặt trời mái nhà tự sản xuất, tự tiêu thụ. Tuy nhiên, việc lắp thêm không được làm tăng quy mô công suất của nguồn điện mặt trời đã lắp trước ngày 1/1/2021 theo hợp đồng mua bán điện đã ký với đơn vị điện lực. Phần lắp thêm cần được tách bạch và thực hiện theo quy định hiện hành về tự sản xuất, tự tiêu thụ.\n\n📖 Khoản 1 quy định chuyển tiếp.",
      buttons: [
        { label: "🔙 Quay lại Hệ thống đã lắp đặt", action: { type: "goto", nodeId: "existing" } },
        BACK_TO_ROOT,
      ],
    },
    "existing.post2021": {
      id: "existing.post2021",
      parentId: "existing",
      parentLabel: "Hệ thống đã lắp đặt",
      message:
        "Nguồn điện mặt trời mái nhà phát triển từ ngày 1/1/2021 đến thời điểm văn bản có hiệu lực mà chưa thực hiện thủ tục theo Nghị định số 135/2024/NĐ-CP thì phải thực hiện theo quy định hiện hành tại văn bản hợp nhất này. Chủ sở hữu cần xác định cấp điện áp, công suất và việc có bán điện dư để chọn thủ tục thông báo hoặc đăng ký phù hợp.\n\n📖 Khoản 2 quy định chuyển tiếp.",
      buttons: [
        { label: "Thủ tục và hồ sơ", action: { type: "goto", nodeId: "docs" } },
        { label: "🔙 Quay lại Hệ thống đã lắp đặt", action: { type: "goto", nodeId: "existing" } },
        BACK_TO_ROOT,
      ],
    },

    // ===== ESCALATE =====
    escalate: {
      id: "escalate",
      message:
        "Để chuyên viên hỗ trợ chính xác, Anh/Chị vui lòng gõ vào ô chat các thông tin sau:\n• Đối tượng: hộ gia đình, doanh nghiệp hay cơ quan, tổ chức\n• Địa chỉ và tỉnh, thành phố nơi lắp đặt\n• Loại công trình: nhà ở, nhà xưởng, trụ sở hoặc công trình khác\n• Cấp điện áp đấu nối: hạ áp hay trung áp trở lên\n• Công suất tấm pin dự kiến (kWp)\n• Tổng công suất inverter dự kiến (kW)\n• Có/không lắp pin lưu trữ\n• Có/không bán điện dư\n• Hệ thống đã lắp đặt hay đang chuẩn bị đầu tư\n• Số điện thoại hoặc phương thức liên hệ\n\nThông tin này được sử dụng để phân loại trường hợp và hướng dẫn đúng thủ tục.",
      buttons: [BACK_TO_ROOT, SWITCH_TOPIC],
    },
  },
};
