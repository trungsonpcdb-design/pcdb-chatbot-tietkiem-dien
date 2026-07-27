import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PC Điện Biên — Trợ lý AI Tiết kiệm điện & ĐMTMN",
  description:
    "Chatbot tư vấn tiết kiệm điện và điện mặt trời mái nhà cho khách hàng PC Điện Biên",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="vi">
        <body>
          {children}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
