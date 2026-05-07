import sharp from "sharp";

export const dynamic = "force-dynamic";

interface ModeckPreviewOption {
  name: string;
  value: string | number;
}

export async function GET(request: Request) {
  const apiKey = process.env.MODECK_API_KEY;
  const apiBaseUrl = process.env.MODECK_API_BASE_URL;

  if (!apiKey || !apiBaseUrl) {
    return Response.json(
      { error: "Live MoDeck preview is not configured." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const size = url.searchParams.get("size") ?? "1920x1080";
  const fields = {
    quote: url.searchParams.get("quote") ?? "",
    speakerName: url.searchParams.get("speakerName") ?? "",
    speakerTitle: url.searchParams.get("speakerTitle") ?? "",
    contextLine: url.searchParams.get("contextLine") ?? "",
  };

  const previewPayload = {
    apiKey,
    deck: "MoDeck Quote Box Test 002",
    size: "",
    frame: 0,
    mogrt: {
      name: "MoDeck Quote Box Test 002",
      options: buildOptions(fields),
    },
  };

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify(previewPayload),
  });
  const responseText = await response.text();
  const responseJson = parseJson(responseText);
  const imageBase64 = extractPreviewImage(responseJson);

  if (!response.ok || !imageBase64) {
    return Response.json(
      {
        error: responseJson?.error ?? responseJson?.message ?? responseJson?.info ?? responseText,
      },
      { status: response.ok ? 502 : response.status },
    );
  }

  const sourceImage = dataUrlToBuffer(imageBase64);
  const png = await sharp(sourceImage).png().toBuffer();
  const safeName = slugify(fields.speakerName || "quote-card");

  return new Response(new Uint8Array(png), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${safeName}-${size}.png"`,
      "Content-Type": "image/png",
    },
  });
}

function buildOptions(fields: {
  quote: string;
  speakerName: string;
  speakerTitle: string;
  contextLine: string;
}): ModeckPreviewOption[] {
  return [
    { name: "QUOTE_TEXT", value: fields.quote },
    { name: "SPEAKER_NAME", value: fields.speakerName },
    { name: "SPEAKER_TITLE", value: fields.speakerTitle },
    { name: "CONTEXT_LINE", value: fields.contextLine },
    { name: "BRAND", value: 2 },
    { name: "QUOTE_FONT_SIZE", value: 75 },
    { name: "QUOTE_LINE_SPACING", value: -64 },
    { name: "QUOTE_POSITION_X", value: 200 },
    { name: "QUOTE_POSITION_y", value: 342 },
  ];
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractPreviewImage(response: Record<string, unknown> | null) {
  if (!response) {
    return null;
  }

  const previewData = isRecord(response.previewData) ? response.previewData : null;
  const candidates = [
    response.imageBase64,
    response.previewImageBase64,
    response.previewBase64,
    response.previewData,
    previewData?.preview,
    previewData?.image,
    previewData?.imageBase64,
    previewData?.previewImageBase64,
    response.image,
    response.preview,
    response.base64,
    response.data,
  ];

  return candidates.find((candidate): candidate is string => typeof candidate === "string") ?? null;
}

function dataUrlToBuffer(value: string) {
  const base64 = value.includes(",") ? value.split(",").at(1) : value;

  if (!base64) {
    throw new Error("MoDeck preview image was empty.");
  }

  return Buffer.from(base64, "base64");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
