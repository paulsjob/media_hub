import {
  buildQuoteBoxOptions,
  getModeckApiConfig,
  isRecord,
  MODECK_QUOTE_BOX_TEST_DECK,
  MODECK_QUOTE_BOX_TEST_MOGRT,
  parseJsonObject,
  slugify,
} from "@/lib/modeck/quote-box-test";

export const dynamic = "force-dynamic";

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

  if (body.outputId !== "still-1920x1080") {
    return Response.json(
      {
        ok: false,
        error: "Live MoDeck final rendering is currently enabled only for the 1920x1080 still output.",
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
  const renderName = `${fields.speakerName || "Quote Card"} Package Still 1920x1080`;
  const renderPayload = {
    apiKey: config.apiKey,
    deck: MODECK_QUOTE_BOX_TEST_DECK,
    name: renderName,
    mogrtSeq: [
      {
        name: MODECK_QUOTE_BOX_TEST_MOGRT,
        options: buildQuoteBoxOptions(fields),
        duration: 1,
      },
    ],
    globalOptions: [],
  };

  const response = await fetch(`${config.apiBaseUrl}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.apiKey,
    },
    body: JSON.stringify(renderPayload),
  });
  const responseText = await response.text();
  const responseJson = parseJsonObject(responseText);
  const editId = extractEditId(responseJson);

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
    outputId: "still-1920x1080",
    editId,
    status: normalizeStatus(responseJson?.status),
    source: "modeck-render",
    filename: `${slugify(fields.speakerName || "quote-card")}-1920x1080`,
    responseSummary: summarizeResponse(responseJson ?? responseText),
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
