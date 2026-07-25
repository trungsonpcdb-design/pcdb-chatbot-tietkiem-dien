import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EVN Điện Biên — Trợ lý AI Tiết kiệm điện & ĐMTMN",
  description:
    "Chatbot tư vấn tiết kiệm điện và điện mặt trời mái nhà cho khách hàng PC Điện Biên",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
