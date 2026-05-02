import { mediaLabPayloadToModeckPreviewRequest } from "@/lib/modeck/modeck-mapping";

export const dynamic = "force-dynamic";

interface ModeckPreviewTestRequest {
  deck: string;
  mogrt: string;
  size: string;
  frame: number;
  quote: string;
  speakerName: string;
  speakerTitle: string;
  contextLine: string;
  headshotFilename: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.MODECK_API_KEY;
  const apiBaseUrl = process.env.MODECK_API_BASE_URL;

  if (!apiKey || !apiBaseUrl) {
    return Response.json(
      {
        ok: false,
        status: "disabled",
        error:
          "Live MoDeck preview is not configured. Set MODECK_API_KEY and MODECK_API_BASE_URL on the server.",
      },
      { status: 503 },
    );
  }

  const startedAt = Date.now();
  const body = (await request.json()) as Partial<ModeckPreviewTestRequest>;
  const size = parseSize(body.size ?? "1920x1080");

  if (!size) {
    return Response.json(
      {
        ok: false,
        status: "invalid_request",
        error: "Size must use WIDTHxHEIGHT format, for example 1920x1080.",
      },
      { status: 400 },
    );
  }

  const modeckRequest = mediaLabPayloadToModeckPreviewRequest({
    templateId: "template-quote-card-v2",
    packageName: "Dev MoDeck Preview Test",
    fields: {
      quote: body.quote ?? "",
      speakerName: body.speakerName ?? "",
      speakerTitle: body.speakerTitle ?? "",
      contextLine: body.contextLine ?? "",
      headshot: body.headshotFilename ?? "",
    },
    selectedOutputIds: [size.outputId],
    mediaReferences: {
      headshot: body.headshotFilename ?? "",
      headshotUploadedFilename: body.headshotFilename ?? "",
    },
    previewFrame: Number(body.frame ?? 0),
  })[0];

  const previewPayload = {
    ...modeckRequest,
    deckName: body.deck?.trim() || modeckRequest.deckName,
    mogrtName: body.mogrt?.trim() || modeckRequest.mogrtName,
    width: size.width,
    height: size.height,
    ratio: size.ratio,
    previewFrame: Number(body.frame ?? modeckRequest.previewFrame),
  };

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(previewPayload),
    });
    const durationMs = Date.now() - startedAt;
    const responseText = await response.text();
    const responseJson = parseJson(responseText);
    const imageBase64 = extractPreviewImage(responseJson);

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          status: response.status,
          durationMs,
          error: responseJson?.error ?? responseJson?.message ?? responseText,
          requestSummary: summarizeRequest(previewPayload),
          responseSummary: summarizeResponse(responseJson ?? responseText),
        },
        { status: response.status },
      );
    }

    return Response.json({
      ok: true,
      status: response.status,
      durationMs,
      imageBase64,
      requestSummary: summarizeRequest(previewPayload),
      responseSummary: summarizeResponse(responseJson ?? responseText),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "network_error",
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown MoDeck preview error.",
        requestSummary: summarizeRequest(previewPayload),
      },
      { status: 502 },
    );
  }
}

function parseSize(value: string) {
  const match = value.match(/^(\d+)x(\d+)$/);

  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  const ratio = getRatioLabel(width, height);

  return {
    width,
    height,
    ratio,
    outputId: `still-${width}x${height}`,
  };
}

function getRatioLabel(width: number, height: number) {
  if (width === 1920 && height === 1080) {
    return "16:9";
  }

  if (width === 1080 && height === 1080) {
    return "1:1";
  }

  if (width === 1080 && height === 1350) {
    return "4:5";
  }

  if (width === 1080 && height === 1920) {
    return "9:16";
  }

  return `${width}:${height}`;
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

  const candidates = [
    response.imageBase64,
    response.previewImageBase64,
    response.previewBase64,
    response.image,
    response.preview,
  ];

  return candidates.find((candidate): candidate is string => typeof candidate === "string") ?? null;
}

function summarizeRequest(payload: {
  deckName: string;
  mogrtName: string;
  width: number;
  height: number;
  previewFrame: number;
  options: Array<{ name: string; value: string }>;
  media?: Array<{ optionName: string; uploadedFilename?: string; mediaLabReference: string }>;
}) {
  return {
    deckName: payload.deckName,
    mogrtName: payload.mogrtName,
    size: `${payload.width}x${payload.height}`,
    previewFrame: payload.previewFrame,
    options: payload.options.map((option) => option.name),
    media: payload.media?.map((item) => ({
      optionName: item.optionName,
      filename: item.uploadedFilename ?? item.mediaLabReference,
    })),
  };
}

function summarizeResponse(response: Record<string, unknown> | string | null) {
  if (!response) {
    return null;
  }

  if (typeof response === "string") {
    return response.slice(0, 500);
  }

  return {
    keys: Object.keys(response),
    editId: response.editId,
    status: response.status,
    hasImage:
      typeof response.imageBase64 === "string" ||
      typeof response.previewImageBase64 === "string" ||
      typeof response.previewBase64 === "string" ||
      typeof response.image === "string" ||
      typeof response.preview === "string",
  };
}
