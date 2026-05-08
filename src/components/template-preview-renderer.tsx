import { RatioPreview } from "@/components/ratio-preview";
import type { PreviewContent, PreviewRatio } from "@/lib/preview-state";

export function TemplatePreviewRenderer({
  ratio,
  content,
}: {
  ratio: PreviewRatio;
  content: PreviewContent;
}) {
  return (
    <PreviewStage>
      <ArtboardFrame ratio={ratio}>
        <RatioPreview ratio={ratio} content={content} />
      </ArtboardFrame>
    </PreviewStage>
  );
}

function PreviewStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-[var(--silver)] bg-[var(--light-gray)] p-4 sm:p-6">
      <div
        className="mx-auto flex h-[var(--preview-stage-height)] max-w-5xl items-center justify-center overflow-visible"
        style={{ "--preview-stage-height": "clamp(360px, 56vw, 620px)" } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

function ArtboardFrame({
  ratio,
  children,
}: {
  ratio: PreviewRatio;
  children: React.ReactNode;
}) {
  const aspect = ratio.width / ratio.height;

  return (
    <div
      className="max-h-full max-w-full shrink-0"
      style={{
        aspectRatio: `${ratio.width} / ${ratio.height}`,
        width: `min(100%, calc(var(--preview-stage-height) * ${aspect}))`,
      }}
    >
      {children}
    </div>
  );
}
