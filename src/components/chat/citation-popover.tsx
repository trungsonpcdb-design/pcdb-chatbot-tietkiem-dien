"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface Citation {
  marker: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number | null;
  heading: string | null;
  snippet: string;
}

export function CitationPopover({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  if (citations.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mt-1 text-xs text-[color:var(--color-evn-blue)] hover:underline">
          📎 Xem nguồn ({citations.length})
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nguồn tài liệu tham khảo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {citations.map((c) => (
            <div key={c.chunkId} className="border-l-4 border-[color:var(--color-evn-blue)] pl-3 py-1">
              <div className="text-xs font-semibold text-slate-700">
                [{c.marker}] {c.documentTitle}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {c.heading ? `${c.heading} · ` : ""}{c.pageNumber ? `Trang ${c.pageNumber}` : ""}
              </div>
              <div className="text-sm mt-1 text-slate-800 whitespace-pre-wrap">
                {c.snippet}{c.snippet.length >= 300 ? "…" : ""}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
