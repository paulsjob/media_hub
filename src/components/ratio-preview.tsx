import {
  clampText,
  fitQuoteFontSize,
  getFluidFontSize,
  getLineClampStyle,
  getQuoteCardLayout,
  quoteCardTemplateFamily,
  type QuoteCardBoxSpec,
  type QuoteCardTextSpec,
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
  const spec = layout.spec;
  const constraints = quoteCardTemplateFamily.constraints;
  const quote = clampText(content.quote || "Add the quote", constraints.quoteMaxCharacters);
  const speakerName = clampText(content.speakerName || "Speaker Name", constraints.speakerNameMaxCharacters);
  const speakerTitle = clampText(content.speakerTitle || "Speaker Title", constraints.speakerTitleMaxCharacters);
  const contextLine = clampText(content.contextLine || "Context line", constraints.contextLineMaxCharacters);

  return (
    <div
      data-preview-ratio={ratio.aspectLabel}
      data-preview-width={ratio.width}
      data-preview-height={ratio.height}
      className="[container-type:inline-size] relative h-full w-full overflow-hidden bg-[#dceeff] text-[#06153a] shadow-sm"
      style={{
        borderColor: "#cbd5e1",
        borderRadius: spec.cornerRadiusPx,
        borderStyle: "solid",
        borderWidth: spec.borderThicknessPx,
      }}
    >
      <TextBox spec={spec.label} className="bg-orange-600 px-[1.8%] py-[0.7%] font-bold uppercase text-white">
        Official Statement
      </TextBox>

      <TextBox
        as="blockquote"
        spec={spec.quote}
        className="m-0 font-bold uppercase tracking-[0.02em]"
        fontMaxPx={fitQuoteFontSize(quote, layout)}
      >
        &quot;{quote}&quot;
      </TextBox>

      <Box spec={spec.orangeRule} className="bg-orange-500" />

      <Box
        spec={spec.headshot}
        className="grid place-items-center rounded-full border-[clamp(2px,0.45cqw,6px)] border-[#06153a] bg-blue-50 font-bold"
      >
        {content.headshotPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.headshotPreviewUrl} alt="Selected headshot" className="h-full w-full object-cover" />
        ) : (
          <span style={{ fontSize: "clamp(13px, 3.1cqw, 34px)", lineHeight: 1 }}>
            {content.headshot ? content.headshot.slice(0, 2).toUpperCase() : "HS"}
          </span>
        )}
      </Box>

      <TextBox spec={spec.speakerName} className="font-bold uppercase tracking-[0.04em]">
        {speakerName}
      </TextBox>

      <TextBox spec={spec.speakerTitle} className="font-bold uppercase tracking-[0.03em] text-[#06153a]/85">
        {speakerTitle}
      </TextBox>

      <TextBox spec={spec.context} className="font-bold uppercase tracking-[0.03em]">
        {contextLine}
      </TextBox>

      <Box spec={spec.footer} className="bg-[#06153a]" />
      <TextBox spec={spec.footerText} className="font-bold uppercase tracking-[0.04em] text-white">
        Civic Action Institution
      </TextBox>
      <TextBox spec={spec.footerYear} className="font-bold uppercase tracking-[0.04em] text-white">
        2026
      </TextBox>
    </div>
  );
}

function Box({
  spec,
  className = "",
  children,
}: {
  spec: QuoteCardBoxSpec;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`absolute min-w-0 overflow-hidden ${className}`}
      style={{
        left: `${spec.leftPct}%`,
        top: `${spec.topPct}%`,
        width: `${spec.widthPct}%`,
        height: spec.heightPct ? `${spec.heightPct}%` : undefined,
      }}
    >
      {children}
    </div>
  );
}

function TextBox({
  as = "div",
  spec,
  className = "",
  fontMaxPx = spec.fontMaxPx,
  children,
}: {
  as?: "div" | "blockquote";
  spec: QuoteCardTextSpec;
  className?: string;
  fontMaxPx?: number;
  children: React.ReactNode;
}) {
  const Component = as;

  return (
    <Component
      className={`absolute min-w-0 overflow-hidden ${className}`}
      style={{
        ...getLineClampStyle(spec.maxLines),
        left: `${spec.leftPct}%`,
        top: `${spec.topPct}%`,
        width: `${spec.widthPct}%`,
        height: spec.heightPct ? `${spec.heightPct}%` : undefined,
        fontFamily: '"Courier New", ui-monospace, monospace',
        fontSize: getFluidFontSize(spec.fontMinPx, spec.fontCqw, fontMaxPx),
        lineHeight: spec.lineHeight,
        textAlign: spec.align ?? "left",
      }}
    >
      {children}
    </Component>
  );
}
