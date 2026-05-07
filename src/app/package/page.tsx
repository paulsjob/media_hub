import { PackageResults, type PackageRenderResult } from "@/components/package-results";
import { MvpShell, SecondaryButton, SectionCard } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";
import type { MvpOutputFormat } from "@/lib/output-formats";

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

  return (
    <MvpShell>
      <div className="mx-auto grid max-w-4xl gap-5">
        <section>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">Quote Card Delivery</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#06153a]">Package ready</h1>
          <p className="mt-3 text-base text-slate-600">
            Review the package details, check render status, and download the available output files.
          </p>
        </section>

        <SectionCard title="Package Summary">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <SummaryItem label="Package Type" value={getTemplateLabel(params.template)} />
              <SummaryItem label="Quote" value={params.quote} multiline />
              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryItem label="Speaker" value={params.speakerName} />
                <SummaryItem label="Speaker Title" value={params.speakerTitle} />
              </div>
              <SummaryItem label="Context Line" value={params.contextLine} />
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Outputs</p>
                <OutputSummary outputs={selectedOutputs} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Render Status / Download State
                </p>
                <RenderSummary outputs={selectedOutputs} renderResults={renderResults} />
              </div>
            </div>
          </div>
        </SectionCard>

        <PackageResults
          stills={stills}
          videos={videos}
          initialRenderResults={renderResults}
          packageName={packageFilename}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <SecondaryButton href={backToGenerateHref}>Back to Generate</SecondaryButton>
          <SecondaryButton href="/">Create Another Package</SecondaryButton>
        </div>
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

function SummaryItem({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`${multiline ? "leading-7" : ""} font-medium text-[#06153a]`}>{value?.trim() || "-"}</p>
    </div>
  );
}

function OutputSummary({ outputs }: { outputs: MvpOutputFormat[] }) {
  if (outputs.length === 0) {
    return <p className="text-sm text-slate-500">No outputs selected.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {outputs.map((output) => (
        <span
          key={output.id}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-[#06153a]"
        >
          {output.type === "video" ? "Video" : "Still"} {output.label}
        </span>
      ))}
    </div>
  );
}

function RenderSummary({
  outputs,
  renderResults,
}: {
  outputs: MvpOutputFormat[];
  renderResults: Record<string, PackageRenderResult>;
}) {
  if (outputs.length === 0) {
    return <p className="text-sm text-slate-500">No render status available.</p>;
  }

  return (
    <div className="space-y-2">
      {outputs.map((output) => {
        const result = renderResults[output.id];
        const status = result?.status ?? (result?.temporaryDownloadUrl ? "ready" : "pending");

        return (
          <div key={output.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#06153a]">
              {output.type === "video" ? "Video" : "Still"} {output.aspectLabel}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getTemplateLabel(template?: string) {
  return template === "quote-card" ? "Quote Card" : template || "Quote Card";
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
