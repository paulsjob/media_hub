import { RatioPreview } from "@/components/ratio-preview";
import type { PreviewContent, PreviewRatio } from "@/lib/preview-state";

export function TemplatePreviewRenderer({
  ratios,
  content,
}: {
  ratios: PreviewRatio[];
  content: PreviewContent;
}) {
  const gridClass =
    ratios.length === 1
      ? "mx-auto max-w-2xl"
      : "grid gap-5 md:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {ratios.map((ratio) => (
        <RatioPreview key={ratio.key} ratio={ratio} content={content} />
      ))}
    </div>
  );
}
