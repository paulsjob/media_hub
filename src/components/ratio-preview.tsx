import {
  clampText,
  fitQuoteFontSize,
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
  const quoteFontSize = fitQuoteFontSize(quote, layout);

  return (
    <figure>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <figcaption className="font-semibold text-[#06153a]">{ratio.aspectLabel}</figcaption>
        <span className="text-slate-500">
          {ratio.width}x{ratio.height}
        </span>
      </div>
      <div
        data-preview-ratio={ratio.aspectLabel}
        data-preview-width={ratio.width}
        data-preview-height={ratio.height}
        className={`mx-auto w-full overflow-hidden rounded-lg border border-slate-300 bg-[#dceeff] text-[#06153a] ${layout.frameMaxWidthClass}`}
        style={{ aspectRatio: `${ratio.width} / ${ratio.height}` }}
      >
        <div className={`flex h-full min-h-0 flex-col ${layout.canvasPaddingClass}`}>
          <section className={`min-h-0 ${layout.quoteAreaClass}`}>
            <div
              className={`inline-flex w-fit rounded bg-orange-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white ${layout.eyebrowClass}`}
            >
              Official Statement
            </div>
            <blockquote
              className={`min-h-0 font-semibold tracking-tight ${layout.quoteMaxWidthClass}`}
              style={{
                ...getLineClampStyle(layout.quoteMaxLines),
                fontSize: quoteFontSize,
                lineHeight: layout.quoteLineHeight,
              }}
            >
              &quot;{quote}&quot;
            </blockquote>
          </section>

          <section className={`shrink-0 ${layout.speakerBlockClass}`}>
            <div className={`h-1 w-full bg-orange-500 ${layout.dividerClass}`} />
            <div className={layout.speakerRowClass}>
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`grid shrink-0 place-items-center rounded-full border-2 border-[#06153a] bg-blue-50 text-sm font-semibold ${layout.headshotClass}`}
                >
                  {content.headshot ? content.headshot.slice(0, 2).toUpperCase() : "HS"}
                </div>
                <div className={layout.speakerTextClass}>
                  <p
                    className="truncate font-semibold uppercase tracking-wide"
                    style={{ fontSize: layout.speakerNameFontPx }}
                  >
                    {speakerName}
                  </p>
                  <p
                    className="truncate text-[#06153a]/80"
                    style={{ fontSize: layout.speakerTitleFontPx }}
                  >
                    {speakerTitle}
                  </p>
                </div>
              </div>
              <p
                className={`font-semibold uppercase leading-tight ${layout.contextClass}`}
                style={{
                  ...getLineClampStyle(2),
                  fontSize: layout.contextFontPx,
                }}
              >
                {contextLine}
              </p>
            </div>
            <div
              className={`bg-[#06153a] text-[10px] font-semibold uppercase text-white ${layout.brandBarClass} ${layout.metadataClass}`}
            >
              <span className="truncate">Civic Action Institution</span>
              <span className="shrink-0">2026</span>
            </div>
          </section>
        </div>
      </div>
    </figure>
  );
}
