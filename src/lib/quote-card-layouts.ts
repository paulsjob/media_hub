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
  canvasPaddingClass: string;
  frameMaxWidthClass: string;
  quoteAreaClass: string;
  quoteMaxWidthClass: string;
  quoteMinFontPx: number;
  quoteMaxFontPx: number;
  quoteLineHeight: number;
  quoteMaxLines: number;
  eyebrowClass: string;
  speakerBlockClass: string;
  speakerRowClass: string;
  speakerTextClass: string;
  speakerNameFontPx: number;
  speakerTitleFontPx: number;
  contextClass: string;
  contextFontPx: number;
  headshotClass: string;
  dividerClass: string;
  brandBarClass: string;
  metadataClass: string;
}

export interface QuoteCardTemplateFamily {
  id: "quote-card";
  label: "Quote Card";
  supportedRatios: QuoteCardRatio[];
  requiredFields: Array<keyof PreviewContent>;
  constraints: QuoteCardContentConstraints;
  ratioLayouts: Record<QuoteCardRatio, QuoteCardRatioLayout>;
}

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
      canvasPaddingClass: "p-[5.5%]",
      frameMaxWidthClass: "max-w-2xl",
      quoteAreaClass: "flex flex-1 flex-col justify-start",
      quoteMaxWidthClass: "max-w-[78%]",
      quoteMinFontPx: 22,
      quoteMaxFontPx: 38,
      quoteLineHeight: 0.96,
      quoteMaxLines: 4,
      eyebrowClass: "mb-5",
      speakerBlockClass: "mt-5",
      speakerRowClass: "flex items-end justify-between gap-5",
      speakerTextClass: "min-w-0",
      speakerNameFontPx: 16,
      speakerTitleFontPx: 11,
      contextClass: "max-w-[34%] text-right",
      contextFontPx: 11,
      headshotClass: "h-14 w-14",
      dividerClass: "mb-4",
      brandBarClass: "mt-4 px-3 py-2",
      metadataClass: "flex items-center justify-between gap-3",
    },
    "1:1": {
      aspectLabel: "1:1",
      canvasPaddingClass: "p-[7%]",
      frameMaxWidthClass: "max-w-[400px]",
      quoteAreaClass: "flex flex-1 flex-col justify-start",
      quoteMaxWidthClass: "max-w-full",
      quoteMinFontPx: 22,
      quoteMaxFontPx: 34,
      quoteLineHeight: 1,
      quoteMaxLines: 5,
      eyebrowClass: "mb-5",
      speakerBlockClass: "mt-5",
      speakerRowClass: "flex flex-col items-start gap-3",
      speakerTextClass: "min-w-0",
      speakerNameFontPx: 15,
      speakerTitleFontPx: 11,
      contextClass: "max-w-full text-left",
      contextFontPx: 11,
      headshotClass: "h-12 w-12",
      dividerClass: "mb-4",
      brandBarClass: "mt-4 px-3 py-2",
      metadataClass: "flex w-full items-center justify-between gap-3",
    },
    "4:5": {
      aspectLabel: "4:5",
      canvasPaddingClass: "p-[7%]",
      frameMaxWidthClass: "max-w-[340px]",
      quoteAreaClass: "flex flex-1 flex-col justify-start",
      quoteMaxWidthClass: "max-w-full",
      quoteMinFontPx: 21,
      quoteMaxFontPx: 32,
      quoteLineHeight: 1,
      quoteMaxLines: 6,
      eyebrowClass: "mb-5",
      speakerBlockClass: "mt-6",
      speakerRowClass: "flex flex-col items-start gap-3",
      speakerTextClass: "min-w-0",
      speakerNameFontPx: 15,
      speakerTitleFontPx: 11,
      contextClass: "max-w-full text-left",
      contextFontPx: 11,
      headshotClass: "h-12 w-12",
      dividerClass: "mb-4",
      brandBarClass: "mt-4 px-3 py-2",
      metadataClass: "flex w-full items-center justify-between gap-3",
    },
    "9:16": {
      aspectLabel: "9:16",
      canvasPaddingClass: "p-[8%]",
      frameMaxWidthClass: "max-w-[270px]",
      quoteAreaClass: "flex flex-1 flex-col justify-start",
      quoteMaxWidthClass: "max-w-full",
      quoteMinFontPx: 19,
      quoteMaxFontPx: 28,
      quoteLineHeight: 1.02,
      quoteMaxLines: 8,
      eyebrowClass: "mb-5",
      speakerBlockClass: "mt-7",
      speakerRowClass: "flex flex-col items-start gap-3",
      speakerTextClass: "min-w-0",
      speakerNameFontPx: 14,
      speakerTitleFontPx: 10,
      contextClass: "max-w-full text-left",
      contextFontPx: 10,
      headshotClass: "h-12 w-12",
      dividerClass: "mb-4",
      brandBarClass: "mt-4 px-3 py-2",
      metadataClass: "flex w-full items-center justify-between gap-3",
    },
  },
};

export function getQuoteCardLayout(aspectLabel: string): QuoteCardRatioLayout {
  return quoteCardTemplateFamily.ratioLayouts[aspectLabel as QuoteCardRatio] ??
    quoteCardTemplateFamily.ratioLayouts["16:9"];
}

export function fitQuoteFontSize(quote: string, layout: QuoteCardRatioLayout) {
  const length = quote.trim().length;
  const range = layout.quoteMaxFontPx - layout.quoteMinFontPx;
  const pressure = Math.min(length / quoteCardTemplateFamily.constraints.quoteMaxCharacters, 1);

  return Math.round(layout.quoteMaxFontPx - range * pressure);
}

export function clampText(value: string, maxCharacters: number) {
  const trimmed = value.trim();

  if (trimmed.length <= maxCharacters) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxCharacters - 1)).trimEnd()}…`;
}

export function getLineClampStyle(maxLines: number) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}
