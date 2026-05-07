import { MVP_OUTPUT_FORMATS } from "@/lib/output-formats";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const editId = url.searchParams.get("editId") ?? "mock-edit";
  const outputId = url.searchParams.get("outputId") ?? "still-1920x1080";
  const output = MVP_OUTPUT_FORMATS.find((format) => format.id === outputId) ?? MVP_OUTPUT_FORMATS[0];

  if (!output) {
    return Response.json({ error: "No mock output formats are configured." }, { status: 500 });
  }

  if (output.type === "video") {
    return createAttachmentResponse({
      body: [
        "MEDIA LAB mock video render",
        `Edit ID: ${editId}`,
        `Output: ${output.label} (${output.aspectLabel})`,
        "",
        "This placeholder exists because live final MoDeck rendering is not wired yet.",
        "The live MoDeck preview path is active on /generate.",
      ].join("\n"),
      contentType: "text/plain; charset=utf-8",
      filename: `quote-card-${output.id}.txt`,
    });
  }

  return createAttachmentResponse({
    body: createMockStillSvg(editId, output),
    contentType: "image/svg+xml; charset=utf-8",
    filename: `quote-card-${output.id}.svg`,
  });
}

function createAttachmentResponse({
  body,
  contentType,
  filename,
}: {
  body: string;
  contentType: string;
  filename: string;
}) {
  return new Response(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}

function createMockStillSvg(editId: string, output: (typeof MVP_OUTPUT_FORMATS)[number]) {
  const width = output.width;
  const height = output.height;
  const fontSize = Math.max(28, Math.round(width / 34));
  const labelSize = Math.max(18, Math.round(width / 80));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="MEDIA LAB mock still render">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <rect x="${width * 0.06}" y="${height * 0.08}" width="${width * 0.88}" height="${height * 0.84}" rx="24" fill="#ffffff" stroke="#0f2f57" stroke-width="6"/>
  <rect x="${width * 0.06}" y="${height * 0.82}" width="${width * 0.88}" height="${height * 0.1}" fill="#07345d"/>
  <rect x="${width * 0.12}" y="${height * 0.17}" width="${width * 0.2}" height="${height * 0.055}" fill="#e11d48"/>
  <text x="${width * 0.14}" y="${height * 0.205}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${labelSize}" font-weight="700">MOCK RENDER</text>
  <text x="${width * 0.12}" y="${height * 0.42}" fill="#06153a" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800">MEDIA LAB QUOTE CARD</text>
  <text x="${width * 0.12}" y="${height * 0.5}" fill="#334155" font-family="Arial, sans-serif" font-size="${labelSize * 1.25}">${escapeXml(output.label)} • ${escapeXml(output.aspectLabel)}</text>
  <text x="${width * 0.12}" y="${height * 0.58}" fill="#64748b" font-family="Arial, sans-serif" font-size="${labelSize}">Edit ID: ${escapeXml(editId)}</text>
  <text x="${width * 0.12}" y="${height * 0.88}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${labelSize}" font-weight="700">Preview source: MoDeck live preview / Final render: mock placeholder</text>
</svg>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
