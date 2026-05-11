import {
  buildQuoteBoxOptions,
  forceNumericQuoteCardBrandOption,
  MODECK_QUOTE_BOX_TEST_DECK,
  MODECK_QUOTE_BOX_TEST_MOGRT,
  normalizeQuoteCardBrandValue,
  type ModeckQuoteBoxOption,
} from "@/lib/modeck/quote-box-test";

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
  outputId: string;
}

interface ModeckPreviewOption {
  name: string;
  type: "text" | "multiline_text" | "media_replacement";
  value: string | number;
}

type ModeckPreviewOutputConfig = {
  mogrt: string;
  tuning?: Parameters<typeof buildQuoteBoxOptions>[1];
  frame?: number | null;
  previewFrame?: number | null;
};

const previewOutputConfigs: Record<string, ModeckPreviewOutputConfig> = {
  "16:9": {
    mogrt: MODECK_QUOTE_BOX_TEST_MOGRT,
  },
  "1:1": {
    mogrt: "MD_Quote_Card_1x1",
    frame: 0,
    previewFrame: 0,
    tuning: {
      quoteFontSize: 70,
      quoteLineSpacing: -70,
      quotePositionX: 120,
      quotePositionXName: "QUOTE_POSITION_X" as const,
      quotePositionY: 225,
    },
  },
  "9:16": {
    mogrt: "MD_Quote_Card_9x16",
    tuning: {
      quoteFontSize: 100,
      quoteLineSpacing: -40,
      quotePositionX: 120,
      quotePositionXName: "QUOTE_POSITION_x" as const,
      quotePositionY: 325,
    },
  },
};

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

  const previewConfig = previewOutputConfigs[size.ratio] ?? previewOutputConfigs["16:9"];
  const templateName = body.deck?.trim() || MODECK_QUOTE_BOX_TEST_DECK;
  const mogrtName = body.mogrt?.trim() || previewConfig.mogrt;
  const requestedFrame = Number(body.frame ?? 0);
  const frame = previewConfig.frame === null ? undefined : previewConfig.frame ?? requestedFrame;
  const previewFrame = previewConfig.previewFrame === null ? undefined : previewConfig.previewFrame ?? requestedFrame;
  const headshotFilename = body.headshotFilename?.trim() ?? "";
  const fields = {
    quote: body.quote ?? "",
    speakerName: body.speakerName ?? "",
    speakerTitle: body.speakerTitle ?? "",
    contextLine: body.contextLine ?? "",
    brand: normalizeQuoteCardBrandValue(body.brand),
    headshotFilename,
  };
  const options = forceNumericQuoteCardBrandOption(
    buildQuoteBoxOptions(fields, previewConfig.tuning).map(toPreviewOption),
  );

  const previewPayload = {
    apiKey,
    deck: templateName,
    size: "",
    ...(typeof frame === "number" ? { frame } : {}),
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
    ...(typeof previewFrame === "number" ? { previewFrame } : {}),
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
    logOutgoingModeckOptions({
      route: "preview",
      outputId: body.outputId ?? `${size.width}x${size.height}`,
      mogrtName,
      frame: previewPayload.frame,
      hasFrame: Object.hasOwn(previewPayload, "frame"),
      previewFrame: previewPayload.previewFrame,
      hasPreviewFrame: Object.hasOwn(previewPayload, "previewFrame"),
      payloadKeys: Object.keys(previewPayload).filter((key) => key !== "apiKey"),
      options,
    });

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
    logModeckPreviewResponse({
      outputId: body.outputId ?? `${size.width}x${size.height}`,
      mogrtName,
      frame: previewPayload.frame,
      hasFrame: Object.hasOwn(previewPayload, "frame"),
      previewFrame: previewPayload.previewFrame,
      hasPreviewFrame: Object.hasOwn(previewPayload, "previewFrame"),
      payloadKeys: Object.keys(previewPayload).filter((key) => key !== "apiKey"),
      imageBase64,
    });

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

function logOutgoingModeckOptions({
  route,
  outputId,
  mogrtName,
  frame,
  hasFrame,
  previewFrame,
  hasPreviewFrame,
  payloadKeys,
  options,
}: {
  route: "preview" | "render";
  outputId: string;
  mogrtName: string;
  frame?: number;
  hasFrame?: boolean;
  previewFrame?: number;
  hasPreviewFrame?: boolean;
  payloadKeys?: string[];
  options: Array<{ name: string; value: string | number }>;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const brand = options.find((option) => option.name === "BRAND")?.value;

  console.info("[modeck-preview-call]", {
    route,
    outputId,
    mogrtName,
    frame,
    hasFrame,
    previewFrame,
    hasPreviewFrame,
    payloadKeys,
    brandValue: brand,
    brandType: typeof brand,
    optionKeys: options.map((option) => option.name),
  });
}

function logModeckPreviewResponse({
  outputId,
  mogrtName,
  frame,
  hasFrame,
  previewFrame,
  hasPreviewFrame,
  payloadKeys,
  imageBase64,
}: {
  outputId: string;
  mogrtName: string;
  frame?: number;
  hasFrame: boolean;
  previewFrame?: number;
  hasPreviewFrame: boolean;
  payloadKeys: string[];
  imageBase64: string | null;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-preview-response]", {
    outputId,
    mogrtName,
    frame,
    hasFrame,
    previewFrame,
    hasPreviewFrame,
    payloadKeys,
    imageBase64Length: imageBase64?.length ?? 0,
  });
}

function toPreviewOption(option: ModeckQuoteBoxOption): ModeckPreviewOption {
  return {
    ...option,
    type: getPreviewOptionType(option.name),
  };
}

function getPreviewOptionType(name: string): ModeckPreviewOption["type"] {
  if (name === "QUOTE_TEXT") {
    return "multiline_text";
  }

  if (name === "HEADSHOT") {
    return "media_replacement";
  }

  return "text";
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
  frame?: number;
  previewFrame?: number;
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
