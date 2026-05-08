"use client";

import { useEffect, useMemo, useState } from "react";
import { PreviewStatus } from "@/components/preview-status";
import { TemplatePreviewRenderer } from "@/components/template-preview-renderer";
import type { MvpOutputFormat } from "@/lib/output-formats";
import type { PreviewContent, PreviewRatio } from "@/lib/preview-state";

type ModeckPreviewState = "idle" | "loading" | "loaded" | "error" | "unsupported";

interface ModeckPreviewResult {
  ok: boolean;
  status: string | number;
  durationMs?: number;
  imageBase64?: string | null;
  error?: string;
  responseSummary?: {
    success?: boolean;
    info?: string;
    hasImage?: boolean;
  };
}

interface ModeckPreviewSnapshot {
  signature: string;
  state: ModeckPreviewState;
  imageSrc: string | null;
  message: string;
  durationMs: number | null;
  imageSize: { width: number; height: number } | null;
}

export function PreviewGrid({
  outputs,
  selectedOutputIds,
  activeOutputId,
  content,
  onActiveOutputChange,
}: {
  outputs: MvpOutputFormat[];
  selectedOutputIds: string[];
  activeOutputId: string;
  content: PreviewContent;
  onActiveOutputChange: (outputId: string) => void;
}) {
  const [modeckPreview, setModeckPreview] = useState<ModeckPreviewSnapshot>({
    signature: "",
    state: "idle",
    imageSrc: null,
    message: "",
    durationMs: null,
    imageSize: null,
  });
  const previewOptions = useMemo(
    () => outputs.filter((output) => selectedOutputIds.includes(output.id)).map(outputToPreviewOption),
    [outputs, selectedOutputIds],
  );
  const activeOutputIndex = previewOptions.findIndex((option) => option.output.id === activeOutputId);
  const safeActiveIndex = activeOutputIndex >= 0 ? activeOutputIndex : 0;
  const activeOption = previewOptions[safeActiveIndex];
  const activeRatio = activeOption?.ratio;
  const hasMultipleRatios = previewOptions.length > 1;
  const canUseModeckPreview = activeRatio?.aspectLabel === "16:9";
  const requestSignature = useMemo(
    () =>
      activeRatio
        ? JSON.stringify({
            ratio: activeRatio.key,
            width: activeRatio.width,
            height: activeRatio.height,
            quote: content.quote,
            speakerName: content.speakerName,
            speakerTitle: content.speakerTitle,
            contextLine: content.contextLine,
            headshot: content.headshot,
            headshotPreviewUrl: content.headshotPreviewUrl,
            brand: content.brand ?? "2",
          })
        : "",
    [activeRatio, content],
  );
  const activeModeckPreview = useMemo<ModeckPreviewSnapshot>(() => {
    if (!activeRatio) {
      return {
        signature: requestSignature,
        state: "idle",
        imageSrc: null,
        message: "",
        durationMs: null,
        imageSize: null,
      };
    }

    if (!canUseModeckPreview) {
      return {
        signature: requestSignature,
        state: "unsupported",
        imageSrc: null,
        message: "Local layout preview.",
        durationMs: null,
        imageSize: null,
      };
    }

    if (modeckPreview.signature === requestSignature) {
      return modeckPreview;
    }

    return {
      signature: requestSignature,
      state: "loading",
      imageSrc: null,
      message: "Rendering",
      durationMs: null,
      imageSize: null,
    };
  }, [activeRatio, canUseModeckPreview, modeckPreview, requestSignature]);

  useEffect(() => {
    if (!activeRatio || !canUseModeckPreview) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setModeckPreview({
        signature: requestSignature,
        state: "loading",
        imageSrc: null,
        message: "Rendering",
        durationMs: null,
        imageSize: null,
      });

      try {
        const response = await fetch("/api/modeck/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            size: `${activeRatio.width}x${activeRatio.height}`,
            frame: 0,
            quote: content.quote,
            speakerName: content.speakerName,
            speakerTitle: content.speakerTitle,
            contextLine: content.contextLine,
            headshotFilename: getModeckHeadshotFilename(content.headshot),
            brand: content.brand ?? "2",
          }),
          signal: controller.signal,
        });
        const data = (await response.json()) as ModeckPreviewResult;

        if (!data.ok || !data.imageBase64) {
          setModeckPreview({
            signature: requestSignature,
            state: "error",
            imageSrc: null,
            message:
              data.error ??
              data.responseSummary?.info ??
              "Preview image was not returned, so the local preview is shown.",
            durationMs: data.durationMs ?? null,
            imageSize: null,
          });
          return;
        }

        setModeckPreview({
          signature: requestSignature,
          state: "loaded",
          imageSrc: toImageSrc(data.imageBase64),
          message: data.responseSummary?.info ?? "Preview ready.",
          durationMs: data.durationMs ?? null,
          imageSize: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setModeckPreview({
          signature: requestSignature,
          state: "error",
          imageSrc: null,
          message:
            error instanceof Error
              ? error.message
              : "Preview failed, so the local preview is shown.",
          durationMs: null,
          imageSize: null,
        });
      }
    }, 650);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [activeRatio, canUseModeckPreview, content, requestSignature]);

  function showPreviousPreview() {
    const nextIndex = safeActiveIndex === 0 ? previewOptions.length - 1 : safeActiveIndex - 1;
    const nextOutputId = previewOptions[nextIndex]?.output.id;

    if (nextOutputId) {
      onActiveOutputChange(nextOutputId);
    }
  }

  function showNextPreview() {
    const nextIndex = (safeActiveIndex + 1) % previewOptions.length;
    const nextOutputId = previewOptions[nextIndex]?.output.id;

    if (nextOutputId) {
      onActiveOutputChange(nextOutputId);
    }
  }

  return (
    <div className="space-y-3">
      {activeRatio ? (
        <div className="space-y-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
            <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
              <PreviewStatus status={getPreviewStatus(activeModeckPreview.state)} />
              <span className="text-sm font-semibold text-slate-500">
                {safeActiveIndex + 1} of {previewOptions.length} selected
              </span>
            </div>
            <div className="mt-0.5 flex min-h-7 flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-slate-600">{getActiveFormatLabel(activeOption.output)}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={showPreviousPreview}
                  disabled={!hasMultipleRatios}
                  aria-label="Show previous preview"
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 bg-white text-base font-semibold text-[#06153a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={showNextPreview}
                  disabled={!hasMultipleRatios}
                  aria-label="Show next preview"
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 bg-white text-base font-semibold text-[#06153a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <ModeckPreviewPanel
              state={activeModeckPreview.state}
              imageSrc={activeModeckPreview.imageSrc}
              imageSize={activeModeckPreview.imageSize}
              durationMs={activeModeckPreview.durationMs}
              onImageLoad={(width, height) =>
                setModeckPreview((current) =>
                  current.signature === requestSignature
                    ? { ...current, imageSize: { width, height } }
                    : current,
                )
              }
            />
            {!activeModeckPreview.imageSrc && activeModeckPreview.state !== "loading" ? (
              <TemplatePreviewRenderer ratio={activeRatio} content={content} />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-[var(--silver)] bg-[var(--light-gray)] p-8 text-center">
          <p className="font-bold uppercase tracking-wide text-[var(--navy-blue)]">Select at least one output to render.</p>
        </div>
      )}
    </div>
  );
}

function ModeckPreviewPanel({
  state,
  imageSrc,
  imageSize,
  durationMs,
  onImageLoad,
}: {
  state: ModeckPreviewState;
  imageSrc: string | null;
  imageSize: { width: number; height: number } | null;
  durationMs: number | null;
  onImageLoad: (width: number, height: number) => void;
}) {
  if (state === "idle") {
    return null;
  }

  if (!imageSrc) {
    return (
      <div
        className={`grid min-h-[360px] place-items-center border border-dashed p-8 text-center text-sm ${
          state === "loading"
            ? "border-blue-200 bg-blue-50 text-blue-900"
            : "border-slate-300 bg-slate-50 text-slate-600"
        }`}
      >
        <div>
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center border border-[var(--silver)] bg-white">
            <span
              className={`h-3 w-3 ${state === "loading" ? "animate-pulse bg-[var(--navy-blue)]" : "bg-[var(--flame)]"}`}
              aria-hidden="true"
            />
          </div>
          <div className="mb-1 flex items-center justify-center gap-2 font-bold uppercase tracking-wide text-[var(--navy-blue)]">
            <span
              className={`h-2 w-2 ${state === "loading" ? "bg-[var(--navy-blue)]" : "bg-[var(--flame)]"}`}
              aria-hidden="true"
            />
            {state === "loading" ? "Rendering" : "Preview ready"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[var(--navy-blue)] bg-[var(--navy-blue)]">
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-3 py-2 text-xs text-slate-200">
        <span className="font-semibold uppercase tracking-wide">
          {state === "loading" ? "Rendering" : "Preview ready"}
        </span>
        <span className="text-slate-400">
          {imageSize ? `${imageSize.width}x${imageSize.height}` : "Loading image"}
          {typeof durationMs === "number" ? ` / ${durationMs}ms` : ""}
        </span>
      </div>
      <div className="relative grid min-h-[360px] place-items-center bg-[var(--light-gray)] p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Quote card preview"
          onLoad={(event) => onImageLoad(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
          className={`block max-h-[560px] max-w-full border border-[var(--navy-blue)] bg-white object-contain transition-opacity ${
            state === "loading" ? "opacity-55" : "opacity-100"
          }`}
        />
        {state === "loading" ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/20">
            <div className="border border-white bg-[var(--navy-blue)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
              Rendering
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-700 px-3 py-2 text-xs text-slate-300">
        <a
          href={imageSrc}
          target="_blank"
          rel="noreferrer"
          className="border border-[var(--silver)] px-3 py-1.5 font-bold uppercase tracking-wide text-white hover:bg-[var(--slate-blue)]"
        >
          Open image
        </a>
      </div>
    </div>
  );
}

function getPreviewStatus(state: ModeckPreviewState) {
  if (state === "loading") {
    return "updating";
  }

  if (state === "error") {
    return "error";
  }

  return "updated";
}

function toImageSrc(value: string) {
  return value.startsWith("data:image") ? value : `data:image/png;base64,${value}`;
}

function getModeckHeadshotFilename(value: string) {
  return value.trim();
}

function outputToPreviewOption(output: MvpOutputFormat) {
  return {
    output,
    label: output.type === "video" ? `Video ${output.label}` : output.label,
    ratio: {
      key: output.id,
      aspectLabel: output.aspectLabel,
      width: output.width,
      height: output.height,
      outputIds: [output.id],
    } satisfies PreviewRatio,
  };
}

function getActiveFormatLabel(output: MvpOutputFormat) {
  return `${output.label} · ${output.aspectLabel} · ${output.type === "video" ? "Video" : "Still"}`;
}
