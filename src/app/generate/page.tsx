import { PackageGenerator } from "@/components/package-generator";
import { MvpShell, SecondaryButton } from "@/components/ui";
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
    outputs?: string;
    frame?: string;
  }>;
}) {
  const params = await searchParams;
  const preview = mediaLab.previewQuoteCardPackage();
  const view = mediaLab.getAssetPackageView(preview.packageDraft.id);
  const initialContent = getInitialContent(params);
  const initialSelectedIds = getInitialSelectedIds(params.outputs, params.size);
  const startedFromPreviewTest = hasPreviewTestParams(params);

  return (
    <MvpShell>
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
            Production / Quote Card
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#06153a] md:text-4xl">
            Quote Card Package Generator
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Select package outputs, fill the quote card fields, approve the preview, and generate a reviewable package.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SecondaryButton href="/templates">Change Template</SecondaryButton>
          <SecondaryButton href="/dev/modeck-preview-test">Open Dev Preview Harness</SecondaryButton>
        </div>
      </div>

      {startedFromPreviewTest ? (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-semibold">Started from MoDeck Preview/Test</p>
          <p className="mt-1">
            Template: {preview.template.name} {preview.template.version} / Status: Active / MoDeck: Connected
          </p>
        </div>
      ) : null}

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

function getInitialSelectedIds(outputs?: string, size?: string) {
  const selectedFromOutputs = outputs?.split(",").filter(Boolean);

  if (selectedFromOutputs && selectedFromOutputs.length > 0) {
    return selectedFromOutputs;
  }

  const outputIdBySize: Record<string, string> = {
    "1920x1080": "still-1920x1080",
    "1080x1080": "still-1080x1080",
    "1080x1350": "still-1080x1350",
    "1080x1920": "still-1080x1920",
  };
  const outputId = size ? outputIdBySize[size] : undefined;

  return outputId ? [outputId] : undefined;
}

function hasPreviewTestParams(params: {
  quote?: string;
  speakerName?: string;
  speakerTitle?: string;
  contextLine?: string;
  headshotFilename?: string;
  size?: string;
  frame?: string;
}) {
  return Boolean(
    params.quote ??
      params.speakerName ??
      params.speakerTitle ??
      params.contextLine ??
      params.headshotFilename ??
      params.size ??
      params.frame,
  );
}
