"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface ModeckPreviewRequest {
  previewCacheKey: string;
  storageKey: string;
  templateId: string;
  outputId: string;
  activePreviewIndex: number;
  width: number;
  height: number;
  aspectLabel: string;
  quote: string;
  speakerName: string;
  speakerTitle: string;
  contextLine: string;
  headshot: string;
  brand: string;
}

interface PreviewOption {
  output: MvpOutputFormat;
  label: string;
  ratio: PreviewRatio;
}

const connectedPreviewOutputIds = new Set([
  "still-1920x1080",
  "still-1080x1080",
  "still-1080x1350",
  "still-1080x1920",
]);
const PREVIEW_REQUEST_DEBOUNCE_MS = 350;
const previewCache = new Map<string, ModeckPreviewSnapshot>();
const previewInFlight = new Map<string, Promise<ModeckPreviewSnapshot>>();

function buildPreviewRequest(
  option: PreviewOption,
  activePreviewIndex: number,
  content: PreviewContent,
  templateId: string,
): ModeckPreviewRequest | null {
  if (!connectedPreviewOutputIds.has(option.output.id)) {
    return null;
  }

  const quote = content.quote ?? "";
  const speakerName = content.speakerName ?? "";
  const speakerTitle = content.speakerTitle ?? "";
  const contextLine = content.contextLine ?? "";
  const headshot = content.headshot ?? "";
  const brand = String(normalizeQuoteCardBrandValue(content.brand ?? "2"));
  const keyParts = {
    template: templateId,
    outputId: option.output.id,
    quote,
    speakerName,
    speakerTitle,
    contextLine,
    headshotFilename: headshot,
    brand,
    width: option.ratio.width,
    height: option.ratio.height,
    aspectLabel: option.ratio.aspectLabel,
  };
  const previewCacheKey = JSON.stringify(keyParts);

  return {
    previewCacheKey,
    storageKey: getApprovedPreviewStorageKey(keyParts),
    templateId,
    outputId: option.output.id,
    activePreviewIndex,
    width: option.ratio.width,
    height: option.ratio.height,
    aspectLabel: option.ratio.aspectLabel,
    quote,
    speakerName,
    speakerTitle,
    contextLine,
    headshot,
    brand,
  };
}

export function PreviewGrid({
  outputs,
  selectedOutputIds,
  activeOutputId,
  content,
  onActiveOutputChange,
  onPreviewStateChange,
  templateId = "quote-card",
}: {
  outputs: MvpOutputFormat[];
  selectedOutputIds: string[];
  activeOutputId: string;
  content: PreviewContent;
  onActiveOutputChange: (outputId: string) => void;
  onPreviewStateChange?: (state: {
    currentPreviewSignature: string;
    allConnectedPreviewsReady: boolean;
  }) => void;
  templateId?: string;
}) {
  const [modeckPreviews, setModeckPreviews] = useState<Record<string, ModeckPreviewSnapshot>>({});
  const modeckContent = useMemo(
    () => ({
      quote: content.quote ?? "",
      speakerName: content.speakerName ?? "",
      speakerTitle: content.speakerTitle ?? "",
      contextLine: content.contextLine ?? "",
      headshot: content.headshot ?? "",
      brand: String(normalizeQuoteCardBrandValue(content.brand ?? "2")),
    }),
    [content.quote, content.speakerName, content.speakerTitle, content.contextLine, content.headshot, content.brand],
  );
  const [debouncedContent, setDebouncedContent] = useState(modeckContent);
  const previewInputPending = debouncedContent !== modeckContent;
  const previewCycleRef = useRef(0);
  const previewOptions = useMemo(
    () => outputs.filter((output) => selectedOutputIds.includes(output.id)).map(outputToPreviewOption),
    [outputs, selectedOutputIds],
  );
  const activeOutputIndex = previewOptions.findIndex((option) => option.output.id === activeOutputId);
  const safeActiveIndex = activeOutputIndex >= 0 ? activeOutputIndex : 0;
  const activeOption = previewOptions[safeActiveIndex];
  const activeRatio = activeOption?.ratio;
  const hasMultipleRatios = previewOptions.length > 1;
  const canUseModeckPreview = activeOption ? connectedPreviewOutputIds.has(activeOption.output.id) : false;
  const previewRequests = useMemo(
    () =>
      previewOptions
        .map((option, index) => buildPreviewRequest(option, index, debouncedContent, templateId))
        .filter((request): request is ModeckPreviewRequest => Boolean(request)),
    [previewOptions, debouncedContent, templateId],
  );
  const activePreviewRequest = activeOption
    ? previewRequests.find((request) => request.outputId === activeOption.output.id)
    : undefined;
  const currentPreviewSignature = useMemo(
    () => JSON.stringify(previewRequests.map((request) => request.previewCacheKey).sort()),
    [previewRequests],
  );
  const requestSignature = activePreviewRequest?.previewCacheKey ?? "";
  const cachedModeckPreview = requestSignature
    ? modeckPreviews[requestSignature] ?? previewCache.get(requestSignature)
    : undefined;
  const allConnectedPreviewsReady = !previewInputPending && previewRequests.every((previewRequest) => {
    const preview = modeckPreviews[previewRequest.previewCacheKey] ?? previewCache.get(previewRequest.previewCacheKey);

    return preview?.state === "loaded" && Boolean(preview.imageSrc);
  });
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
        message: "Live MoDeck preview is not connected for this output.",
        durationMs: null,
        imageSize: null,
      };
    }

    if (previewInputPending) {
      return {
        signature: requestSignature,
        state: "loading",
        imageSrc: null,
        message: "Rendering",
        durationMs: null,
        imageSize: null,
      };
    }

    if (cachedModeckPreview) {
      return cachedModeckPreview;
    }

    return {
      signature: requestSignature,
      state: "loading",
      imageSrc: null,
      message: "Rendering",
      durationMs: null,
      imageSize: null,
    };
  }, [activeRatio, cachedModeckPreview, canUseModeckPreview, previewInputPending, requestSignature]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedContent(modeckContent);
    }, PREVIEW_REQUEST_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [modeckContent]);

  useEffect(() => {
    onPreviewStateChange?.({
      currentPreviewSignature,
      allConnectedPreviewsReady,
    });
  }, [allConnectedPreviewsReady, currentPreviewSignature, onPreviewStateChange]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !activeOption) {
      return;
    }

    console.info("[modeck-preview-active]", {
      outputId: activeOption.output.id,
      activePreviewIndex: safeActiveIndex,
      status: activeModeckPreview.state,
      previewUrlReturned: Boolean(activeModeckPreview.imageSrc),
      previewUrl: activeModeckPreview.imageSrc?.slice(0, 80) ?? null,
      error: activeModeckPreview.state === "error" ? activeModeckPreview.message : null,
    });
  }, [activeModeckPreview, activeOption, safeActiveIndex]);

  useEffect(() => {
    if (previewRequests.length === 0) {
      return;
    }

    let mounted = true;

    const cycleNumber = previewCycleRef.current + 1;
    previewCycleRef.current = cycleNumber;
    const cycleHash = hashPreviewKey(currentPreviewSignature);
    const stats = {
      fired: 0,
      skippedCompleted: 0,
      skippedPending: 0,
      skippedExistingState: 0,
    };

    previewRequests.forEach((previewRequest) => {
      const cachedPreview = previewCache.get(previewRequest.previewCacheKey);

      if (cachedPreview?.state === "loaded") {
        stats.skippedCompleted += 1;
        logPreviewRequestDecision({
          previewRequest,
          cycleHash,
          reason: "already-completed",
          fired: false,
        });
        logPreviewCache({
          previewRequest,
          cache: "hit",
          inFlight: "miss",
          apiCalled: false,
          status: cachedPreview.state,
        });
        setModeckPreviews((current) => ({
          ...current,
          [previewRequest.previewCacheKey]: current[previewRequest.previewCacheKey] ?? cachedPreview,
        }));
        return;
      }

      const inFlightPreview = previewInFlight.get(previewRequest.previewCacheKey);

      if (inFlightPreview) {
        stats.skippedPending += 1;
        logPreviewRequestDecision({
          previewRequest,
          cycleHash,
          reason: "already-pending",
          fired: false,
        });
        logPreviewCache({
          previewRequest,
          cache: "miss",
          inFlight: "hit",
          apiCalled: false,
          status: "loading",
        });
        setModeckPreviews((current) => ({
          ...current,
          [previewRequest.previewCacheKey]:
            current[previewRequest.previewCacheKey] ?? createLoadingPreview(previewRequest.previewCacheKey),
        }));
        inFlightPreview.then((snapshot) => {
          if (mounted) {
            setModeckPreviews((current) => ({ ...current, [snapshot.signature]: snapshot }));
          }
        });
        return;
      }

      stats.fired += 1;
      logPreviewRequestDecision({
        previewRequest,
        cycleHash,
        reason: "new-or-changed-payload",
        fired: true,
      });
      logPreviewCache({
        previewRequest,
        cache: "miss",
        inFlight: "miss",
        apiCalled: true,
        status: "loading",
      });
      setModeckPreviews((current) => ({
        ...current,
        [previewRequest.previewCacheKey]:
          current[previewRequest.previewCacheKey] ?? createLoadingPreview(previewRequest.previewCacheKey),
      }));

      const previewPromise = fetchModeckPreview(previewRequest).then((snapshot) => {
        previewCache.set(previewRequest.previewCacheKey, snapshot);
        previewInFlight.delete(previewRequest.previewCacheKey);
        return snapshot;
      });
      previewInFlight.set(previewRequest.previewCacheKey, previewPromise);
      previewPromise.then((snapshot) => {
        if (mounted) {
          setModeckPreviews((current) => ({ ...current, [snapshot.signature]: snapshot }));
        }
      });
    });

    logPreviewCycle({
      cycleNumber,
      cycleHash,
      selectedOutputCount: previewRequests.length,
      stats,
    });

    return () => {
      mounted = false;
    };
  }, [currentPreviewSignature, previewRequests]);

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
              <span className="text-sm text-slate-600">{getPreviewOutputLabel(activeOption.output)}</span>
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
              message={activeModeckPreview.message}
              imageSize={activeModeckPreview.imageSize}
              durationMs={activeModeckPreview.durationMs}
              onImageLoad={(width, height) =>
                setModeckPreviews((current) => {
                  const preview = current[requestSignature];

                  return preview
                    ? {
                        ...current,
                        [requestSignature]: { ...preview, imageSize: { width, height } },
                      }
                    : current;
                })
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
  message,
  imageSize,
  durationMs,
  onImageLoad,
}: {
  state: ModeckPreviewState;
  imageSrc: string | null;
  message: string;
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
            {getPreviewPanelTitle(state)}
          </div>
          {message ? <p className="max-w-md text-sm leading-6 text-slate-700">{message}</p> : null}
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

function createLoadingPreview(previewCacheKey: string): ModeckPreviewSnapshot {
  return {
    signature: previewCacheKey,
    state: "loading",
    imageSrc: null,
    message: "Rendering",
    durationMs: null,
    imageSize: null,
  };
}

async function fetchModeckPreview(previewRequest: ModeckPreviewRequest): Promise<ModeckPreviewSnapshot> {
  try {
    const response = await fetch("/api/modeck/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outputId: previewRequest.outputId,
        size: `${previewRequest.width}x${previewRequest.height}`,
        frame: 0,
        quote: previewRequest.quote,
        speakerName: previewRequest.speakerName,
        speakerTitle: previewRequest.speakerTitle,
        contextLine: previewRequest.contextLine,
        headshotFilename: getModeckHeadshotFilename(previewRequest.headshot),
        brand: previewRequest.brand,
      }),
    });
    const data = (await response.json()) as ModeckPreviewResult;

    if (!data.ok || !data.imageBase64) {
      const message =
        data.error ??
        data.responseSummary?.info ??
        "Preview image was not returned.";

      return {
        signature: previewRequest.previewCacheKey,
        state: "error",
        imageSrc: null,
        message,
        durationMs: data.durationMs ?? null,
        imageSize: null,
      };
    }

    const imageSrc = toImageSrc(data.imageBase64);
    storeApprovedPreviewThumbnail(previewRequest, imageSrc);

    return {
      signature: previewRequest.previewCacheKey,
      state: "loaded",
      imageSrc,
      message: data.responseSummary?.info ?? "Preview ready.",
      durationMs: data.durationMs ?? null,
      imageSize: null,
    };
  } catch (error) {
    return {
      signature: previewRequest.previewCacheKey,
      state: "error",
      imageSrc: null,
      message: error instanceof Error ? error.message : "Preview failed.",
      durationMs: null,
      imageSize: null,
    };
  }
}

function logPreviewCache({
  previewRequest,
  cache,
  inFlight,
  apiCalled,
  status,
}: {
  previewRequest: ModeckPreviewRequest;
  cache: "hit" | "miss";
  inFlight: "hit" | "miss";
  apiCalled: boolean;
  status: ModeckPreviewState | "loading";
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-preview-cache]", {
    previewCacheKey: previewRequest.previewCacheKey,
    cache,
    inFlight,
    outputId: previewRequest.outputId,
    activePreviewIndex: previewRequest.activePreviewIndex,
    apiCalled,
    status,
  });
}

function logPreviewRequestDecision({
  previewRequest,
  cycleHash,
  reason,
  fired,
}: {
  previewRequest: ModeckPreviewRequest;
  cycleHash: string;
  reason: string;
  fired: boolean;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-preview-request-decision]", {
    cycleHash,
    requestHash: hashPreviewKey(previewRequest.previewCacheKey),
    outputId: previewRequest.outputId,
    reason,
    fired,
  });
}

function logPreviewCycle({
  cycleNumber,
  cycleHash,
  selectedOutputCount,
  stats,
}: {
  cycleNumber: number;
  cycleHash: string;
  selectedOutputCount: number;
  stats: {
    fired: number;
    skippedCompleted: number;
    skippedPending: number;
    skippedExistingState: number;
  };
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-preview-cycle]", {
    cycleNumber,
    cycleHash,
    selectedOutputCount,
    totalPreviewRequestsFired: stats.fired,
    skippedCompleted: stats.skippedCompleted,
    skippedPending: stats.skippedPending,
    skippedExistingState: stats.skippedExistingState,
  });
}

function hashPreviewKey(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function storeApprovedPreviewThumbnail(previewRequest: ModeckPreviewRequest, imageSrc: string) {
  try {
    window.sessionStorage.setItem(
      previewRequest.storageKey,
      JSON.stringify({
        outputId: previewRequest.outputId,
        imageSrc,
        width: previewRequest.width,
        height: previewRequest.height,
        aspectLabel: previewRequest.aspectLabel,
        generatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Preview thumbnails are a UI enhancement; rendering and downloads should continue without storage.
  }
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

function getPreviewPanelTitle(state: ModeckPreviewState) {
  if (state === "loading") {
    return "Rendering";
  }

  if (state === "unsupported") {
    return "Local preview";
  }

  if (state === "error") {
    return "Preview unavailable";
  }

  return "Preview ready";
}

function outputToPreviewOption(output: MvpOutputFormat): PreviewOption {
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

function getPreviewOutputLabel(output: MvpOutputFormat) {
  if (output.id === "still-1080x1350") {
    return "1400x1800 \u00b7 4:5 \u00b7 Still";
  }

  return getActiveFormatLabel(output);
}

function getActiveFormatLabel(output: MvpOutputFormat) {
  return `${output.label} · ${output.aspectLabel} · ${output.type === "video" ? "Video" : "Still"}`;
}
