import type { ScriptTree } from "./types";

export const PICKER_ENTRIES = [
  { scriptId: "home-savings", label: "🏠 Tư vấn tiết kiệm điện trong gia đình" },
  { scriptId: "office", label: "🏢 Tư vấn tiết kiệm điện trong Văn phòng, tòa nhà, công nghiệp" },
  { scriptId: "solar", label: "☀️ Tư vấn Điện mặt trời mái nhà" },
  { scriptId: "pricing", label: "💵 Tra cứu giá bán điện" },
  { scriptId: "cskh", label: "📞 Liên hệ CSKH" },
] as const;

export const PICKER_SCRIPT_ID = "picker";

export const pickerScript: ScriptTree = {
  id: PICKER_SCRIPT_ID,
  title: "Chọn chủ đề",
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      message:
        "Xin chào! Tôi là Trợ lý AI tư vấn của Công ty Điện lực Điện Biên. Anh/Chị quan tâm chủ đề nào ạ?",
      buttons: PICKER_ENTRIES.map((e) => ({
        label: e.label,
        action: { type: "switch" as const, scriptId: e.scriptId },
      })),
    },
    "not-ready": {
      id: "not-ready",
      message:
        "Kịch bản cho chủ đề này đang được cập nhật, Anh/Chị vui lòng chọn chủ đề khác giúp mình nhé.",
      buttons: [
        { label: "🔙 Quay lại chọn chủ đề", action: { type: "picker" } },
      ],
    },
  },
};
