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
    brand?: string;
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
  const liteOutputs = mediaLab
    .getOutputFormats()
    .filter((output) =>
      ["still-1920x1080", "still-1080x1080", "still-1080x1920"].includes(output.id),
    );

  return (
    <MvpShell>
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="mb-2 inline-block rounded-md bg-[var(--powder-blue)] px-2 py-1 text-sm font-bold text-[var(--navy-blue)]">
            Quote Card
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--navy-blue)] md:text-5xl">
            Generate templated graphics in multiple sizes.
          </h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-[var(--black)]">
            Choose a template, fill the fields, select sizes, and download finished PNGs.
          </p>
        </div>
      </div>

      {startedFromPreviewTest ? (
        <div className="mb-6 border border-[var(--silver)] bg-[var(--powder-blue)] p-4 text-sm text-[var(--navy-blue)]">
          <p className="font-bold uppercase tracking-wide">Started from preview check</p>
          <p className="mt-1">
            Template: {preview.template.name} {preview.template.version} / Status: Connected
          </p>
        </div>
      ) : null}

      <PackageGenerator
        template={preview.template}
        fields={view?.packageFields ?? []}
        outputs={liteOutputs}
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
  brand?: string;
}): Partial<PreviewContent> | undefined {
  const content = {
    quote: params.quote,
    speakerName: params.speakerName,
    speakerTitle: params.speakerTitle,
    contextLine: params.contextLine,
    headshot: params.headshotFilename,
    brand: params.brand,
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
  return Boolean(params.frame);
}
