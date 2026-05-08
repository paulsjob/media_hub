import { PackageResults, type PackageRenderResult } from "@/components/package-results";
import { MvpShell } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default async function PackagePage({
  searchParams,
}: {
  searchParams: Promise<{
    template?: string;
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
    headshotFilename?: string;
    outputs?: string;
    previewApproved?: string;
    renders?: string;
  }>;
}) {
  const params = await searchParams;
  const { outputs = "", renders = "" } = params;
  const allOutputs = mediaLab.getOutputFormats();
  const selectedIds = outputs ? outputs.split(",") : allOutputs.map((output) => output.id);
  const selectedOutputs = allOutputs.filter((output) => selectedIds.includes(output.id));
  const stills = selectedOutputs.filter((output) => output.type === "still");
  const videos = selectedOutputs.filter((output) => output.type === "video");
  const renderResults = parseRenderResults(renders);
  const backToGenerateHref = getBackToGenerateHref(params);
  const packageFilename = getPackageFilename(params.speakerName);
  const generatedAt = new Date().toISOString();

  return (
    <MvpShell>
      <div className="mx-auto grid max-w-4xl gap-5">
        <PackageResults
          stills={stills}
          videos={videos}
          initialRenderResults={renderResults}
          packageName={packageFilename}
          packageContext={{
            quote: params.quote,
            speakerName: params.speakerName,
            speakerTitle: params.speakerTitle,
            contextLine: params.contextLine,
            previewApproved: params.previewApproved === "1",
            generatedAt,
          }}
          changeOutputsHref={backToGenerateHref}
          createNewPackageHref="/generate"
        />
      </div>
    </MvpShell>
  );
}

function parseRenderResults(value: string): Record<string, PackageRenderResult> {
  if (!value) {
    return {};
  }

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as PackageRenderResult[];

    return parsed.reduce<Record<string, PackageRenderResult>>((results, result) => {
      results[result.outputId] = result;
      return results;
    }, {});
  } catch {
    return {};
  }
}

function getBackToGenerateHref(params: {
  quote?: string;
  speakerName?: string;
  speakerTitle?: string;
  contextLine?: string;
  headshotFilename?: string;
  outputs?: string;
}) {
  const query = new URLSearchParams();

  if (params.quote) query.set("quote", params.quote);
  if (params.speakerName) query.set("speakerName", params.speakerName);
  if (params.speakerTitle) query.set("speakerTitle", params.speakerTitle);
  if (params.contextLine) query.set("contextLine", params.contextLine);
  if (params.headshotFilename) query.set("headshotFilename", params.headshotFilename);
  if (params.outputs) query.set("outputs", params.outputs);

  const firstOutput = params.outputs?.split(",").find(Boolean);
  const size = firstOutput?.replace(/^still-/, "").replace(/^video-/, "");

  if (size) query.set("size", size);

  const queryString = query.toString();

  return queryString ? `/generate?${queryString}` : "/generate";
}

function getPackageFilename(speakerName?: string) {
  const speakerSlug = slugify(speakerName || "quote-card");

  return `quote-card-${speakerSlug}-2026-package`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
