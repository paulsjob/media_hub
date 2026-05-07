"use client";

import { useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = Math.min(activeIndex, Math.max(ratios.length - 1, 0));
  const activeRatio = ratios[safeActiveIndex];
  const hasMultipleRatios = ratios.length > 1;

  function showPreviousPreview() {
    setActiveIndex((current) => {
      const index = Math.min(current, ratios.length - 1);
      return index === 0 ? ratios.length - 1 : index - 1;
    });
  }

  function showNextPreview() {
    setActiveIndex((current) => (Math.min(current, ratios.length - 1) + 1) % ratios.length);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-[#06153a]">Live Preview</h3>
          <p className="text-sm text-slate-500">One preview per selected ratio.</p>
        </div>
        <PreviewStatus />
      </div>

      {activeRatio ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#06153a]">
                Preview {safeActiveIndex + 1} of {ratios.length} - {activeRatio.aspectLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Used by {activeRatio.outputIds.length} selected{" "}
                {activeRatio.outputIds.length === 1 ? "output" : "outputs"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={showPreviousPreview}
                disabled={!hasMultipleRatios}
                aria-label="Show previous preview"
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-lg font-semibold text-[#06153a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={showNextPreview}
                disabled={!hasMultipleRatios}
                aria-label="Show next preview"
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-lg font-semibold text-[#06153a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>

          {hasMultipleRatios ? (
            <div className="flex flex-wrap gap-2">
              {ratios.map((ratio, index) => {
                const isActive = index === safeActiveIndex;

                return (
                  <button
                    key={ratio.key}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-blue-300 bg-blue-50 text-blue-800"
                        : "border-slate-300 bg-white text-[#06153a] hover:bg-slate-50"
                    }`}
                    aria-pressed={isActive}
                  >
                    {ratio.aspectLabel}
                  </button>
                );
              })}
            </div>
          ) : null}

          <TemplatePreviewRenderer ratio={activeRatio} content={content} />
        </div>
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
