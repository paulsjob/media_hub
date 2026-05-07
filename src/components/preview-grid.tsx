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
      message: "Rendering preview...",
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
        message: "Rendering preview...",
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
              "MoDeck did not return a preview image, so the local preview is shown.",
            durationMs: data.durationMs ?? null,
            imageSize: null,
          });
          return;
        }

        setModeckPreview({
          signature: requestSignature,
          state: "loaded",
          imageSrc: toImageSrc(data.imageBase64),
          message: data.responseSummary?.info ?? "MoDeck preview loaded.",
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
              : "MoDeck preview failed, so the local preview is shown.",
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PreviewStatus status={getPreviewStatus(activeModeckPreview.state)} />
        {activeOption ? (
          <span className="text-sm font-semibold text-slate-500">
            {safeActiveIndex + 1} of {previewOptions.length} selected
          </span>
        ) : null}
      </div>

      {activeRatio ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <span className="text-sm font-semibold text-[#06153a]">{getActiveFormatLabel(activeOption.output)}</span>
            {hasMultipleRatios ? (
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
            ) : null}
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
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="font-semibold text-[#06153a]">Choose at least one output to preview and generate.</p>
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
        className={`grid min-h-[360px] place-items-center rounded-lg border border-dashed p-8 text-center text-sm ${
          state === "loading"
            ? "border-blue-200 bg-blue-50 text-blue-900"
            : "border-slate-300 bg-slate-50 text-slate-600"
        }`}
      >
        <div>
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm">
            <span
              className={`h-3 w-3 rounded-full ${state === "loading" ? "animate-pulse bg-blue-500" : "bg-orange-500"}`}
              aria-hidden="true"
            />
          </div>
          <div className="mb-1 flex items-center justify-center gap-2 font-semibold text-[#06153a]">
            <span
              className={`h-2 w-2 rounded-full ${state === "loading" ? "bg-blue-500" : "bg-orange-500"}`}
              aria-hidden="true"
            />
            {state === "loading" ? "MoDeck preview rendering" : "Local preview"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-950">
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-3 py-2 text-xs text-slate-200">
        <span className="font-semibold uppercase tracking-wide">
          {state === "loading" ? "Updating MoDeck preview" : "MoDeck preview loaded"}
        </span>
        <span className="text-slate-400">
          {imageSize ? `${imageSize.width}x${imageSize.height}` : "Loading image"}
          {typeof durationMs === "number" ? ` / ${durationMs}ms` : ""}
        </span>
      </div>
      <div className="relative grid min-h-[360px] place-items-center bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,-16px_0] p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="MoDeck-rendered quote card preview"
          onLoad={(event) => onImageLoad(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
          className={`block max-h-[560px] max-w-full rounded-sm border border-slate-700 bg-white object-contain shadow-2xl transition-opacity ${
            state === "loading" ? "opacity-55" : "opacity-100"
          }`}
        />
        {state === "loading" ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/20">
            <div className="rounded-md bg-slate-950/90 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              Updating preview...
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-700 px-3 py-2 text-xs text-slate-300">
        <a
          href={imageSrc}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-600 px-3 py-1.5 font-semibold text-white hover:bg-slate-800"
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
  const trimmed = value.trim();

  return /\.[a-z0-9]{2,5}$/i.test(trimmed) ? trimmed : "";
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
