"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  pollAttempts?: number;
  pollTimedOut?: boolean;
  lastStatusDetails?: string;
}

interface ModeckRenderStatusResult {
  ok: boolean;
  outputId: string;
  editId: string;
  status: "queued" | "rendering" | "completed" | "failed" | "canceled";
  progress: number;
  temporaryDownloadUrl?: string | null;
  errorMessage?: string | null;
  statusDebug?: {
    renderStatusCode?: unknown;
    renderStatusStatus?: unknown;
    renderStatusDetails?: unknown;
    renderStatusCurrentlyRendering?: unknown;
  };
}

const MODECK_STATUS_POLL_INTERVAL_MS = 5000;
const MODECK_STATUS_MAX_ATTEMPTS = 120;

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
    template?: string;
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
    headshotFilename?: string;
    brand?: string;
    previewApproved: boolean;
    generatedAt: string;
  };
  changeOutputsHref: string;
  createNewPackageHref: string;
}) {
  const [renderResults, setRenderResults] = useState(initialRenderResults);
  const [downloadedOutputIds, setDownloadedOutputIds] = useState<string[]>([]);
  const [packageDownloaded, setPackageDownloaded] = useState(false);
  const [approvedPreviewThumbnails, setApprovedPreviewThumbnails] = useState<Record<string, string>>({});
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
  const readyFileCount = deliveryItems.filter((item) => {
    const downloadUrl = getSafeDownloadUrl(item.result?.temporaryDownloadUrl ?? "", item.result?.editId);

    return isResultDownloadable(item.result, downloadUrl);
  }).length;
  const placeholderFileCount = deliveryItems.filter((item) => item.state === "Placeholder").length;
  const readyDownloads = useMemo(
    () =>
      outputs
        .map((output) => {
          const result = renderResults[output.id];
          const downloadUrl = getSafeDownloadUrl(result?.temporaryDownloadUrl ?? "", result?.editId);

          return isResultDownloadable(result, downloadUrl)
            ? {
                output,
                downloadUrl,
                filename: getDownloadFilename(packageName, output),
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
  const pendingModeckRenders = resultList.filter(
    (result) => isPendingModeckRender(result) && !downloadedOutputIds.includes(result.outputId),
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!packageContext.previewApproved) {
        setApprovedPreviewThumbnails({});
        return;
      }

      setApprovedPreviewThumbnails(readApprovedPreviewThumbnails(outputs, packageContext));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [outputs, packageContext]);

  const updateRenderStatus = useCallback((
    outputId: string,
    update: Partial<ModeckRenderStatusResult>,
    responseOk: boolean,
    resetPollAttempts = false,
  ) => {
    setRenderResults((current) => {
      const currentResult = current[outputId];

      return {
        ...current,
        [outputId]: {
          ...currentResult,
          status: responseOk ? update.status ?? currentResult?.status : "failed",
          progress: responseOk ? update.progress ?? currentResult?.progress : undefined,
          pollAttempts: resetPollAttempts ? 0 : (currentResult?.pollAttempts ?? 0) + 1,
          pollTimedOut: false,
          lastStatusDetails: getStatusDetails(update),
          temporaryDownloadUrl:
            responseOk && update.temporaryDownloadUrl
              ? update.temporaryDownloadUrl
              : currentResult?.temporaryDownloadUrl ?? "",
          errorMessage: responseOk
            ? update.errorMessage || undefined
            : "Could not refresh render status.",
        },
      };
    });
  }, []);
  const markRenderPollTimedOut = useCallback((outputId: string) => {
    setRenderResults((current) => {
      const currentResult = current[outputId];

      return {
        ...current,
        [outputId]: {
          ...currentResult,
          status: currentResult?.status ?? "rendering",
          pollTimedOut: true,
          lastStatusDetails: currentResult?.lastStatusDetails || "Still rendering.",
        },
      };
    });
  }, []);
  const refreshRenderStatus = useCallback(async (render: PackageRenderResult) => {
    const data = await fetchRenderStatus(render);
    updateRenderStatus(render.outputId, data.update, data.responseOk, true);
  }, [updateRenderStatus]);

  return (
    <>
      {pendingModeckRenders.map((render) => (
        <ModeckRenderStatusPoller
          key={`${render.outputId}:${render.editId}`}
          render={render}
          onStatus={updateRenderStatus}
          onMaxAttempts={markRenderPollTimedOut}
        />
      ))}

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
              approvedThumbnailUrl={approvedPreviewThumbnails[output.id] ?? ""}
              downloaded={downloadedOutputIds.includes(output.id)}
              packageName={packageName}
              onRefreshStatus={() => {
                const result = renderResults[output.id];

                if (result) {
                  void refreshRenderStatus(result);
                }
              }}
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

      <CollapsibleSection title="Output Details">
        <div className="space-y-3">
          {outputs.map((output) => (
            <DeliveryOutputCard
              key={output.id}
              output={output}
              result={renderResults[output.id]}
              downloaded={downloadedOutputIds.includes(output.id)}
              packageName={packageName}
              onRefreshStatus={() => {
                const result = renderResults[output.id];

                if (result) {
                  void refreshRenderStatus(result);
                }
              }}
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

function ModeckRenderStatusPoller({
  render,
  onStatus,
  onMaxAttempts,
}: {
  render: PackageRenderResult;
  onStatus: (outputId: string, update: Partial<ModeckRenderStatusResult>, responseOk: boolean) => void;
  onMaxAttempts: (outputId: string) => void;
}) {
  useEffect(() => {
    const attempt = (render.pollAttempts ?? 0) + 1;

    if (attempt > MODECK_STATUS_MAX_ATTEMPTS) {
      logModeckPoll({
        render,
        attempt,
        status: render.status ?? "rendering",
        willContinue: false,
        reason: "max_attempts",
      });
      onMaxAttempts(render.outputId);
      return;
    }

    let canceled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const data = await fetchRenderStatus(render);
        const willContinue = shouldContinuePolling(data.update, data.responseOk, attempt);

        logModeckPoll({
          render,
          attempt,
          update: data.update,
          responseOk: data.responseOk,
          willContinue,
        });

        if (!canceled) {
          onStatus(render.outputId, data.update, data.responseOk);
        }
      } catch (error) {
        logModeckPoll({
          render,
          attempt,
          status: "failed",
          willContinue: false,
          reason: error instanceof Error ? error.message : "poll_error",
        });

        if (!canceled) {
          onStatus(
            render.outputId,
            {
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Could not refresh render status.",
            },
            false,
          );
        }
      }
    }, MODECK_STATUS_POLL_INTERVAL_MS);

    return () => {
      canceled = true;
      window.clearTimeout(timeoutId);
    };
  }, [render, onMaxAttempts, onStatus]);

  return null;
}

async function fetchRenderStatus(render: PackageRenderResult) {
  const params = new URLSearchParams({
    editId: render.editId,
    outputId: render.outputId,
  });

  logModeckStatusRequest(render);

  const response = await fetch(`/api/modeck/render/status?${params.toString()}`);
  const update = (await response.json()) as Partial<ModeckRenderStatusResult>;

  return {
    update,
    responseOk: response.ok,
  };
}

function logModeckStatusRequest(render: PackageRenderResult) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-status-poll-request]", {
    outputId: render.outputId,
    editId: render.editId,
    currentStatus: render.status ?? null,
    intervalMs: MODECK_STATUS_POLL_INTERVAL_MS,
  });
}

function shouldContinuePolling(
  update: Partial<ModeckRenderStatusResult>,
  responseOk: boolean,
  attempt: number,
) {
  if (!responseOk || attempt >= MODECK_STATUS_MAX_ATTEMPTS) {
    return false;
  }

  if (update.status === "completed" && update.temporaryDownloadUrl) {
    return false;
  }

  return !["failed", "canceled"].includes(update.status ?? "");
}

function getStatusDetails(update: Partial<ModeckRenderStatusResult>) {
  const details = update.statusDebug?.renderStatusDetails;

  return typeof details === "string" ? details : undefined;
}

function logModeckPoll({
  render,
  attempt,
  update,
  responseOk = true,
  status,
  willContinue,
  reason,
}: {
  render: PackageRenderResult;
  attempt: number;
  update?: Partial<ModeckRenderStatusResult>;
  responseOk?: boolean;
  status?: string;
  willContinue: boolean;
  reason?: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-render-poll]", {
    outputId: render.outputId,
    editId: render.editId,
    attempt,
    normalizedStatus: update?.status ?? status,
    renderStatusCode: update?.statusDebug?.renderStatusCode ?? null,
    renderStatusStatus: update?.statusDebug?.renderStatusStatus ?? null,
    renderStatusDetails: update?.statusDebug?.renderStatusDetails ?? render.lastStatusDetails ?? null,
    currentlyRendering: update?.statusDebug?.renderStatusCurrentlyRendering ?? null,
    responseOk,
    willContinue,
    reason: reason ?? null,
  });
}

function VisualOutputPreviewCard({
  output,
  result,
  approvedThumbnailUrl,
  downloaded,
  packageName,
  onRefreshStatus,
  onDownloaded,
}: {
  output: MvpOutputFormat;
  result?: PackageRenderResult;
  approvedThumbnailUrl: string;
  downloaded: boolean;
  packageName: string;
  onRefreshStatus: () => void;
  onDownloaded: () => void;
}) {
  const resolvedDownloadUrl = getSafeDownloadUrl(result?.temporaryDownloadUrl ?? "", result?.editId);
  const state = getDeliveryState(result);
  const canDownload = isResultDownloadable(result, resolvedDownloadUrl);
  const thumbnailUrl = getPreviewThumbnailUrl(output, result, approvedThumbnailUrl, state);
  const previewHelp = getPreviewHelp(state);
  const [downloadError, setDownloadError] = useState("");

  async function downloadFile() {
    if (!canDownload) {
      return;
    }

    setDownloadError("");

    try {
      await downloadUrl(resolvedDownloadUrl, getDownloadFilename(packageName, output));
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
      {result?.pollTimedOut ? (
        <div className="mt-2">
          <p className="text-sm font-semibold text-orange-800">Still rendering. Try refresh status.</p>
          <button
            type="button"
            onClick={onRefreshStatus}
            className="mt-2 inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-[#06153a] hover:bg-slate-50"
          >
            Refresh status
          </button>
        </div>
      ) : null}

      <div className="mt-4">
        <OutputDownloadAction
          canDownload={canDownload}
          downloaded={downloaded}
          downloadLabel={output.type === "still" ? "Download PNG" : "Download File"}
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
        {thumbnailUrl ? null : (
          <div className="relative grid gap-1 px-4">
            <p className="text-lg font-semibold text-[#06153a]">{output.aspectLabel}</p>
            <p className="text-xs text-slate-500">{getPreviewFrameLabel(output, state)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OutputDownloadAction({
  canDownload,
  downloaded,
  downloadLabel,
  unavailableLabel,
  onClick,
  fullWidth = false,
}: {
  canDownload: boolean;
  downloaded: boolean;
  downloadLabel: string;
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
      {downloaded ? "Downloaded" : downloadLabel}
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
    <section className="rounded-lg border border-[var(--silver)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="brand-heading text-4xl text-[var(--navy-blue)]">Generated Outputs</h1>
            <StatusPill label="Ready" />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--black)]">
            Download the finished graphics when each selected size is ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 sm:justify-end">
          <SecondaryButton href={changeOutputsHref} className="gap-2">
            <Icon name="sliders" />
            Edit Fields
          </SecondaryButton>
          <SecondaryButton href={createNewPackageHref} className="gap-2">
            <Icon name="refresh" />
            New Graphic
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
          <ChecklistItem checked={packageGenerated} label="Graphics generated" />
          <ChecklistItem checked={packageDownloaded} label="Download ready files" />
        </div>
      </div>
    </section>
  );
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
  const allOutputsReady = readyCount === totalOutputs;
  const buttonLabel = downloaded ? "Downloaded ZIP" : allOutputsReady ? "Download All ZIP" : "Download Ready Files";

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
            ? "Only completed connected renders are downloaded."
            : "Available when at least one output is ready."}
        </p>
        {downloaded ? <p className="mt-2 text-sm font-semibold text-emerald-800">ZIP downloaded.</p> : null}
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
  onRefreshStatus,
  onDownloaded,
}: {
  output: MvpOutputFormat;
  result?: PackageRenderResult;
  downloaded: boolean;
  packageName: string;
  onRefreshStatus: () => void;
  onDownloaded: () => void;
}) {
  const resolvedDownloadUrl = getSafeDownloadUrl(result?.temporaryDownloadUrl ?? "", result?.editId);
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
      await downloadUrl(resolvedDownloadUrl, getDownloadFilename(packageName, output));
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
        {result?.pollTimedOut ? (
          <p className="mt-2 text-sm font-semibold text-orange-800">Still rendering. Try refresh status.</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        <OutputDownloadAction
          canDownload={canDownload}
          downloaded={downloaded}
          downloadLabel={output.type === "still" ? "Download PNG" : "Download File"}
          unavailableLabel={getUnavailableActionLabel(state)}
          onClick={downloadFile}
        />
        {result?.pollTimedOut ? (
          <button
            type="button"
            onClick={onRefreshStatus}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-[#06153a] hover:bg-slate-50"
          >
            Refresh status
          </button>
        ) : null}
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

function readApprovedPreviewThumbnails(
  outputs: MvpOutputFormat[],
  packageContext: {
    template?: string;
    quote?: string;
    speakerName?: string;
    speakerTitle?: string;
    contextLine?: string;
    headshotFilename?: string;
    brand?: string;
  },
) {
  const thumbnails: Record<string, string> = {};

  if (typeof window === "undefined") {
    return thumbnails;
  }

  outputs.forEach((output) => {
    const storageKey = getApprovedPreviewStorageKey({
      template: packageContext.template ?? "quote-card",
      outputId: output.id,
      quote: packageContext.quote ?? "",
      speakerName: packageContext.speakerName ?? "",
      speakerTitle: packageContext.speakerTitle ?? "",
      contextLine: packageContext.contextLine ?? "",
      headshotFilename: packageContext.headshotFilename ?? "",
      brand: String(normalizeQuoteCardBrandValue(packageContext.brand ?? "2")),
      width: output.width,
      height: output.height,
      aspectLabel: output.aspectLabel,
    });

    try {
      const cached = window.sessionStorage.getItem(storageKey);

      if (!cached) {
        return;
      }

      const parsed = JSON.parse(cached) as { outputId?: string; imageSrc?: string };

      if (parsed.outputId === output.id && typeof parsed.imageSrc === "string") {
        thumbnails[output.id] = parsed.imageSrc;
      }
    } catch {
      // Missing thumbnail cache should not affect package readiness or downloads.
    }
  });

  return thumbnails;
}

function getApprovedPreviewStorageKey(parts: {
  template: string;
  outputId: string;
  quote: string;
  speakerName: string;
  speakerTitle: string;
  contextLine: string;
  headshotFilename: string;
  brand: string;
  width: number;
  height: number;
  aspectLabel: string;
}) {
  return `modeck-approved-preview:${JSON.stringify(parts)}`;
}

function normalizeQuoteCardBrandValue(value: string | number | undefined) {
  if (typeof value === "string") {
    const normalizedLabel = value.trim().toLowerCase();

    if (normalizedLabel === "majority democrats") {
      return 1;
    }

    if (normalizedLabel === "the bench" || normalizedLabel === "default brand") {
      return 2;
    }
  }

  const parsed = typeof value === "string" ? Number(value) : value;

  return parsed === 1 || parsed === 2 ? parsed : 2;
}

function isPendingModeckRender(result: PackageRenderResult) {
  const completedWithDownload = result.status === "completed" && Boolean(result.temporaryDownloadUrl);

  return (
    result.source === "modeck-render" &&
    Boolean(result.editId) &&
    !result.pollTimedOut &&
    !completedWithDownload &&
    !["failed", "canceled"].includes(result.status ?? "")
  );
}

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

  if (result.source === "modeck-preview") {
    return "Placeholder";
  }

  if (
    result.source === "modeck-render" &&
    (result.status !== "completed" || !result.temporaryDownloadUrl)
  ) {
    return "Rendering";
  }

  return result.source === "modeck-render" && result.status === "completed" && result.temporaryDownloadUrl
    ? "Ready"
    : "Placeholder";
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
    Ready: "Render ready.",
    Rendering: "",
    Placeholder: "Preview placeholder only. Final MoDeck template not connected.",
    Unavailable: "Render unavailable.",
    Failed: "Render did not complete.",
  }[state];
}

function getPreviewFrameLabel(output: MvpOutputFormat, state: DeliveryState) {
  if (state === "Rendering") {
    return "Preview pending";
  }

  if (state === "Ready") {
    return "Render ready";
  }

  return output.type === "video" ? "Video output" : "Still output";
}

function getUnavailableActionLabel(state: DeliveryState) {
  return {
    Ready: "File unavailable",
    Rendering: "Rendering",
    Placeholder: "Not connected",
    Unavailable: "File unavailable",
    Failed: "File unavailable",
  }[state];
}

function getPreviewThumbnailUrl(
  output: MvpOutputFormat,
  result: PackageRenderResult | undefined,
  approvedThumbnailUrl: string,
  state: DeliveryState,
) {
  if (output.type !== "still" || !approvedThumbnailUrl) {
    return "";
  }

  if (!result || result.source !== "modeck-render" || ["Failed", "Unavailable"].includes(state)) {
    return "";
  }

  return approvedThumbnailUrl;
}

function isResultDownloadable(result: PackageRenderResult | undefined, resolvedDownloadUrl: string) {
  if (!result || !resolvedDownloadUrl || result.errorMessage) {
    return false;
  }

  if (result.source !== "modeck-render" || result.status !== "completed") {
    return false;
  }

  if (result.editId?.startsWith("mock-edit")) {
    return false;
  }

  return true;
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

function getDownloadFilename(packageName: string, output: MvpOutputFormat) {
  const extension = output.type === "video" ? "mp4" : "png";

  return `${packageName}-${output.type}-${output.label}.${extension}`;
}

function getSafeDownloadUrl(downloadUrl: string, editId: string | undefined) {
  if (!downloadUrl) {
    return "";
  }

  if (editId?.startsWith("mock-edit") || downloadUrl.includes("mock.modeck.local")) {
    return "";
  }

  if (downloadUrl.includes("/api/mock-modeck/download")) {
    return "";
  }

  return downloadUrl;
}
