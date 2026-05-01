import { PreviewStatus } from "@/components/preview-status";
import { TemplatePreviewRenderer } from "@/components/template-preview-renderer";
import type { PreviewContent, PreviewRatio } from "@/lib/preview-state";

export function PreviewGrid({
  ratios,
  content,
}: {
  ratios: PreviewRatio[];
  content: PreviewContent;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-[#06153a]">Live Preview</h3>
          <p className="text-sm text-slate-500">One preview per selected ratio.</p>
        </div>
        <PreviewStatus />
      </div>

      {ratios.length > 0 ? (
        <TemplatePreviewRenderer ratios={ratios} content={content} />
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="font-semibold text-[#06153a]">Choose at least one output to preview and generate.</p>
          <p className="mt-2 text-sm text-slate-500">
            Select a still or video size and MEDIA LAB will show the matching preview ratio.
          </p>
        </div>
      )}
    </div>
  );
}
