import { Suspense } from "react";
import { DocumentForm } from "@/components/dashboard/document-form";

export default function NewDocumentPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Upload tài liệu mới</h1>
      <p className="text-sm text-slate-500 mb-6">
        Chấp nhận PDF, DOCX, TXT tối đa 15MB. Tài liệu sẽ được extract, chia chunk và embed
        tự động — quá trình mất ~5-30 giây tuỳ độ dài.
      </p>
      <Suspense fallback={<div className="text-sm text-slate-500">Đang tải...</div>}>
        <DocumentForm />
      </Suspense>
    </div>
  );
}
