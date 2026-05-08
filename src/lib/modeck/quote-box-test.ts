export const MODECK_QUOTE_BOX_TEST_DECK = "MoDeck Quote Box Test 002";
export const MODECK_QUOTE_BOX_TEST_MOGRT = "MoDeck Quote Box Test 002";

export interface ModeckQuoteBoxFields {
  quote: string;
  speakerName: string;
  speakerTitle: string;
  contextLine: string;
  brand?: string | number;
  headshotFilename?: string;
}

export interface ModeckQuoteBoxOption {
  name: string;
  value: string | number;
}

export function buildQuoteBoxOptions(fields: ModeckQuoteBoxFields): ModeckQuoteBoxOption[] {
  return [
    { name: "QUOTE_TEXT", value: fields.quote },
    { name: "SPEAKER_NAME", value: fields.speakerName },
    { name: "SPEAKER_TITLE", value: fields.speakerTitle },
    { name: "CONTEXT_LINE", value: fields.contextLine },
    { name: "BRAND", value: normalizeBrand(fields.brand) },
    ...(fields.headshotFilename ? [{ name: "HEADSHOT", value: fields.headshotFilename }] : []),
    { name: "QUOTE_FONT_SIZE", value: 75 },
    { name: "QUOTE_LINE_SPACING", value: -64 },
    { name: "QUOTE_POSITION_X", value: 200 },
    { name: "QUOTE_POSITION_y", value: 342 },
  ];
}

function normalizeBrand(value: string | number | undefined) {
  const parsed = typeof value === "string" ? Number(value) : value;

  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 2;
}

export function getModeckApiConfig() {
  const apiKey = process.env.MODECK_API_KEY;
  const apiBaseUrl = process.env.MODECK_API_BASE_URL;

  if (!apiKey || !apiBaseUrl) {
    return null;
  }

  return {
    apiKey,
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
  };
}

export function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
