export const MODECK_QUOTE_BOX_TEST_DECK = "MD_Quote_Card_Package";
export const MODECK_QUOTE_BOX_TEST_MOGRT = "MD_Quote_Card_16x9";

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

interface ModeckQuoteBoxTuning {
  brand?: string | number;
  quoteFontSize?: number;
  quoteLineSpacing?: number;
  quotePositionX?: number;
  quotePositionXName?: "QUOTE_POSITION_X" | "QUOTE_POSITION_x";
  quotePositionY?: number;
}

export function buildQuoteBoxOptions(
  fields: ModeckQuoteBoxFields,
  tuning: ModeckQuoteBoxTuning = {},
): ModeckQuoteBoxOption[] {
  const quotePositionXName = tuning.quotePositionXName ?? "QUOTE_POSITION_X";

  return [
    { name: "QUOTE_TEXT", value: fields.quote },
    { name: "SPEAKER_NAME", value: fields.speakerName },
    { name: "SPEAKER_TITLE", value: fields.speakerTitle },
    { name: "CONTEXT_LINE", value: fields.contextLine },
    { name: "BRAND", value: normalizeQuoteCardBrandValue(tuning.brand ?? fields.brand) },
    ...(fields.headshotFilename ? [{ name: "HEADSHOT", value: fields.headshotFilename }] : []),
    { name: "QUOTE_FONT_SIZE", value: tuning.quoteFontSize ?? 75 },
    { name: "QUOTE_LINE_SPACING", value: tuning.quoteLineSpacing ?? -64 },
    { name: quotePositionXName, value: tuning.quotePositionX ?? 200 },
    { name: "QUOTE_POSITION_y", value: tuning.quotePositionY ?? 342 },
  ];
}

export function normalizeQuoteCardBrandValue(value: string | number | undefined) {
  if (typeof value === "string") {
    const normalizedLabel = value.trim().toLowerCase();

    if (normalizedLabel === "majority democrats") {
      return 1;
    }

    if (normalizedLabel === "the bench" || normalizedLabel === "default brand") {
      return 2;
    }
  }

  const parsed = typeof value === "string" ? Number(value) : value;

  return parsed === 1 || parsed === 2 ? parsed : 2;
}

export function forceNumericQuoteCardBrandOption<T extends { name: string; value: string | number }>(
  options: T[],
) {
  return options.map((option) =>
    option.name === "BRAND"
      ? {
          ...option,
          value: normalizeQuoteCardBrandValue(option.value),
        }
      : option,
  );
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
