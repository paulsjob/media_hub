import { PackageGenerator } from "@/components/package-generator";
import { MvpShell } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";
import type { PreviewContent } from "@/lib/preview-state";

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
    headshotFilename?: string;
    size?: string;
    frame?: string;
  }>;
}) {
  const params = await searchParams;
  const preview = mediaLab.previewQuoteCardPackage();
  const view = mediaLab.getAssetPackageView(preview.packageDraft.id);
  const initialContent = getInitialContent(params);
  const initialSelectedIds = getInitialSelectedIds(params.size);

  return (
    <MvpShell>
      <div className="mb-8">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">Quote Card</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#06153a] md:text-4xl">
            Fill the fields and choose your outputs.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Preview the active source render with MoDeck, then generate the selected stills and videos.
          </p>
        </div>
      </div>

      <PackageGenerator
        template={preview.template}
        fields={view?.packageFields ?? []}
        outputs={mediaLab.getOutputFormats()}
        initialContent={initialContent}
        initialSelectedIds={initialSelectedIds}
      />
    </MvpShell>
  );
}

function getInitialContent(params: {
  quote?: string;
  speakerName?: string;
  speakerTitle?: string;
  contextLine?: string;
  headshotFilename?: string;
}): Partial<PreviewContent> | undefined {
  const content = {
    quote: params.quote,
    speakerName: params.speakerName,
    speakerTitle: params.speakerTitle,
    contextLine: params.contextLine,
    headshot: params.headshotFilename,
  };
  const entries = Object.entries(content).filter((entry): entry is [keyof PreviewContent, string] => {
    const [, value] = entry;
    return typeof value === "string";
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function getInitialSelectedIds(size?: string) {
  const outputIdBySize: Record<string, string> = {
    "1920x1080": "still-1920x1080",
    "1080x1080": "still-1080x1080",
    "1080x1350": "still-1080x1350",
    "1080x1920": "still-1080x1920",
  };
  const outputId = size ? outputIdBySize[size] : undefined;

  return outputId ? [outputId] : undefined;
}
