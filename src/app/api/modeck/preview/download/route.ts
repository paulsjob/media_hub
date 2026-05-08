import sharp from "sharp";
import {
  buildQuoteBoxOptions,
  getModeckApiConfig,
  isRecord,
  MODECK_QUOTE_BOX_TEST_DECK,
  MODECK_QUOTE_BOX_TEST_MOGRT,
  parseJsonObject,
  slugify,
  type ModeckQuoteBoxOption,
} from "@/lib/modeck/quote-box-test";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = getModeckApiConfig();

  if (!config) {
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
    brand: url.searchParams.get("brand") ?? "2",
    headshotFilename: url.searchParams.get("headshotFilename") ?? "",
  };

  const previewPayload = {
    apiKey: config.apiKey,
    deck: MODECK_QUOTE_BOX_TEST_DECK,
    size: "",
    frame: 0,
    mogrt: {
      name: MODECK_QUOTE_BOX_TEST_MOGRT,
      options: buildOptions(fields),
    },
  };

  const response = await fetch(`${config.apiBaseUrl}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.apiKey,
    },
    body: JSON.stringify(previewPayload),
  });
  const responseText = await response.text();
  const responseJson = parseJsonObject(responseText);
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
  brand: string;
  headshotFilename: string;
}): ModeckQuoteBoxOption[] {
  return buildQuoteBoxOptions(fields);
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
