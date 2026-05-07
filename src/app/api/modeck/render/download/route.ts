import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { getRenderDownload } from "@/lib/modeck/render-download-store";
import { MVP_OUTPUT_FORMATS } from "@/lib/output-formats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const record = getRenderDownload(token);

  if (!record) {
    return Response.json(
      { ok: false, error: "This render download link has expired. Refresh the package status and try again." },
      { status: 404 },
    );
  }

  const output = MVP_OUTPUT_FORMATS.find((format) => format.id === record.outputId);

  if (!output) {
    return Response.json({ ok: false, error: "Unknown output format." }, { status: 400 });
  }

  const upstream = await fetch(record.mediaUrl, { cache: "no-store" });

  if (!upstream.ok) {
    return Response.json(
      { ok: false, error: `Could not fetch MoDeck render media. Status ${upstream.status}.` },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const media = Buffer.from(await upstream.arrayBuffer());

  if (output.type === "still") {
    const image =
      isVideoMedia(contentType, record.mediaUrl) || !isImageMedia(contentType)
        ? await extractPngFrame(media)
        : await sharp(media).png().toBuffer();

    return createAttachmentResponse({
      body: image,
      contentType: "image/png",
      filename: `${record.filenameBase}.png`,
    });
  }

  return createAttachmentResponse({
    body: media,
    contentType: contentType || "video/mp4",
    filename: `${record.filenameBase}.mp4`,
  });
}

function isVideoMedia(contentType: string, mediaUrl: string) {
  return contentType.toLowerCase().startsWith("video/") || /\.mp4(?:[?#]|$)/i.test(mediaUrl);
}

function isImageMedia(contentType: string) {
  return contentType.toLowerCase().startsWith("image/");
}

async function extractPngFrame(video: Buffer) {
  const workDir = path.join(tmpdir(), `media-lab-modeck-${randomUUID()}`);
  const inputPath = path.join(workDir, "render.mp4");
  const outputPath = path.join(workDir, "still.png");

  await mkdir(workDir, { recursive: true });

  try {
    await writeFile(inputPath, video);
    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-f",
      "image2",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { windowsHide: true });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
      }
    });
  });
}

function createAttachmentResponse({
  body,
  contentType,
  filename,
}: {
  body: Buffer;
  contentType: string;
  filename: string;
}) {
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
