export const UNIT_LIST = [
  { code: "DBP",  name: "Điện lực Điện Biên Phủ" },
  { code: "TG",   name: "Điện lực Tuần Giáo" },
  { code: "TA",   name: "Điện lực Thanh An" },
  { code: "NS",   name: "Điện lực Na Sang" },
  { code: "NSN",  name: "Điện lực Na Son" },
  { code: "TCH",  name: "Điện lực Tủa Chùa" },
  { code: "MA",   name: "Điện lực Mường Ảng" },
  { code: "MN",   name: "Điện lực Mường Nhé" },
  { code: "XNCT", name: "Xí nghiệp Cao thế" },
  { code: "PXPD", name: "Phân xưởng phát điện" },
  { code: "KHN",  name: "Khách hàng ngoài" },
] as const;

export type UnitCode = (typeof UNIT_LIST)[number]["code"];

export const TOPIC_TAGS = [
  "TIET_KIEM_SH",
  "TIET_KIEM_DN",
  "DMTMN_KY_THUAT",
  "DMTMN_TAI_CHINH",
  "TINH_HOA_DON",
  "THU_TUC",
  "KHAC",
] as const;

export type TopicTag = (typeof TOPIC_TAGS)[number];

export const SUGGESTED_QUESTIONS: { icon: string; text: string }[] = [
  { icon: "💰", text: "Tính tiền điện tháng này cho tôi" },
  { icon: "☀️", text: "Nên lắp bao nhiêu kW điện mặt trời cho gia đình?" },
  { icon: "📉", text: "Mẹo tiết kiệm điều hòa mùa hè" },
  { icon: "📄", text: "Thủ tục đấu nối điện mặt trời mái nhà" },
];
