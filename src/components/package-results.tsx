"use client";

import { useEffect, useMemo, useState } from "react";
import { DownloadRow, SectionCard } from "@/components/ui";
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
}: {
  stills: MvpOutputFormat[];
  videos: MvpOutputFormat[];
  initialRenderResults: Record<string, PackageRenderResult>;
  packageName: string;
}) {
  const [renderResults, setRenderResults] = useState(initialRenderResults);
  const outputs = useMemo(() => [...stills, ...videos], [stills, videos]);
  const resultList = useMemo(() => Object.values(renderResults), [renderResults]);
  const readyDownloads = useMemo(
    () =>
      outputs
        .map((output) => {
          const result = renderResults[output.id];
          const downloadUrl = getSafeDownloadUrl(result?.temporaryDownloadUrl ?? "", result?.editId, output.id);
          const ready = Boolean(downloadUrl) && (result?.source !== "modeck-render" || result.status === "completed");

          return ready
            ? {
                output,
                downloadUrl,
                filename: getDownloadFilename(packageName, output, result?.source),
              }
            : null;
        })
        .filter((item): item is { output: MvpOutputFormat; downloadUrl: string; filename: string } => Boolean(item)),
    [outputs, packageName, renderResults],
  );
  const hasLiveModeckOutput = resultList.some(
    (result) => result.source === "modeck-preview" || result.source === "modeck-render",
  );
  const hasFinalRenderJob = resultList.some((result) => result.source === "modeck-render");
  const hasPendingFinalRender = resultList.some(
    (result) =>
      result.source === "modeck-render" &&
      !["completed", "failed", "canceled"].includes(result.status ?? ""),
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
                    : "Could not refresh MoDeck render status.",
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
                  error instanceof Error ? error.message : "Could not refresh MoDeck render status.",
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
      <section className="mx-auto mb-3 max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {hasFinalRenderJob
            ? "MoDeck Render Package"
            : hasLiveModeckOutput
              ? "MoDeck Preview Package Ready"
              : "Package Ready"}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[#06153a]">
          {hasPendingFinalRender ? "Your package is rendering." : "Your package is ready."}
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          {hasPendingFinalRender
            ? "The supported MoDeck output will update here when the final render is available."
            : "Download the available files below. Live MoDeck outputs are labeled separately from placeholders."}
        </p>
      </section>

      <SectionCard title="Download Package">
        <DownloadAllPackage packageName={packageName} files={readyDownloads} totalOutputs={outputs.length} />
      </SectionCard>

      <SectionCard title="Stills">
        <div className="space-y-3">
          {stills.length > 0 ? (
            stills.map((output) => (
              <DownloadRow
                key={output.id}
                output={output}
                editId={renderResults[output.id]?.editId}
                downloadUrl={renderResults[output.id]?.temporaryDownloadUrl}
                source={renderResults[output.id]?.source}
                status={renderResults[output.id]?.status}
                progress={renderResults[output.id]?.progress}
                errorMessage={renderResults[output.id]?.errorMessage}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500">No still outputs selected.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Videos">
        <div className="space-y-3">
          {videos.length > 0 ? (
            videos.map((output) => (
              <DownloadRow
                key={output.id}
                output={output}
                editId={renderResults[output.id]?.editId}
                downloadUrl={renderResults[output.id]?.temporaryDownloadUrl}
                source={renderResults[output.id]?.source}
                status={renderResults[output.id]?.status}
                progress={renderResults[output.id]?.progress}
                errorMessage={renderResults[output.id]?.errorMessage}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500">No video outputs selected.</p>
          )}
        </div>
      </SectionCard>
    </>
  );
}

function DownloadAllPackage({
  packageName,
  files,
  totalOutputs,
}: {
  packageName: string;
  files: Array<{ output: MvpOutputFormat; downloadUrl: string; filename: string }>;
  totalOutputs: number;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const readyCount = files.length;
  const disabled = readyCount === 0 || isDownloading;

  async function downloadAll() {
    if (disabled) {
      return;
    }

    setIsDownloading(true);

    try {
      if (files.length === 1) {
        await downloadUrl(files[0].downloadUrl, files[0].filename);
        return;
      }

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      await Promise.all(
        files.map(async (file) => {
          const response = await fetch(file.downloadUrl);

          if (!response.ok) {
            throw new Error(`Could not download ${file.filename}.`);
          }

          zip.file(file.filename, await response.blob());
        }),
      );

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${packageName}.zip`);
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
            ? "Download all currently ready outputs. Rendering or failed files are skipped."
            : "Download All will activate when at least one output is ready."}
        </p>
      </div>
      <button
        type="button"
        onClick={downloadAll}
        disabled={disabled}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#06153a] px-4 text-sm font-semibold !text-white shadow-sm hover:bg-[#12306a] disabled:cursor-not-allowed disabled:bg-slate-300"
        style={{ color: "#ffffff" }}
      >
        <span className="text-white">{isDownloading ? "Preparing Package..." : "Download All Package"}</span>
      </button>
    </div>
  );
}

async function downloadUrl(url: string, filename: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not download ${filename}.`);
  }

  downloadBlob(await response.blob(), filename);
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
