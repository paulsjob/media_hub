import {
  clampText,
  fitQuoteFontSize,
  getFluidFontSize,
  getLineClampStyle,
  getQuoteCardLayout,
  quoteCardTemplateFamily,
} from "@/lib/quote-card-layouts";
import type { PreviewContent, PreviewRatio } from "@/lib/preview-state";

export function RatioPreview({
  ratio,
  content,
}: {
  ratio: PreviewRatio;
  content: PreviewContent;
}) {
  const layout = getQuoteCardLayout(ratio.aspectLabel);
  const constraints = quoteCardTemplateFamily.constraints;
  const quote = clampText(content.quote || "Add the quote", constraints.quoteMaxCharacters);
  const speakerName = clampText(content.speakerName || "Speaker Name", constraints.speakerNameMaxCharacters);
  const speakerTitle = clampText(content.speakerTitle || "Speaker Title", constraints.speakerTitleMaxCharacters);
  const contextLine = clampText(content.contextLine || "Context line", constraints.contextLineMaxCharacters);
  const quoteFontSize = getFluidFontSize(
    layout.quoteMinFontPx,
    layout.quotePreferredCqw,
    fitQuoteFontSize(quote, layout),
  );

  return (
    <div
      data-preview-ratio={ratio.aspectLabel}
      data-preview-width={ratio.width}
      data-preview-height={ratio.height}
      className="[container-type:inline-size] h-full w-full overflow-hidden rounded-lg border border-slate-300 bg-[#dceeff] text-[#06153a] shadow-sm"
    >
      <div className={`grid h-full min-h-0 w-full overflow-hidden ${layout.canvasGridClass} ${layout.canvasPaddingClass}`}>
        <section className={`min-h-0 w-full min-w-0 max-w-full overflow-hidden ${layout.quoteAreaClass}`}>
          <div
            className={`inline-flex w-fit shrink-0 rounded bg-orange-600 px-[clamp(8px,2.4cqw,12px)] py-[clamp(3px,0.9cqw,5px)] font-semibold uppercase tracking-wide text-white ${layout.eyebrowFontClass} ${layout.eyebrowClass}`}
          >
            Official Statement
          </div>
          <blockquote
            className={`m-0 min-h-0 min-w-0 font-semibold tracking-tight ${layout.quoteMaxWidthClass}`}
            style={{
              ...getLineClampStyle(layout.quoteMaxLines),
              fontSize: quoteFontSize,
              lineHeight: layout.quoteLineHeight,
            }}
          >
            &quot;{quote}&quot;
          </blockquote>
        </section>

        <section className={`min-h-0 w-full min-w-0 max-w-full shrink-0 ${layout.speakerBlockClass}`}>
          <div className={`h-1 w-full bg-orange-500 ${layout.dividerClass}`} />
          <div className={`w-full min-w-0 max-w-full overflow-hidden ${layout.speakerRowClass}`}>
            <div className="flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden">
              <div
                className={`grid shrink-0 place-items-center rounded-full border-2 border-[#06153a] bg-blue-50 text-sm font-semibold ${layout.headshotClass}`}
              >
                {content.headshot ? content.headshot.slice(0, 2).toUpperCase() : "HS"}
              </div>
              <div className={`max-w-full overflow-hidden ${layout.speakerTextClass}`}>
                <p
                  className="m-0 truncate font-semibold uppercase tracking-wide"
                  style={{
                    fontSize: getFluidFontSize(
                      Math.max(11, layout.speakerNameFontPx - 3),
                      layout.speakerNamePreferredCqw,
                      layout.speakerNameFontPx,
                    ),
                  }}
                >
                  {speakerName}
                </p>
                <p
                  className="m-0 truncate text-[#06153a]/80"
                  style={{
                    fontSize: getFluidFontSize(
                      Math.max(9, layout.speakerTitleFontPx - 2),
                      layout.speakerTitlePreferredCqw,
                      layout.speakerTitleFontPx,
                    ),
                  }}
                >
                  {speakerTitle}
                </p>
              </div>
            </div>
            <p
              className={`m-0 min-w-0 max-w-full font-semibold uppercase leading-tight ${layout.contextClass}`}
              style={{
                ...getLineClampStyle(layout.contextMaxLines),
                fontSize: getFluidFontSize(
                  Math.max(9, layout.contextFontPx - 2),
                  layout.contextPreferredCqw,
                  layout.contextFontPx,
                ),
              }}
            >
              {contextLine}
            </p>
          </div>
          <div
            className={`bg-[#06153a] font-semibold uppercase text-white ${layout.brandFontClass} ${layout.brandBarClass} ${layout.metadataClass}`}
          >
            <span className="truncate">Civic Action Institution</span>
            <span className="shrink-0">2026</span>
          </div>
        </section>
      </div>
    </div>
  );
}
