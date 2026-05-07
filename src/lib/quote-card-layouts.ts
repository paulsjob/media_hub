import type { PreviewContent } from "./preview-state";

export type QuoteCardRatio = "16:9" | "1:1" | "4:5" | "9:16";

export interface QuoteCardContentConstraints {
  quoteMaxCharacters: number;
  speakerNameMaxCharacters: number;
  speakerTitleMaxCharacters: number;
  contextLineMaxCharacters: number;
}

export interface QuoteCardRatioLayout {
  aspectLabel: QuoteCardRatio;
  spec: QuoteCardRatioSpec;
}

export interface QuoteCardBoxSpec {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct?: number;
}

export interface QuoteCardTextSpec extends QuoteCardBoxSpec {
  fontMinPx: number;
  fontMaxPx: number;
  fontCqw: number;
  lineHeight: number;
  maxLines: number;
  align?: "left" | "right";
}

export interface QuoteCardRatioSpec {
  safeMarginPct: number;
  borderThicknessPx: number;
  cornerRadiusPx: number;
  label: QuoteCardTextSpec;
  quote: QuoteCardTextSpec;
  headshot: QuoteCardBoxSpec;
  speakerName: QuoteCardTextSpec;
  speakerTitle: QuoteCardTextSpec;
  context: QuoteCardTextSpec;
  orangeRule: QuoteCardBoxSpec;
  footer: QuoteCardBoxSpec;
  footerText: QuoteCardTextSpec;
  footerYear: QuoteCardTextSpec;
}

export interface QuoteCardTemplateFamily {
  id: "quote-card";
  label: "Quote Card";
  supportedRatios: QuoteCardRatio[];
  requiredFields: Array<keyof PreviewContent>;
  constraints: QuoteCardContentConstraints;
  ratioLayouts: Record<QuoteCardRatio, QuoteCardRatioLayout>;
}

export const quoteCardTemplateSpec: Record<QuoteCardRatio, QuoteCardRatioSpec> = {
  "16:9": {
    safeMarginPct: 4.5,
    borderThicknessPx: 0,
    cornerRadiusPx: 0,
    label: {
      leftPct: 4.5,
      topPct: 6.7,
      widthPct: 42,
      heightPct: 5.9,
      fontMinPx: 13,
      fontMaxPx: 39,
      fontCqw: 2.55,
      lineHeight: 1,
      maxLines: 1,
    },
    quote: {
      leftPct: 5.7,
      topPct: 21.2,
      widthPct: 73,
      heightPct: 31,
      fontMinPx: 28,
      fontMaxPx: 76,
      fontCqw: 5.05,
      lineHeight: 1.17,
      maxLines: 3,
    },
    headshot: { leftPct: 4.5, topPct: 58.4, widthPct: 7, heightPct: 10.2 },
    speakerName: {
      leftPct: 13.5,
      topPct: 59.2,
      widthPct: 55,
      heightPct: 5,
      fontMinPx: 17,
      fontMaxPx: 42,
      fontCqw: 2.9,
      lineHeight: 1,
      maxLines: 1,
    },
    speakerTitle: {
      leftPct: 13.5,
      topPct: 64.6,
      widthPct: 45,
      heightPct: 3.5,
      fontMinPx: 11,
      fontMaxPx: 24,
      fontCqw: 1.55,
      lineHeight: 1,
      maxLines: 1,
    },
    context: {
      leftPct: 70.5,
      topPct: 59.4,
      widthPct: 27,
      heightPct: 8.8,
      fontMinPx: 13,
      fontMaxPx: 30,
      fontCqw: 1.9,
      lineHeight: 1.05,
      maxLines: 2,
      align: "right",
    },
    orangeRule: { leftPct: 5.7, topPct: 70.4, widthPct: 88.6, heightPct: 0.65 },
    footer: { leftPct: 5.7, topPct: 73.3, widthPct: 88.6, heightPct: 5.3 },
    footerText: {
      leftPct: 7.5,
      topPct: 75,
      widthPct: 52,
      heightPct: 3,
      fontMinPx: 13,
      fontMaxPx: 29,
      fontCqw: 1.9,
      lineHeight: 1,
      maxLines: 1,
    },
    footerYear: {
      leftPct: 89.7,
      topPct: 75,
      widthPct: 4.2,
      heightPct: 3,
      fontMinPx: 13,
      fontMaxPx: 29,
      fontCqw: 1.9,
      lineHeight: 1,
      maxLines: 1,
      align: "right",
    },
  },
  "1:1": {
    safeMarginPct: 7,
    borderThicknessPx: 0,
    cornerRadiusPx: 0,
    label: { leftPct: 7, topPct: 10, widthPct: 38, heightPct: 5.2, fontMinPx: 12, fontMaxPx: 28, fontCqw: 3.1, lineHeight: 1, maxLines: 1 },
    quote: { leftPct: 7, topPct: 21, widthPct: 78, heightPct: 28, fontMinPx: 24, fontMaxPx: 46, fontCqw: 5.2, lineHeight: 1.08, maxLines: 4 },
    headshot: { leftPct: 7, topPct: 62, widthPct: 11, heightPct: 11 },
    speakerName: { leftPct: 22, topPct: 62, widthPct: 64, heightPct: 4, fontMinPx: 16, fontMaxPx: 27, fontCqw: 3.6, lineHeight: 1, maxLines: 1 },
    speakerTitle: { leftPct: 22, topPct: 66.5, widthPct: 52, heightPct: 3, fontMinPx: 10, fontMaxPx: 18, fontCqw: 2.2, lineHeight: 1, maxLines: 1 },
    context: { leftPct: 7, topPct: 75, widthPct: 78, heightPct: 5, fontMinPx: 11, fontMaxPx: 18, fontCqw: 2.4, lineHeight: 1.05, maxLines: 2 },
    orangeRule: { leftPct: 7, topPct: 56, widthPct: 86, heightPct: 0.7 },
    footer: { leftPct: 7, topPct: 85, widthPct: 86, heightPct: 6 },
    footerText: { leftPct: 10, topPct: 87, widthPct: 50, heightPct: 3, fontMinPx: 10, fontMaxPx: 18, fontCqw: 2.3, lineHeight: 1, maxLines: 1 },
    footerYear: { leftPct: 84, topPct: 87, widthPct: 7, heightPct: 3, fontMinPx: 10, fontMaxPx: 18, fontCqw: 2.3, lineHeight: 1, maxLines: 1, align: "right" },
  },
  "4:5": {
    safeMarginPct: 7.5,
    borderThicknessPx: 0,
    cornerRadiusPx: 0,
    label: { leftPct: 7.5, topPct: 11, widthPct: 40, heightPct: 4.5, fontMinPx: 12, fontMaxPx: 25, fontCqw: 3.3, lineHeight: 1, maxLines: 1 },
    quote: { leftPct: 7.5, topPct: 22, widthPct: 78, heightPct: 31, fontMinPx: 24, fontMaxPx: 42, fontCqw: 5.4, lineHeight: 1.08, maxLines: 5 },
    headshot: { leftPct: 7.5, topPct: 66, widthPct: 12, heightPct: 9.6 },
    speakerName: { leftPct: 23, topPct: 66.2, widthPct: 62, heightPct: 3.8, fontMinPx: 15, fontMaxPx: 25, fontCqw: 3.8, lineHeight: 1, maxLines: 1 },
    speakerTitle: { leftPct: 23, topPct: 70.5, widthPct: 50, heightPct: 3, fontMinPx: 10, fontMaxPx: 17, fontCqw: 2.3, lineHeight: 1, maxLines: 1 },
    context: { leftPct: 7.5, topPct: 78, widthPct: 78, heightPct: 5, fontMinPx: 10, fontMaxPx: 17, fontCqw: 2.5, lineHeight: 1.05, maxLines: 2 },
    orangeRule: { leftPct: 7.5, topPct: 60, widthPct: 85, heightPct: 0.55 },
    footer: { leftPct: 7.5, topPct: 88, widthPct: 85, heightPct: 5.2 },
    footerText: { leftPct: 10, topPct: 89.7, widthPct: 50, heightPct: 2.8, fontMinPx: 9, fontMaxPx: 16, fontCqw: 2.3, lineHeight: 1, maxLines: 1 },
    footerYear: { leftPct: 84, topPct: 89.7, widthPct: 7, heightPct: 2.8, fontMinPx: 9, fontMaxPx: 16, fontCqw: 2.3, lineHeight: 1, maxLines: 1, align: "right" },
  },
  "9:16": {
    safeMarginPct: 8.5,
    borderThicknessPx: 0,
    cornerRadiusPx: 0,
    label: { leftPct: 8.5, topPct: 15, widthPct: 55, heightPct: 3.4, fontMinPx: 11, fontMaxPx: 19, fontCqw: 4.3, lineHeight: 1, maxLines: 1 },
    quote: { leftPct: 8.5, topPct: 25, widthPct: 80, heightPct: 34, fontMinPx: 23, fontMaxPx: 35, fontCqw: 7.7, lineHeight: 1.08, maxLines: 6 },
    headshot: { leftPct: 8.5, topPct: 70, widthPct: 18, heightPct: 10.1 },
    speakerName: { leftPct: 31, topPct: 70.5, widthPct: 58, heightPct: 3.2, fontMinPx: 13, fontMaxPx: 19, fontCqw: 4.8, lineHeight: 1, maxLines: 1 },
    speakerTitle: { leftPct: 31, topPct: 74.2, widthPct: 55, heightPct: 2.4, fontMinPx: 9, fontMaxPx: 14, fontCqw: 3.2, lineHeight: 1, maxLines: 1 },
    context: { leftPct: 8.5, topPct: 81.5, widthPct: 80, heightPct: 5, fontMinPx: 9, fontMaxPx: 14, fontCqw: 3.3, lineHeight: 1.05, maxLines: 2 },
    orangeRule: { leftPct: 8.5, topPct: 65, widthPct: 83, heightPct: 0.42 },
    footer: { leftPct: 8.5, topPct: 90.5, widthPct: 83, heightPct: 4.2 },
    footerText: { leftPct: 12, topPct: 91.9, widthPct: 50, heightPct: 2, fontMinPx: 8, fontMaxPx: 12, fontCqw: 3, lineHeight: 1, maxLines: 1 },
    footerYear: { leftPct: 82, topPct: 91.9, widthPct: 7, heightPct: 2, fontMinPx: 8, fontMaxPx: 12, fontCqw: 3, lineHeight: 1, maxLines: 1, align: "right" },
  },
};

export const quoteCardTemplateFamily: QuoteCardTemplateFamily = {
  id: "quote-card",
  label: "Quote Card",
  supportedRatios: ["16:9", "1:1", "4:5", "9:16"],
  requiredFields: ["quote", "speakerName", "speakerTitle", "contextLine", "headshot"],
  constraints: {
    quoteMaxCharacters: 260,
    speakerNameMaxCharacters: 34,
    speakerTitleMaxCharacters: 42,
    contextLineMaxCharacters: 44,
  },
  ratioLayouts: {
    "16:9": {
      aspectLabel: "16:9",
      spec: quoteCardTemplateSpec["16:9"],
    },
    "1:1": {
      aspectLabel: "1:1",
      spec: quoteCardTemplateSpec["1:1"],
    },
    "4:5": {
      aspectLabel: "4:5",
      spec: quoteCardTemplateSpec["4:5"],
    },
    "9:16": {
      aspectLabel: "9:16",
      spec: quoteCardTemplateSpec["9:16"],
    },
  },
};

export function getQuoteCardLayout(aspectLabel: string): QuoteCardRatioLayout {
  return quoteCardTemplateFamily.ratioLayouts[aspectLabel as QuoteCardRatio] ??
    quoteCardTemplateFamily.ratioLayouts["16:9"];
}

export function fitQuoteFontSize(quote: string, layout: QuoteCardRatioLayout) {
  const length = quote.trim().length;
  const range = layout.spec.quote.fontMaxPx - layout.spec.quote.fontMinPx;
  const pressure = Math.min(length / quoteCardTemplateFamily.constraints.quoteMaxCharacters, 1);

  return Math.round(layout.spec.quote.fontMaxPx - range * pressure);
}

export function getFluidFontSize(minPx: number, preferredCqw: number, maxPx: number) {
  return `clamp(${minPx}px, ${preferredCqw}cqw, ${maxPx}px)`;
}

export function clampText(value: string, maxCharacters: number) {
  const trimmed = value.trim();

  if (trimmed.length <= maxCharacters) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxCharacters - 3)).trimEnd()}...`;
}

export function getLineClampStyle(maxLines: number) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}
