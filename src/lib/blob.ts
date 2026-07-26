export interface BlobPutResult {
  url: string;
  pathname: string;
  size: number;
}

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function putPrivate(
  folder: string,
  originalName: string,
  buffer: Buffer,
  contentType: string
): Promise<BlobPutResult> {
  const timestamp = Date.now();
  const safeName = sanitize(originalName);
  const pathname = `${folder}/${timestamp}-${safeName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const res = await put(pathname, buffer, {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: res.url, pathname, size: buffer.length };
  }

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${timestamp}-${safeName}`);
  await fs.writeFile(filePath, buffer);
  return {
    url: `/uploads/${folder}/${timestamp}-${safeName}`,
    pathname,
    size: buffer.length,
  };
}

export async function fetchBlobBuffer(url: string): Promise<Buffer> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Fetch blob failed: ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}
