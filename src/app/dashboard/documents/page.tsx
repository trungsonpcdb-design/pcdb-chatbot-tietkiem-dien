import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DocumentListTable } from "@/components/dashboard/document-list-table";
import { requireDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await requireDbUser();
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { chunks: true } },
      supersededBy: { select: { id: true, title: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tài liệu (Knowledge Base)</h1>
          <p className="text-sm text-slate-500">
            Tài liệu chatbot dùng để trả lời khách hàng. Đánh dấu hết hiệu lực để không dùng nữa.
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/dashboard/documents/new">+ Upload tài liệu mới</Link>
        </Button>
      </div>

      <DocumentListTable
        isAdmin={user.role === "admin"}
        documents={docs.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          sourceType: d.sourceType,
          chunkCount: d._count.chunks,
          isActive: d.isActive,
          effectiveFrom: d.effectiveFrom?.toISOString() ?? null,
          supersededByTitle: d.supersededBy?.title ?? null,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
