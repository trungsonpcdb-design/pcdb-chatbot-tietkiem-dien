"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UnansweredRowActions({
  id,
  question,
  reviewed,
}: {
  id: string;
  question: string;
  reviewed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localReviewed, setLocalReviewed] = useState(reviewed);

  async function toggle() {
    const next = !localReviewed;
    setLocalReviewed(next);
    const res = await fetch(`/api/unanswered/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewed: next }),
    });
    if (!res.ok) {
      setLocalReviewed(!next);
      toast.error("Cập nhật thất bại");
      return;
    }
    toast.success(next ? "Đã đánh dấu đã xử lý" : "Đã bỏ đánh dấu");
    startTransition(() => router.refresh());
  }

  const uploadHref = `/dashboard/documents/new?prefillTitle=${encodeURIComponent(question)}&fromQuestionId=${id}`;

  return (
    <div className="flex items-center gap-3">
      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
        <input
          type="checkbox"
          checked={localReviewed}
          disabled={pending}
          onChange={toggle}
          className="h-3.5 w-3.5 rounded border-slate-300"
        />
        Đã xử lý
      </label>
      <Link
        href={uploadHref}
        className="text-xs px-2 py-1 rounded bg-[color:var(--color-evn-blue)]/10 text-[color:var(--color-evn-blue)] hover:bg-[color:var(--color-evn-blue)]/20"
      >
        + Bổ sung tài liệu
      </Link>
    </div>
  );
}
