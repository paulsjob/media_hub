"use client";

import { useEffect, useMemo, useState } from "react";
import { PreviewStatus } from "@/components/preview-status";
import { TemplatePreviewRenderer } from "@/components/template-preview-renderer";
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
  ratios,
  content,
}: {
  ratios: PreviewRatio[];
  content: PreviewContent;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modeckPreview, setModeckPreview] = useState<ModeckPreviewSnapshot>({
    signature: "",
    state: "idle",
    imageSrc: null,
    message: "",
    durationMs: null,
    imageSize: null,
  });
  const safeActiveIndex = Math.min(activeIndex, Math.max(ratios.length - 1, 0));
  const activeRatio = ratios[safeActiveIndex];
  const hasMultipleRatios = ratios.length > 1;
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
        message: "Live MoDeck source preview is connected for 16:9. This ratio is using the local layout preview.",
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
      message: "Requesting MoDeck preview...",
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
        message: "Requesting MoDeck preview...",
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
    setActiveIndex((current) => {
      const index = Math.min(current, ratios.length - 1);
      return index === 0 ? ratios.length - 1 : index - 1;
    });
  }

  function showNextPreview() {
    setActiveIndex((current) => (Math.min(current, ratios.length - 1) + 1) % ratios.length);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-[#06153a]">Live Preview</h3>
          <p className="text-sm text-slate-500">MoDeck renders the active source preview when available.</p>
        </div>
        <PreviewStatus status={getPreviewStatus(activeModeckPreview.state)} />
      </div>

      {activeRatio ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#06153a]">
                Preview {safeActiveIndex + 1} of {ratios.length} - {activeRatio.aspectLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Used by {activeRatio.outputIds.length} selected{" "}
                {activeRatio.outputIds.length === 1 ? "output" : "outputs"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={showPreviousPreview}
                disabled={!hasMultipleRatios}
                aria-label="Show previous preview"
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-lg font-semibold text-[#06153a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={showNextPreview}
                disabled={!hasMultipleRatios}
                aria-label="Show next preview"
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-lg font-semibold text-[#06153a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>

          {hasMultipleRatios ? (
            <div className="flex flex-wrap gap-2">
              {ratios.map((ratio, index) => {
                const isActive = index === safeActiveIndex;

                return (
                  <button
                    key={ratio.key}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-blue-300 bg-blue-50 text-blue-800"
                        : "border-slate-300 bg-white text-[#06153a] hover:bg-slate-50"
                    }`}
                    aria-pressed={isActive}
                  >
                    {ratio.aspectLabel}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="space-y-3">
            <ModeckPreviewPanel
              state={activeModeckPreview.state}
              imageSrc={activeModeckPreview.imageSrc}
              imageSize={activeModeckPreview.imageSize}
              durationMs={activeModeckPreview.durationMs}
              message={activeModeckPreview.message}
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
          <p className="mt-2 text-sm text-slate-500">
            Select a still or video size and MEDIA LAB will show the matching preview ratio.
          </p>
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
  message,
  onImageLoad,
}: {
  state: ModeckPreviewState;
  imageSrc: string | null;
  imageSize: { width: number; height: number } | null;
  durationMs: number | null;
  message: string;
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
            {state === "loading" ? "MoDeck preview rendering" : "Local preview active"}
          </div>
          <p>{message}</p>
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
        <span>{message}</span>
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
