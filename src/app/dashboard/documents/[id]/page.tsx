import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SupersedeDialog } from "@/components/dashboard/supersede-dialog";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      chunks: { orderBy: { chunkIndex: "asc" }, take: 5 },
      _count: { select: { chunks: true } },
      supersededBy: true,
      supersedes: true,
    },
  });
  if (!doc) return notFound();

  const others = await prisma.document.findMany({
    where: { id: { not: id }, isActive: true },
    select: { id: true, title: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/documents" className="text-sm text-slate-500 hover:underline">
          ← Danh sách tài liệu
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-1">{doc.title}</h1>
        <div className="text-sm text-slate-500 mt-1">
          {doc.category} · {doc.sourceType} · {doc._count.chunks} chunks · Upload {formatDate(doc.createdAt)}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-2 text-sm">
        <div><b>Hiệu lực từ:</b> {doc.effectiveFrom ? formatDate(doc.effectiveFrom).slice(0, 10) : "—"}</div>
        <div><b>Ngày ban hành:</b> {doc.publishedAt ? formatDate(doc.publishedAt).slice(0, 10) : "—"}</div>
        <div>
          <b>Trạng thái:</b>{" "}
          {doc.isActive ? (
            <span className="text-green-700">Còn hiệu lực</span>
          ) : (
            <span className="text-orange-700">
              Ngừng dùng {doc.supersededBy ? `— thay bằng: ${doc.supersededBy.title}` : ""}
            </span>
          )}
        </div>
        {doc.blobUrl && (
          <div>
            <b>File gốc:</b>{" "}
            <a
              href={`/api/serve-file?url=${encodeURIComponent(doc.blobUrl)}`}
              target="_blank"
              className="text-[color:var(--color-evn-blue)] hover:underline"
            >
              Xem / tải xuống
            </a>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {doc.isActive && <SupersedeDialog docId={doc.id} others={others} />}
        <Button variant="outline" asChild>
          <Link href="/dashboard/documents">Đóng</Link>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">5 chunk đầu tiên (preview)</h2>
        <div className="space-y-2">
          {doc.chunks.map((c) => (
            <div key={c.id} className="bg-white border rounded-lg p-3 text-sm">
              <div className="text-xs text-slate-500 mb-1">
                Chunk #{c.chunkIndex} {c.pageNumber ? `· Trang ${c.pageNumber}` : ""} {c.heading ? `· ${c.heading}` : ""}
              </div>
              <div className="whitespace-pre-wrap text-slate-700">{c.content.slice(0, 500)}{c.content.length > 500 ? "..." : ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
