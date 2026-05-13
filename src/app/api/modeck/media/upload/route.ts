import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const maxUploadBytes = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      {
        ok: false,
        error: "Choose an image file.",
      },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return Response.json(
      {
        ok: false,
        error: "Choose an image file.",
      },
      { status: 400 },
    );
  }

  if (file.size > maxUploadBytes) {
    return Response.json(
      {
        ok: false,
        error: "Image must be 10 MB or smaller.",
      },
      { status: 413 },
    );
  }

  const uploadDir = getModeckUserMediaDir();
  const filename = getSafeUploadedFilename(file.name);
  const targetPath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

  if (process.env.NODE_ENV !== "production") {
    console.info("[modeck-media-upload]", {
      filename,
      originalFilename: file.name,
      sizeBytes: file.size,
      contentType: file.type,
      uploadDir,
    });
  }

  return Response.json({
    ok: true,
    filename,
    sizeBytes: file.size,
    contentType: file.type,
  });
}

function getModeckUserMediaDir() {
  return (
    process.env.MODECK_USER_MEDIA_DIR ??
    path.join(homedir(), "MoDeck Sync", "_modk-data", "User media")
  );
}

function getSafeUploadedFilename(filename: string) {
  const parsed = path.parse(filename);
  const base = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "headshot";
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "") || ".png";

  return `media-lab-${randomUUID()}-${base}${ext}`;
}
