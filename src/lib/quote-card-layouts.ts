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
  canvasGridClass: string;
  frameMaxWidthClass: string;
  quoteAreaClass: string;
  quoteMaxWidthClass: string;
  quoteMinFontPx: number;
  quoteMaxFontPx: number;
  quotePreferredCqw: number;
  quoteLineHeight: number;
  quoteMaxLines: number;
  eyebrowClass: string;
  eyebrowFontClass: string;
  speakerBlockClass: string;
  speakerRowClass: string;
  speakerTextClass: string;
  speakerNameFontPx: number;
  speakerNamePreferredCqw: number;
  speakerTitleFontPx: number;
  speakerTitlePreferredCqw: number;
  contextClass: string;
  contextFontPx: number;
  contextPreferredCqw: number;
  contextMaxLines: number;
  headshotClass: string;
  dividerClass: string;
  brandBarClass: string;
  brandFontClass: string;
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
      canvasPaddingClass: "p-[5%]",
      canvasGridClass: "grid-rows-[1fr_auto]",
      frameMaxWidthClass: "max-w-[680px]",
      quoteAreaClass: "flex min-h-0 flex-col justify-center pb-[2%]",
      quoteMaxWidthClass: "max-w-[74%]",
      quoteMinFontPx: 17,
      quoteMaxFontPx: 31,
      quotePreferredCqw: 5.6,
      quoteLineHeight: 1.02,
      quoteMaxLines: 4,
      eyebrowClass: "mb-[3%]",
      eyebrowFontClass: "text-[clamp(7px,1.35cqw,10px)]",
      speakerBlockClass: "min-h-0",
      speakerRowClass: "grid grid-cols-[1fr_minmax(5rem,34%)] items-center gap-[4%]",
      speakerTextClass: "min-w-0",
      speakerNameFontPx: 15,
      speakerNamePreferredCqw: 2.8,
      speakerTitleFontPx: 11,
      speakerTitlePreferredCqw: 2,
      contextClass: "min-w-0 text-right",
      contextFontPx: 11,
      contextPreferredCqw: 2,
      contextMaxLines: 2,
      headshotClass: "h-[clamp(32px,8.5cqw,52px)] w-[clamp(32px,8.5cqw,52px)]",
      dividerClass: "mb-[2.5%]",
      brandBarClass: "mt-[3%] min-h-[clamp(22px,4.8cqw,34px)] px-[3%] py-[1.5%]",
      brandFontClass: "text-[clamp(7px,1.45cqw,10px)]",
      metadataClass: "flex items-center justify-between gap-3",
    },
    "1:1": {
      aspectLabel: "1:1",
      canvasPaddingClass: "p-[7%]",
      canvasGridClass: "grid-rows-[1fr_auto]",
      frameMaxWidthClass: "max-w-[440px]",
      quoteAreaClass: "flex min-h-0 flex-col justify-center pb-[5%]",
      quoteMaxWidthClass: "max-w-full",
      quoteMinFontPx: 18,
      quoteMaxFontPx: 30,
      quotePreferredCqw: 7,
      quoteLineHeight: 1.04,
      quoteMaxLines: 5,
      eyebrowClass: "mb-[5%]",
      eyebrowFontClass: "text-[clamp(8px,2cqw,10px)]",
      speakerBlockClass: "min-h-0",
      speakerRowClass: "flex flex-col items-start gap-[clamp(8px,3cqw,14px)]",
      speakerTextClass: "min-w-0",
      speakerNameFontPx: 16,
      speakerNamePreferredCqw: 4,
      speakerTitleFontPx: 12,
      speakerTitlePreferredCqw: 2.8,
      contextClass: "max-w-full text-left",
      contextFontPx: 12,
      contextPreferredCqw: 2.9,
      contextMaxLines: 2,
      headshotClass: "h-[clamp(38px,12cqw,52px)] w-[clamp(38px,12cqw,52px)]",
      dividerClass: "mb-[4%]",
      brandBarClass: "mt-[5%] min-h-[clamp(25px,7cqw,34px)] px-[4%] py-[2%]",
      brandFontClass: "text-[clamp(8px,2.2cqw,10px)]",
      metadataClass: "flex w-full items-center justify-between gap-3",
    },
    "4:5": {
      aspectLabel: "4:5",
      canvasPaddingClass: "p-[7.5%]",
      canvasGridClass: "grid-rows-[1fr_auto]",
      frameMaxWidthClass: "max-w-[380px]",
      quoteAreaClass: "flex min-h-0 flex-col justify-center pb-[8%]",
      quoteMaxWidthClass: "max-w-full",
      quoteMinFontPx: 18,
      quoteMaxFontPx: 29,
      quotePreferredCqw: 7.6,
      quoteLineHeight: 1.05,
      quoteMaxLines: 6,
      eyebrowClass: "mb-[6%]",
      eyebrowFontClass: "text-[clamp(8px,2.3cqw,10px)]",
      speakerBlockClass: "min-h-0",
      speakerRowClass: "flex flex-col items-start gap-[clamp(9px,3.5cqw,15px)]",
      speakerTextClass: "min-w-0",
      speakerNameFontPx: 16,
      speakerNamePreferredCqw: 4.5,
      speakerTitleFontPx: 12,
      speakerTitlePreferredCqw: 3.1,
      contextClass: "max-w-full text-left",
      contextFontPx: 12,
      contextPreferredCqw: 3.2,
      contextMaxLines: 2,
      headshotClass: "h-[clamp(38px,13cqw,54px)] w-[clamp(38px,13cqw,54px)]",
      dividerClass: "mb-[4.5%]",
      brandBarClass: "mt-[6%] min-h-[clamp(26px,7.4cqw,36px)] px-[4%] py-[2%]",
      brandFontClass: "text-[clamp(8px,2.3cqw,10px)]",
      metadataClass: "flex w-full items-center justify-between gap-3",
    },
    "9:16": {
      aspectLabel: "9:16",
      canvasPaddingClass: "p-[8.5%]",
      canvasGridClass: "grid-rows-[1fr_auto]",
      frameMaxWidthClass: "max-w-[300px]",
      quoteAreaClass: "flex min-h-0 flex-col justify-center pb-[12%]",
      quoteMaxWidthClass: "max-w-full",
      quoteMinFontPx: 18,
      quoteMaxFontPx: 27,
      quotePreferredCqw: 9,
      quoteLineHeight: 1.06,
      quoteMaxLines: 7,
      eyebrowClass: "mb-[8%]",
      eyebrowFontClass: "text-[clamp(8px,2.9cqw,10px)]",
      speakerBlockClass: "min-h-0",
      speakerRowClass: "flex flex-col items-start gap-[clamp(9px,4cqw,15px)]",
      speakerTextClass: "min-w-0",
      speakerNameFontPx: 15,
      speakerNamePreferredCqw: 5,
      speakerTitleFontPx: 11,
      speakerTitlePreferredCqw: 3.5,
      contextClass: "max-w-full text-left",
      contextFontPx: 11,
      contextPreferredCqw: 3.6,
      contextMaxLines: 3,
      headshotClass: "h-[clamp(38px,16cqw,54px)] w-[clamp(38px,16cqw,54px)]",
      dividerClass: "mb-[6%]",
      brandBarClass: "mt-[7%] min-h-[clamp(27px,9cqw,36px)] px-[5%] py-[2.5%]",
      brandFontClass: "text-[clamp(8px,3cqw,10px)]",
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
