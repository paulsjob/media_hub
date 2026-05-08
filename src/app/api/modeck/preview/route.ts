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
  brand: string;
}

interface ModeckPreviewOption {
  name: string;
  type: "text" | "multiline_text" | "media_replacement";
  value: string | number;
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

  const templateName = body.deck?.trim() || "MoDeck Quote Box Test 002";
  const mogrtName = body.mogrt?.trim() || "MoDeck Quote Box Test 002";
  const headshotFilename = body.headshotFilename?.trim() ?? "";
  const brand = normalizeBrand(body.brand);

  const options: ModeckPreviewOption[] = [
    {
      name: "QUOTE_TEXT",
      type: "multiline_text",
      value: body.quote ?? "",
    },
    {
      name: "SPEAKER_NAME",
      type: "text",
      value: body.speakerName ?? "",
    },
    {
      name: "SPEAKER_TITLE",
      type: "text",
      value: body.speakerTitle ?? "",
    },
    {
      name: "CONTEXT_LINE",
      type: "text",
      value: body.contextLine ?? "",
    },
    {
      name: "BRAND",
      type: "text",
      value: brand,
    },
    {
      name: "QUOTE_FONT_SIZE",
      type: "text",
      value: 75,
    },
    {
      name: "QUOTE_LINE_SPACING",
      type: "text",
      value: -64,
    },
    {
      name: "QUOTE_POSITION_X",
      type: "text",
      value: 200,
    },
    {
      name: "QUOTE_POSITION_y",
      type: "text",
      value: 342,
    },
  ];

  if (headshotFilename) {
    options.push({
      name: "HEADSHOT",
      type: "media_replacement",
      value: headshotFilename,
    });
  }

  const previewPayload = {
    apiKey,
    deck: templateName,
    size: "",
    frame: Number(body.frame ?? 0),
    mogrt: {
      name: mogrtName,
      options: options.map(({ name, value }) => ({ name, value })),
    },
    template: templateName,
    templateName,
    deckName: templateName,
    mogrtName,
    templateId: "template-quote-card-v2",
    packageName: "Dev MoDeck Preview Test",
    ratio: size.ratio,
    width: size.width,
    height: size.height,
    previewFrame: Number(body.frame ?? 0),
    options,
    media: headshotFilename
      ? [
          {
            fieldId: "headshot",
            optionName: "HEADSHOT",
            mediaLabReference: headshotFilename,
            uploadedFilename: headshotFilename,
          },
        ]
      : undefined,
  };

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
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
  };
}

function normalizeBrand(value: string | undefined) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 2;
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

function summarizeRequest(payload: {
  template?: string;
  templateName?: string;
  deck?: string;
  deckName: string;
  mogrt?: string | { name?: string };
  mogrtName: string;
  width: number;
  height: number;
  frame: number;
  previewFrame: number;
  options: Array<{ name: string; value: string | number }>;
  media?: Array<{ optionName: string; uploadedFilename?: string; mediaLabReference: string }>;
}) {
  return {
    template: payload.template,
    templateName: payload.templateName,
    deck: payload.deck,
    deckName: payload.deckName,
    mogrt: typeof payload.mogrt === "string" ? payload.mogrt : payload.mogrt?.name,
    mogrtName: payload.mogrtName,
    size: `${payload.width}x${payload.height}`,
    frame: payload.frame,
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
    return response.slice(0, 1000);
  }

  return {
    keys: Object.keys(response),
    success: response.success,
    info: response.info,
    message: response.message,
    error: response.error,
    editId: response.editId,
    status: response.status,
    hasImage:
      typeof response.imageBase64 === "string" ||
      typeof response.previewImageBase64 === "string" ||
      typeof response.previewBase64 === "string" ||
      typeof response.previewData === "string" ||
      (isRecord(response.previewData) &&
        (typeof response.previewData.preview === "string" ||
          typeof response.previewData.image === "string" ||
          typeof response.previewData.imageBase64 === "string" ||
          typeof response.previewData.previewImageBase64 === "string")) ||
      typeof response.image === "string" ||
      typeof response.preview === "string" ||
      typeof response.base64 === "string" ||
      typeof response.data === "string",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
