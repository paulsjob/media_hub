import {
  buildQuoteBoxOptions,
  forceNumericQuoteCardBrandOption,
  getModeckApiConfig,
  isRecord,
  MODECK_QUOTE_BOX_TEST_DECK,
  MODECK_QUOTE_BOX_TEST_MOGRT,
  parseJsonObject,
  slugify,
} from "@/lib/modeck/quote-box-test";

export const dynamic = "force-dynamic";

type LiveRenderOutputConfig = {
  size: string;
  deck: string;
  mogrt: string;
  renderLabel: string;
  filenameSize: string;
  tuning?: Parameters<typeof buildQuoteBoxOptions>[1];
};

const liveRenderOutputs: Record<string, LiveRenderOutputConfig> = {
  "still-1920x1080": {
    size: "1920x1080",
    deck: MODECK_QUOTE_BOX_TEST_DECK,
    mogrt: MODECK_QUOTE_BOX_TEST_MOGRT,
    renderLabel: "Still 1920x1080",
    filenameSize: "1920x1080",
  },
  "still-1080x1080": {
    size: "1080x1080",
    deck: MODECK_QUOTE_BOX_TEST_DECK,
    mogrt: "MD_Quote_Card_1x1",
    renderLabel: "Still 1080x1080",
    filenameSize: "1080x1080",
    tuning: {
      quoteFontSize: 70,
      quoteLineSpacing: -70,
      quotePositionX: 120,
      quotePositionXName: "QUOTE_POSITION_X" as const,
      quotePositionY: 225,
    },
  },
  "still-1080x1350": {
    size: "1080x1350",
    deck: MODECK_QUOTE_BOX_TEST_DECK,
    mogrt: "MD_Quote_Card_4x5",
    renderLabel: "Still 1080x1350",
    filenameSize: "1080x1350",
  },
  "still-1080x1920": {
    size: "1080x1920",
    deck: MODECK_QUOTE_BOX_TEST_DECK,
    mogrt: "MD_Quote_Card_9x16",
    renderLabel: "Still 1080x1920",
    filenameSize: "1080x1920",
    tuning: {
      quoteFontSize: 100,
      quoteLineSpacing: -40,
      quotePositionX: 120,
      quotePositionXName: "QUOTE_POSITION_x" as const,
      quotePositionY: 325,
    },
  },
};

interface ModeckRenderRequestBody {
  outputId: string;
  size: string;
  quote: string;
  speakerName: string;
  speakerTitle: string;
  contextLine: string;
  brand: string;
  headshotFilename: string;
}

export async function POST(request: Request) {
  const config = getModeckApiConfig();

  if (!config) {
    return Response.json(
      {
        ok: false,
        error: "Live MoDeck render is not configured. Set MODECK_API_KEY and MODECK_API_BASE_URL on the server.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as Partial<ModeckRenderRequestBody>;
  const startedAt = Date.now();
  const outputId = body.outputId ?? "";
  const outputConfig = liveRenderOutputs[outputId as keyof typeof liveRenderOutputs];

  if (!outputConfig) {
    return Response.json(
      {
        ok: false,
        error: "Live MoDeck final rendering is currently enabled only for connected still outputs.",
      },
      { status: 400 },
    );
  }

  const fields = {
    quote: body.quote ?? "",
    speakerName: body.speakerName ?? "",
    speakerTitle: body.speakerTitle ?? "",
    contextLine: body.contextLine ?? "",
    brand: body.brand ?? "2",
    headshotFilename: body.headshotFilename ?? "",
  };
  const renderOptions = forceNumericQuoteCardBrandOption(
    buildQuoteBoxOptions(fields, outputConfig.tuning),
  );
  const renderName = `${fields.speakerName || "Quote Card"} Package ${outputConfig.renderLabel}`;
  const renderPayload = {
    apiKey: config.apiKey,
    deck: outputConfig.deck,
    name: renderName,
    mogrtSeq: [
      {
        name: outputConfig.mogrt,
        options: renderOptions.map(toModeckRenderOption),
        duration: 1,
      },
    ],
    globalOptions: [],
    media: fields.headshotFilename
      ? [
          {
            fieldId: "headshot",
            optionName: "HEADSHOT",
            mediaLabReference: fields.headshotFilename,
            uploadedFilename: fields.headshotFilename,
          },
        ]
      : undefined,
  };

  logOutgoingModeckOptions({
    route: "render",
    outputId,
    mogrtName: outputConfig.mogrt,
    options: renderOptions,
    headshotValue: fields.headshotFilename,
  });
  logModeckRenderTiming({
    outputId,
    mogrtName: outputConfig.mogrt,
    durationMs: 0,
    responseOk: true,
    hasEditId: false,
    stage: "server-render-create-start",
  });

  const response = await fetch(`${config.apiBaseUrl}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.apiKey,
    },
    body: JSON.stringify(renderPayload),
  });
  const responseText = await response.text();
  const durationMs = Date.now() - startedAt;
  const responseJson = parseJsonObject(responseText);
  const editId = extractEditId(responseJson);

  logModeckRenderTiming({
    outputId,
    mogrtName: outputConfig.mogrt,
    durationMs,
    responseOk: response.ok,
    hasEditId: Boolean(editId),
    stage: "server-render-create-end",
  });

  if (!response.ok || !editId) {
    return Response.json(
      {
        ok: false,
        status: response.status,
        error: responseJson?.error ?? responseJson?.message ?? responseJson?.info ?? responseText,
        responseSummary: summarizeResponse(responseJson ?? responseText),
      },
      { status: response.ok ? 502 : response.status },
    );
  }

  return Response.json({
    ok: true,
    outputId,
    editId,
    status: normalizeStatus(responseJson?.status),
    source: "modeck-render",
    filename: `${slugify(fields.speakerName || "quote-card")}-${outputConfig.filenameSize}`,
    responseSummary: summarizeResponse(responseJson ?? responseText),
  });
}

function toModeckRenderOption({ name, value }: { name: string; value: string | number }) {
  return name === "HEADSHOT" ? { name, value, type: "media_replacement" } : { name, value };
}

function logModeckRenderTiming({
  outputId,
  mogrtName,
  durationMs,
  responseOk,
  hasEditId,
  stage,
}: {
  outputId: string;
  mogrtName: string;
  durationMs: number;
  responseOk: boolean;
  hasEditId: boolean;
  stage: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-render-create-timing]", {
    stage,
    outputId,
    mogrtName,
    durationMs,
    responseOk,
    hasEditId,
  });
}

function logOutgoingModeckOptions({
  route,
  outputId,
  mogrtName,
  options,
  headshotValue,
}: {
  route: "preview" | "render";
  outputId: string;
  mogrtName: string;
  options: Array<{ name: string; value: string | number }>;
  headshotValue?: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const brand = options.find((option) => option.name === "BRAND")?.value;

  console.info("[modeck-render-create-route]", {
    route,
    outputId,
    mogrtName,
    brandValue: brand,
    brandType: typeof brand,
    headshotValue: headshotValue || options.find((option) => option.name === "HEADSHOT")?.value || null,
    optionKeys: options.map((option) => option.name),
  });
}

function extractEditId(response: Record<string, unknown> | null) {
  if (!response) {
    return null;
  }

  const data = isRecord(response.data) ? response.data : null;
  const render = isRecord(response.render) ? response.render : null;
  const candidates = [response.editId, response.id, data?.editId, data?.id, render?.editId, render?.id];

  return candidates.find((candidate): candidate is string => typeof candidate === "string") ?? null;
}

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value : "queued";
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
    id: response.id,
    status: response.status,
  };
}
