"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { CollapsibleSection, SecondaryButton, StatusPill } from "@/components/ui";
import type { StatusPillLabel } from "@/components/ui";
import type { MvpOutputFormat } from "@/lib/output-formats";

export interface PackageRenderResult {
  outputId: string;
  editId: string;
  temporaryDownloadUrl: string;
  source?: "modeck-render" | "modeck-preview" | "mock-placeholder";
  status?: "queued" | "rendering" | "completed" | "failed" | "canceled" | string;
  progress?: number;
  errorMessage?: string;
}

interface ModeckRenderStatusResult {
  ok: boolean;
  outputId: string;
  editId: string;
  status: "queued" | "rendering" | "completed" | "failed" | "canceled";
  progress: number;
  temporaryDownloadUrl?: string | null;
  errorMessage?: string | null;
}

export function PackageResults({
  stills,
  videos,
  initialRenderResults,
  packageName,
  packageContext,
  changeOutputsHref,
  createNewPackageHref,
}: {
  stills: MvpOutputFormat[];
  videos: MvpOutputFormat[];
  initialRenderResults: Record<string, PackageRenderResult>;
  packageName: string;
  packageContext: {
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
    previewApproved: boolean;
    generatedAt: string;
  };
  changeOutputsHref: string;
  createNewPackageHref: string;
}) {
  const [renderResults, setRenderResults] = useState(initialRenderResults);
  const [downloadedOutputIds, setDownloadedOutputIds] = useState<string[]>([]);
  const [packageDownloaded, setPackageDownloaded] = useState(false);
  const outputs = useMemo(() => [...stills, ...videos], [stills, videos]);
  const resultList = useMemo(() => Object.values(renderResults), [renderResults]);
  const deliveryItems = useMemo(
    () =>
      outputs.map((output) => ({
        output,
        result: renderResults[output.id],
        state: getDeliveryState(renderResults[output.id]),
      })),
    [outputs, renderResults],
  );
  const readyFileCount = deliveryItems.filter((item) => item.state === "Ready").length;
  const placeholderFileCount = deliveryItems.filter((item) => item.state === "Placeholder").length;
  const readyDownloads = useMemo(
    () =>
      outputs
        .map((output) => {
          const result = renderResults[output.id];
          const downloadUrl = getSafeDownloadUrl(result?.temporaryDownloadUrl ?? "", result?.editId, output.id);

          return isResultDownloadable(result, downloadUrl)
            ? {
                output,
                downloadUrl,
                filename: getDownloadFilename(packageName, output, result?.source),
                source: result?.source,
              }
            : null;
        })
        .filter(
          (item): item is {
            output: MvpOutputFormat;
            downloadUrl: string;
            filename: string;
            source: PackageRenderResult["source"] | undefined;
          } => Boolean(item),
        ),
    [outputs, packageName, renderResults],
  );
  const pendingModeckRenders = useMemo(
    () =>
      resultList.filter(
        (result) =>
          result.source === "modeck-render" &&
          result.editId &&
          !["completed", "failed", "canceled"].includes(result.status ?? ""),
      ),
    [resultList],
  );

  useEffect(() => {
    if (pendingModeckRenders.length === 0) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      await Promise.all(
        pendingModeckRenders.map(async (render) => {
          try {
            const params = new URLSearchParams({
              editId: render.editId,
              outputId: render.outputId,
            });
            const response = await fetch(`/api/modeck/render/status?${params.toString()}`, {
              signal: controller.signal,
            });
            const data = (await response.json()) as Partial<ModeckRenderStatusResult>;

            setRenderResults((current) => ({
              ...current,
              [render.outputId]: {
                ...current[render.outputId],
                status: response.ok ? data.status ?? current[render.outputId]?.status : "failed",
                progress: response.ok ? data.progress ?? current[render.outputId]?.progress : undefined,
                temporaryDownloadUrl:
                  response.ok && data.temporaryDownloadUrl
                    ? data.temporaryDownloadUrl
                    : current[render.outputId]?.temporaryDownloadUrl,
                errorMessage:
                  response.ok
                    ? data.errorMessage ?? current[render.outputId]?.errorMessage
                    : "Could not refresh render status.",
              },
            }));
          } catch (error) {
            if (controller.signal.aborted) {
              return;
            }

            setRenderResults((current) => ({
              ...current,
              [render.outputId]: {
                ...current[render.outputId],
                status: "failed",
              errorMessage:
                  error instanceof Error ? error.message : "Could not refresh render status.",
              },
            }));
          }
        }),
      );
    }, 2500);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [pendingModeckRenders]);

  return (
    <>
      <PackageReviewHeader
        packageContext={packageContext}
        outputs={outputs}
        readyFileCount={readyFileCount}
        placeholderFileCount={placeholderFileCount}
        packageGenerated={outputs.length > 0}
        packageDownloaded={packageDownloaded}
        changeOutputsHref={changeOutputsHref}
        createNewPackageHref={createNewPackageHref}
      />

      <CollapsibleSection title="Output Previews" defaultOpen>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {outputs.map((output) => (
            <VisualOutputPreviewCard
              key={output.id}
              output={output}
              result={renderResults[output.id]}
              downloaded={downloadedOutputIds.includes(output.id)}
              packageName={packageName}
              onDownloaded={() =>
                setDownloadedOutputIds((current) =>
                  current.includes(output.id) ? current : [...current, output.id],
                )
              }
            />
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Downloads" defaultOpen>
        <DownloadAllPackage
          packageName={packageName}
          files={readyDownloads}
          totalOutputs={outputs.length}
          downloaded={packageDownloaded}
          onDownloaded={() => setPackageDownloaded(true)}
        />
      </CollapsibleSection>

      <PlatformCopyCard packageContext={packageContext} />

      <ArchiveMetadataCard
        packageContext={packageContext}
        outputs={outputs}
        readyFileCount={readyFileCount}
        placeholderFileCount={placeholderFileCount}
      />

      <CollapsibleSection title="Output Details">
        <div className="space-y-3">
          {outputs.map((output) => (
            <DeliveryOutputCard
              key={output.id}
              output={output}
              result={renderResults[output.id]}
              downloaded={downloadedOutputIds.includes(output.id)}
              packageName={packageName}
              onDownloaded={() =>
                setDownloadedOutputIds((current) =>
                  current.includes(output.id) ? current : [...current, output.id],
                )
              }
            />
          ))}
        </div>
      </CollapsibleSection>
    </>
  );
}

function VisualOutputPreviewCard({
  output,
  result,
  downloaded,
  packageName,
  onDownloaded,
}: {
  output: MvpOutputFormat;
  result?: PackageRenderResult;
  downloaded: boolean;
  packageName: string;
  onDownloaded: () => void;
}) {
  const resolvedDownloadUrl = getSafeDownloadUrl(result?.temporaryDownloadUrl ?? "", result?.editId, output.id);
  const state = getDeliveryState(result);
  const canDownload = isResultDownloadable(result, resolvedDownloadUrl);
  const thumbnailUrl = getPreviewThumbnailUrl(output, result, resolvedDownloadUrl, state);
  const previewHelp = getPreviewHelp(state);
  const [downloadError, setDownloadError] = useState("");

  async function downloadFile() {
    if (!canDownload) {
      return;
    }

    setDownloadError("");

    try {
      await downloadUrl(resolvedDownloadUrl, getDownloadFilename(packageName, output, result?.source));
      onDownloaded();
    } catch {
      setDownloadError("File unavailable.");
    }
  }

  return (
    <article
      className={`flex h-full flex-col rounded-lg border bg-white p-4 ${
        downloaded ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {output.type === "video" ? "Video" : "Still"}
          </p>
          <h3 className="mt-1 font-semibold text-[#06153a]">{output.aspectLabel}</h3>
        </div>
        <StatusPill label={downloaded ? "Downloaded" : getStateLabel(state)} />
      </div>

      <PreviewFrame output={output} state={state} thumbnailUrl={thumbnailUrl} />

      {previewHelp ? <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{previewHelp}</p> : <div className="flex-1" />}

      <div className="mt-4">
        <OutputDownloadAction
          canDownload={canDownload}
          downloaded={downloaded}
          unavailableLabel={getUnavailableActionLabel(state)}
          onClick={downloadFile}
          fullWidth
        />
        {downloadError ? <p className="mt-2 text-sm font-semibold text-orange-800">{downloadError}</p> : null}
      </div>
    </article>
  );
}

function PreviewFrame({
  output,
  state,
  thumbnailUrl,
}: {
  output: MvpOutputFormat;
  state: DeliveryState;
  thumbnailUrl: string;
}) {
  return (
    <div className="grid min-h-56 place-items-center border border-[var(--silver)] bg-[var(--light-gray)] p-4">
      <div
        className="relative grid w-full max-w-full place-items-center overflow-hidden border border-[var(--silver)] bg-white text-center"
        style={{
          aspectRatio: `${output.width} / ${output.height}`,
          maxHeight: output.aspectLabel === "9:16" ? "20rem" : output.aspectLabel === "4:5" ? "18rem" : "13rem",
          backgroundImage: thumbnailUrl ? `url("${thumbnailUrl}")` : undefined,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
      >
        {thumbnailUrl ? null : (
          <div className="absolute inset-0 bg-[var(--powder-blue)]" aria-hidden="true" />
        )}
        <div className="relative grid gap-1 px-4">
          <p className="text-lg font-semibold text-[#06153a]">{output.aspectLabel}</p>
          <p className="text-xs text-slate-500">
            {state === "Rendering" ? "Preview pending" : output.type === "video" ? "Video output" : "Still output"}
          </p>
        </div>
      </div>
    </div>
  );
}

function OutputDownloadAction({
  canDownload,
  downloaded,
  unavailableLabel,
  onClick,
  fullWidth = false,
}: {
  canDownload: boolean;
  downloaded: boolean;
  unavailableLabel: string;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  const widthClass = fullWidth ? "w-full" : "";

  if (!canDownload) {
    return (
      <span
        className={`inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500 ${widthClass}`}
      >
        {unavailableLabel}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold ${
        downloaded
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-300 bg-white text-[#06153a] hover:bg-slate-50"
      } ${widthClass}`}
    >
      <Icon name={downloaded ? "check" : "download"} />
      {downloaded ? "Downloaded" : "Download"}
    </button>
  );
}

function PackageReviewHeader({
  packageContext,
  outputs,
  readyFileCount,
  placeholderFileCount,
  packageGenerated,
  packageDownloaded,
  changeOutputsHref,
  createNewPackageHref,
}: {
  packageContext: {
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
    previewApproved: boolean;
    generatedAt: string;
  };
  outputs: MvpOutputFormat[];
  readyFileCount: number;
  placeholderFileCount: number;
  packageGenerated: boolean;
  packageDownloaded: boolean;
  changeOutputsHref: string;
  createNewPackageHref: string;
}) {
  const requiredFieldsCompleted = Boolean(
    packageContext.quote?.trim() &&
      packageContext.speakerName?.trim() &&
      packageContext.speakerTitle?.trim() &&
      packageContext.contextLine?.trim(),
  );

  return (
    <section className="border border-[var(--navy-blue)] bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="brand-heading text-4xl text-[var(--navy-blue)]">One Story. Many Expressions.</h1>
            <StatusPill label="Ready" />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--black)]">Create once. Distribute everywhere.</p>
        </div>
        <div className="flex flex-wrap gap-3 sm:justify-end">
          <SecondaryButton href={changeOutputsHref} className="gap-2">
            <Icon name="sliders" />
            Edit Bundle
          </SecondaryButton>
          <SecondaryButton href={createNewPackageHref} className="gap-2">
            <Icon name="refresh" />
            New Render
          </SecondaryButton>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3 border border-[var(--silver)] bg-[var(--light-gray)] p-4 sm:grid-cols-2">
          <SummaryValue label="Speaker" value={packageContext.speakerName} />
          <SummaryValue label="Title" value={packageContext.speakerTitle} />
          <SummaryValue label="Context" value={packageContext.contextLine} />
          <SummaryValue label="Quote" value={packageContext.quote} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Metric label="Selected outputs" value={outputs.length} />
          <Metric label="Ready files" value={readyFileCount} />
          <Metric label="Not connected" value={placeholderFileCount} />
        </div>
      </div>

      <div className="mt-5 border border-[var(--silver)] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--slate-blue)]">Review Checklist</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <ChecklistItem checked={requiredFieldsCompleted} label="Required fields completed" />
          <ChecklistItem checked={packageContext.previewApproved} label="Preview approved" />
          <ChecklistItem checked={packageGenerated} label="Package generated" />
          <ChecklistItem checked={packageDownloaded} label="Download ready files" />
        </div>
      </div>
    </section>
  );
}

function PlatformCopyCard({
  packageContext,
}: {
  packageContext: {
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
  };
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyBlocks = useMemo(() => getPlatformCopyBlocks(packageContext), [packageContext]);

  async function copyValue(key: string, value: string) {
    await copyText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1800);
  }

  return (
    <CollapsibleSection title="Platform Copy">
      <div className="space-y-2">
        {copyBlocks.map((block) => (
          <div
            key={block.id}
            className={`grid gap-3 rounded-lg border px-3 py-2 md:grid-cols-[8rem_1fr_auto] md:items-start ${
              copiedKey === block.id ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[#06153a]">{block.label}</p>
              {copiedKey === block.id ? (
                <p className="mt-1 text-xs font-semibold text-emerald-800">Copied</p>
              ) : null}
            </div>
            <p className="line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-700">{block.text}</p>
            <button
              type="button"
              onClick={() => copyValue(block.id, block.text)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-[#06153a] hover:bg-slate-50"
            >
              <Icon name="copy" />
              {copiedKey === block.id ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function ArchiveMetadataCard({
  packageContext,
  outputs,
  readyFileCount,
  placeholderFileCount,
}: {
  packageContext: {
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
    generatedAt: string;
  };
  outputs: MvpOutputFormat[];
  readyFileCount: number;
  placeholderFileCount: number;
}) {
  const [copiedKey, setCopiedKey] = useState<"packageId" | "filenameStem" | "metadata" | null>(null);
  const metadata = useMemo(
    () => getArchiveMetadata(packageContext, outputs, readyFileCount, placeholderFileCount),
    [packageContext, outputs, readyFileCount, placeholderFileCount],
  );
  const selectedOutputText = metadata.selectedOutputs.length > 0 ? metadata.selectedOutputs.join(", ") : "Not provided";

  async function copyValue(key: "packageId" | "filenameStem" | "metadata", value: string) {
    await copyText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1800);
  }

  return (
    <CollapsibleSection title="Archive Details">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetadataValue label="Package Type" value={metadata.packageType} />
          <MetadataValue label="Status" value={metadata.status} />
          <MetadataValue label="Speaker" value={metadata.speaker} />
          <MetadataValue label="Speaker Title" value={metadata.speakerTitle} />
          <MetadataValue label="Context" value={metadata.context} className="sm:col-span-2" />
          <MetadataValue label="Selected Outputs" value={selectedOutputText} className="sm:col-span-2" />
          <MetadataValue label="Ready Files" value={String(metadata.readyFiles)} />
          <MetadataValue label="Not Connected" value={String(metadata.placeholderFiles)} />
          <MetadataValue label="Created" value={metadata.generatedDate} className="sm:col-span-2" />
          <MetadataValue label="Suggested Package ID" value={metadata.suggestedPackageId} className="sm:col-span-2" />
          <MetadataValue label="Suggested Filename Stem" value={metadata.suggestedFilenameStem} className="sm:col-span-2" />
          <MetadataValue label="Suggested Tags" value={metadata.suggestedTags.join(", ")} className="sm:col-span-2" />
        </div>

        <div className="flex min-w-48 flex-col gap-2">
          <CopyButton
            label={copiedKey === "packageId" ? "Copied Package ID" : "Copy Package ID"}
            onClick={() => copyValue("packageId", metadata.suggestedPackageId)}
          />
          <CopyButton
            label={copiedKey === "filenameStem" ? "Copied Filename Stem" : "Copy Filename Stem"}
            onClick={() => copyValue("filenameStem", metadata.suggestedFilenameStem)}
          />
          <CopyButton
            label={copiedKey === "metadata" ? "Copied Details JSON" : "Copy Details JSON"}
            onClick={() => copyValue("metadata", JSON.stringify(metadata, null, 2))}
          />
          {copiedKey ? <p className="text-sm font-semibold text-emerald-800">Copied to clipboard.</p> : null}
        </div>
      </div>
    </CollapsibleSection>
  );
}

function MetadataValue({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="break-words font-medium leading-6 text-[#06153a]">{value.trim() || "Not provided"}</p>
    </div>
  );
}

function CopyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-[#06153a] hover:bg-slate-50"
    >
      <Icon name="copy" />
      {label}
    </button>
  );
}

function getPlatformCopyBlocks(packageContext: {
  quote?: string;
  speakerName?: string;
  speakerTitle?: string;
  contextLine?: string;
}) {
  const quote = packageContext.quote?.trim() || "Quote not provided.";
  const speaker = packageContext.speakerName?.trim() || "Speaker not provided.";
  const speakerTitle = packageContext.speakerTitle?.trim();
  const context = packageContext.contextLine?.trim();
  const attribution = speakerTitle ? `${speaker}, ${speakerTitle}` : speaker;

  return [
    {
      id: "x",
      label: "X / Twitter",
      text: `"${quote}"\n\n- ${attribution}`,
    },
    {
      id: "instagram",
      label: "Instagram",
      text: [`"${quote}"`, attribution, context ? `Context: ${context}` : ""].filter(Boolean).join("\n\n"),
    },
    {
      id: "facebook",
      label: "Facebook",
      text: [`Quote card: "${quote}"`, `Attributed to ${attribution}.`, context ? `Context: ${context}` : ""]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      id: "threads",
      label: "Threads",
      text: [`"${quote}"`, `- ${speaker}`, context || ""].filter(Boolean).join("\n\n"),
    },
    {
      id: "altText",
      label: "Alt Text",
      text: `Quote card graphic featuring the quote "${quote}" attributed to ${attribution}.`,
    },
    {
      id: "sourceNote",
      label: "Source / Context Note",
      text: `Context: ${context || "Context not provided."}\nAttribution: ${attribution}.`,
    },
  ];
}

function getArchiveMetadata(
  packageContext: {
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
    generatedAt: string;
  },
  outputs: MvpOutputFormat[],
  readyFileCount: number,
  placeholderFileCount: number,
) {
  const speakerSlug = toSlug(packageContext.speakerName, "not-provided");
  const contextSlug = toSlug(packageContext.contextLine, "");
  const dateStamp = getDateStamp(packageContext.generatedAt);
  const selectedOutputs = outputs.map((output) => `${output.type === "video" ? "Video" : "Still"} ${output.label}`);
  const suggestedPackageId = `quote-card-${dateStamp}-${speakerSlug}`;
  const suggestedFilenameStem = contextSlug ? `quote-card-${speakerSlug}-${contextSlug}` : `quote-card-${speakerSlug}`;
  const suggestedTags = uniqueValues([
    "quote-card",
    packageContext.speakerName ? speakerSlug : "",
    ...getContextTags(packageContext.contextLine),
    "ready-for-review",
  ]);

  return {
    packageType: "Quote Card",
    status: "Ready",
    speaker: packageContext.speakerName?.trim() || "Not provided",
    speakerTitle: packageContext.speakerTitle?.trim() || "Not provided",
    context: packageContext.contextLine?.trim() || "Not provided",
    selectedOutputs,
    readyFiles: readyFileCount,
    placeholderFiles: placeholderFileCount,
    generatedDate: getGeneratedDateLabel(packageContext.generatedAt),
    suggestedPackageId,
    suggestedFilenameStem,
    suggestedTags,
  };
}

function getGeneratedDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDateStamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "date-not-provided";
  }

  return date.toISOString().slice(0, 10);
}

function getContextTags(value?: string) {
  if (!value) {
    return [];
  }

  const stopWords = new Set(["and", "for", "from", "into", "that", "the", "this", "with"]);

  return uniqueValues(
    value
      .split(/\s+/)
      .map((word) => toSlug(word, ""))
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 4),
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSlug(value: string | undefined, fallback: string) {
  return slugify(value ?? "") || fallback;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function SummaryValue({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-medium leading-6 text-[#06153a]">{value?.trim() || "Not provided"}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-2xl font-semibold text-[#06153a]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-[#06153a]">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
          checked ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-500"
        }`}
        aria-hidden="true"
      >
        {checked ? "\u2713" : "\u25CB"}
      </span>
      <span>{label}</span>
    </div>
  );
}

function DownloadAllPackage({
  packageName,
  files,
  totalOutputs,
  downloaded,
  onDownloaded,
}: {
  packageName: string;
  files: Array<{
    output: MvpOutputFormat;
    downloadUrl: string;
    filename: string;
    source: PackageRenderResult["source"] | undefined;
  }>;
  totalOutputs: number;
  downloaded: boolean;
  onDownloaded: () => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{
    tone: "warning" | "error";
    message: string;
  } | null>(null);
  const readyCount = files.length;
  const disabled = readyCount === 0 || isDownloading;
  const includesPlaceholders = files.some((file) => file.source === "mock-placeholder");
  const allOutputsReady = readyCount === totalOutputs && !includesPlaceholders;
  const buttonLabel = downloaded ? "Downloaded ZIP" : allOutputsReady ? "Download All Package" : "Download Ready Files";

  async function downloadAll() {
    if (disabled) {
      return;
    }

    setIsDownloading(true);
    setDownloadStatus(null);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const failedFiles: string[] = [];
      let downloadedCount = 0;

      for (const file of files) {
        try {
          const response = await fetch(file.downloadUrl);

          if (!response.ok) {
            failedFiles.push(file.filename);
            continue;
          }

          zip.file(file.filename, await response.blob());
          downloadedCount += 1;
        } catch {
          failedFiles.push(file.filename);
        }
      }

      if (downloadedCount === 0) {
        setDownloadStatus({ tone: "error", message: "No files could be downloaded." });
        return;
      }

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${packageName}.zip`);
      onDownloaded();

      if (failedFiles.length > 0) {
        setDownloadStatus({
          tone: "warning",
          message: `Downloaded ${downloadedCount} ${pluralize("file", downloadedCount)}. ${failedFiles.length} unavailable.`,
        });
      }
    } catch {
      setDownloadStatus({ tone: "error", message: "No files could be downloaded." });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-[#06153a]">
          {readyCount > 0
            ? `${readyCount} of ${totalOutputs} outputs ready`
            : "No package files ready yet"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {readyCount > 0
            ? includesPlaceholders
              ? "Includes ready files and connected previews."
              : "Rendering or unavailable files are skipped."
            : "Available when at least one output is ready."}
        </p>
        {downloaded ? <p className="mt-2 text-sm font-semibold text-emerald-800">Package downloaded.</p> : null}
        {downloadStatus ? (
          <p
            className={`mt-2 text-sm font-semibold ${
              downloadStatus.tone === "warning"
                  ? "text-orange-800"
                  : "text-red-700"
            }`}
          >
            {downloadStatus.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={downloadAll}
        disabled={disabled}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#06153a] px-4 text-sm font-semibold !text-white shadow-sm hover:bg-[#12306a] disabled:cursor-not-allowed disabled:bg-slate-300"
        style={{ color: "#ffffff" }}
      >
        <Icon name={downloaded ? "check" : "download"} />
        <span className="text-white">{isDownloading ? "Preparing package..." : buttonLabel}</span>
      </button>
    </div>
  );
}

function DeliveryOutputCard({
  output,
  result,
  downloaded,
  packageName,
  onDownloaded,
}: {
  output: MvpOutputFormat;
  result?: PackageRenderResult;
  downloaded: boolean;
  packageName: string;
  onDownloaded: () => void;
}) {
  const resolvedDownloadUrl = getSafeDownloadUrl(result?.temporaryDownloadUrl ?? "", result?.editId, output.id);
  const state = getDeliveryState(result);
  const canDownload = isResultDownloadable(result, resolvedDownloadUrl);
  const showProgress = result?.source === "modeck-render" && ["queued", "rendering"].includes(result.status ?? "");
  const [downloadError, setDownloadError] = useState("");

  async function downloadFile() {
    if (!canDownload) {
      return;
    }

    setDownloadError("");

    try {
      await downloadUrl(resolvedDownloadUrl, getDownloadFilename(packageName, output, result?.source));
      onDownloaded();
    } catch {
      setDownloadError("File unavailable.");
    }
  }

  return (
    <div
      className={`grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-[150px_1fr_auto] md:items-center ${
        downloaded ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
      }`}
    >
      <OutputThumbnail output={output} source={result?.source} state={state} />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[#06153a]">
            {output.type === "video" ? "Video" : "Still"} - {output.label}
          </p>
          <StatusPill label={downloaded ? "Downloaded" : getStateLabel(state)} />
        </div>
        <p className="mt-1 text-sm text-slate-500">{getStateHelp(state)}</p>
        {result?.editId ? (
          <details className="mt-1 text-xs text-slate-400">
            <summary className="cursor-pointer">Version details</summary>
            <p className="mt-1">Version ID: {result.editId}</p>
          </details>
        ) : null}
        {showProgress ? (
          <div className="mt-3 max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.max(5, Math.min(100, result?.progress ?? (state === "Ready" ? 100 : 5)))}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <OutputDownloadAction
          canDownload={canDownload}
          downloaded={downloaded}
          unavailableLabel={getUnavailableActionLabel(state)}
          onClick={downloadFile}
        />
        {downloadError ? <p className="text-sm font-semibold text-orange-800">{downloadError}</p> : null}
      </div>
    </div>
  );
}

function OutputThumbnail({
  output,
  source,
  state,
}: {
  output: MvpOutputFormat;
  source?: PackageRenderResult["source"];
  state: DeliveryState;
}) {
  return (
    <div className="grid place-items-center rounded-md border border-slate-200 bg-slate-50 p-3">
      <div
        className="grid max-h-28 w-full place-items-center rounded-sm border border-slate-300 bg-white text-center shadow-sm"
        style={{ aspectRatio: `${output.width} / ${output.height}` }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {source === "mock-placeholder" ? "Not connected" : getStateLabel(state)}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#06153a]">{output.aspectLabel}</p>
          <p className="mt-0.5 text-xs text-slate-500">{output.type === "video" ? "Video" : "Still"}</p>
        </div>
      </div>
    </div>
  );
}

type DeliveryState = "Ready" | "Rendering" | "Placeholder" | "Unavailable" | "Failed";

function getDeliveryState(result?: PackageRenderResult): DeliveryState {
  if (!result) {
    return "Rendering";
  }

  if (result.errorMessage) {
    return "Unavailable";
  }

  if (result.status === "failed" || result.status === "canceled") {
    return "Failed";
  }

  if (result.source === "mock-placeholder") {
    return "Placeholder";
  }

  if (result.source === "modeck-render" && result.status !== "completed") {
    return "Rendering";
  }

  return "Ready";
}

function getStateLabel(state: DeliveryState): StatusPillLabel {
  if (state === "Placeholder") {
    return "Not connected";
  }

  if (state === "Unavailable" || state === "Failed") {
    return "Render unavailable";
  }

  return state;
}

function getStateHelp(state: DeliveryState) {
  return {
    Ready: "Final output ready.",
    Rendering: "Final output is still rendering.",
    Placeholder: "Format not connected yet.",
    Unavailable: "Render unavailable.",
    Failed: "Render did not complete.",
  }[state];
}

function getPreviewHelp(state: DeliveryState) {
  return {
    Ready: "",
    Rendering: "",
    Placeholder: "Format not connected yet.",
    Unavailable: "Render unavailable.",
    Failed: "Render did not complete.",
  }[state];
}

function getUnavailableActionLabel(state: DeliveryState) {
  return {
    Ready: "File unavailable",
    Rendering: "Rendering",
    Placeholder: "File unavailable",
    Unavailable: "File unavailable",
    Failed: "File unavailable",
  }[state];
}

function getPreviewThumbnailUrl(
  output: MvpOutputFormat,
  result: PackageRenderResult | undefined,
  resolvedDownloadUrl: string,
  state: DeliveryState,
) {
  if (output.type !== "still" || state !== "Ready" || !resolvedDownloadUrl) {
    return "";
  }

  if (result?.source === "mock-placeholder") {
    return "";
  }

  return resolvedDownloadUrl;
}

function isResultDownloadable(result: PackageRenderResult | undefined, resolvedDownloadUrl: string) {
  if (!result || !resolvedDownloadUrl || result.errorMessage) {
    return false;
  }

  return result.source !== "modeck-render" || result.status === "completed";
}

async function downloadUrl(url: string, filename: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not download ${filename}.`);
  }

  downloadBlob(await response.blob(), filename);
}

function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`;
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function getDownloadFilename(
  packageName: string,
  output: MvpOutputFormat,
  source: PackageRenderResult["source"] | undefined,
) {
  const extension = source === "mock-placeholder" && output.type === "video" ? "txt" : output.type === "video" ? "mp4" : "png";

  return `${packageName}-${output.type}-${output.label}.${extension}`;
}

function getSafeDownloadUrl(downloadUrl: string, editId: string | undefined, outputId: string) {
  if (!downloadUrl) {
    return "";
  }

  if (!downloadUrl.includes("mock.modeck.local")) {
    return downloadUrl;
  }

  const query = new URLSearchParams({
    editId: editId ?? "mock-edit",
    outputId,
  });

  return `/api/mock-modeck/download?${query.toString()}`;
}
