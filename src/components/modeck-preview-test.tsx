"use client";

import Link from "next/link";
import { useState } from "react";

interface ModeckPreviewTestProps {
  configured: boolean;
  defaults: {
    deck: string;
    mogrt: string;
    size: string;
    frame: number;
    quote: string;
    speakerName: string;
    speakerTitle: string;
    contextLine: string;
    headshotFilename: string;
  };
}

interface PreviewResult {
  ok: boolean;
  status: string | number;
  durationMs?: number;
  imageBase64?: string | null;
  error?: string;
  requestSummary?: unknown;
  responseSummary?: unknown;
}

const modeckOptionFields = [
  "QUOTE_TEXT",
  "SPEAKER_NAME",
  "SPEAKER_TITLE",
  "CONTEXT_LINE",
  "BRAND",
  "QUOTE_FONT_SIZE",
  "QUOTE_LINE_SPACING",
  "QUOTE_POSITION_X",
  "QUOTE_POSITION_y",
  "HEADSHOT",
];

export function ModeckPreviewTest({ configured, defaults }: ModeckPreviewTestProps) {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [imageState, setImageState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const renderStatus = loading ? "requesting" : result?.ok ? "preview returned" : result?.status ?? "ready";
  const imageSrc = result?.imageBase64 ? toImageSrc(result.imageBase64) : null;

  function updateField(key: keyof typeof defaults, value: string) {
    setForm((current) => ({
      ...current,
      [key]: key === "frame" ? Number(value) : value,
    }));
  }

  async function fetchPreview() {
    setLoading(true);
    setResult(null);
    setImageState("idle");
    setImageSize(null);

    try {
      const response = await fetch("/api/modeck/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as PreviewResult;
      setResult(data);
      setImageState(data.imageBase64 ? "loading" : "idle");
    } catch (error) {
      setResult({
        ok: false,
        status: "client_error",
        error: error instanceof Error ? error.message : "Unknown client error.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 text-[#06153a]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 border-b border-slate-300 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Dev Harness</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">MoDeck Preview Test</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Internal template preview workflow for checking the current Quote Card MoDeck /preview integration.
          </p>
        </header>

        {!configured ? (
          <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            Live MoDeck preview is disabled. Set server-side env vars{" "}
            <code className="font-semibold">MODECK_API_KEY</code> and{" "}
            <code className="font-semibold">MODECK_API_BASE_URL</code> to enable this harness.
          </div>
        ) : null}

        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Field-name warning:</strong> <code>QUOTE_POSITION_y</code> intentionally uses a lowercase{" "}
          <code>y</code>. Keep that spelling unless the current MOGRT is updated to expect a different option name.
        </div>

        <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Preview Request</h2>
            <Field label="Deck" value={form.deck} onChange={(value) => updateField("deck", value)} />
            <Field label="MOGRT" value={form.mogrt} onChange={(value) => updateField("mogrt", value)} />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Size</span>
              <select
                value={form.size}
                onChange={(event) => updateField("size", event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="1920x1080">1920x1080 - 16:9</option>
                <option value="1080x1080">1080x1080 - 1:1</option>
                <option value="1080x1350">1080x1350 - 4:5</option>
                <option value="1080x1920">1080x1920 - 9:16</option>
              </select>
            </label>
            <Field
              label="Frame"
              type="number"
              value={String(form.frame)}
              onChange={(value) => updateField("frame", value)}
            />
            <Field label="Quote" textarea value={form.quote} onChange={(value) => updateField("quote", value)} />
            <Field
              label="Speaker Name"
              value={form.speakerName}
              onChange={(value) => updateField("speakerName", value)}
            />
            <Field
              label="Speaker Title"
              value={form.speakerTitle}
              onChange={(value) => updateField("speakerTitle", value)}
            />
            <Field
              label="Context Line"
              value={form.contextLine}
              onChange={(value) => updateField("contextLine", value)}
            />
            <Field
              label="Headshot Filename"
              value={form.headshotFilename}
              onChange={(value) => updateField("headshotFilename", value)}
            />

            <button
              type="button"
              onClick={fetchPreview}
              disabled={!configured || loading}
              className="w-full rounded-md bg-[#06153a] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Fetching MoDeck Preview..." : "Fetch MoDeck Preview"}
            </button>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">MoDeck Option Fields</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {modeckOptionFields.map((field) => (
                  <code
                    key={field}
                    className={
                      field === "QUOTE_POSITION_y"
                        ? "rounded border border-amber-300 bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-950"
                        : "rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
                    }
                  >
                    {field}
                  </code>
                ))}
              </div>
            </div>
          </form>

          <div className="min-w-0 space-y-5">
            <section className="grid gap-3 sm:grid-cols-3">
              <Metric label="Render Status" value={String(renderStatus)} />
              <Metric
                label="Duration"
                value={typeof result?.durationMs === "number" ? `${result.durationMs}ms` : loading ? "running" : "-"}
              />
              <Metric
                label="Image Base64"
                value={result?.imageBase64 ? `${Math.round(result.imageBase64.length / 1024)} KB` : "none"}
              />
            </section>

            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide">Returned Image Preview</h2>
                <p className="text-sm text-slate-500">
                  Status: <span className="font-semibold">{renderStatus}</span>
                </p>
              </div>

              <div className="w-full min-w-0 overflow-hidden rounded-md border border-slate-300 bg-slate-950">
                <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-3 py-2 text-xs text-slate-200">
                  <span className="font-semibold uppercase tracking-wide">
                    {loading
                      ? "Requesting"
                      : imageState === "loaded"
                        ? "Preview loaded"
                        : imageState === "error"
                          ? "Image decode failed"
                          : result?.ok
                            ? "Preview data received"
                            : "Waiting"}
                  </span>
                  <span className="text-slate-400">
                    {imageSize
                      ? `${imageSize.width}x${imageSize.height}`
                      : result?.imageBase64
                        ? `${Math.round(result.imageBase64.length / 1024)} KB data URL`
                        : "No image yet"}
                  </span>
                </div>
                <div className="grid min-h-[420px] w-full min-w-0 place-items-center bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,-16px_0] p-4">
                {imageSrc ? (
                  <div className="flex w-full min-w-0 flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt="MoDeck preview result"
                      onLoad={(event) => {
                        setImageState("loaded");
                        setImageSize({
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight,
                        });
                      }}
                      onError={() => setImageState("error")}
                      className="block max-h-[620px] max-w-full rounded-sm border border-slate-700 bg-white object-contain shadow-2xl"
                    />
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
                      <a
                        href={imageSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-slate-600 px-3 py-1.5 font-semibold text-white hover:bg-slate-800"
                      >
                        Open image
                      </a>
                      <a
                        href={imageSrc}
                        download="modeck-preview.png"
                        className="rounded-md border border-slate-600 px-3 py-1.5 font-semibold text-white hover:bg-slate-800"
                      >
                        Download preview image
                      </a>
                      <span>
                        {imageState === "loading"
                          ? "Decoding image..."
                          : imageState === "error"
                            ? "The preview returned, but this browser could not decode it."
                            : "Rendered from MoDeck previewData.preview"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="max-w-md text-center text-sm text-slate-300">
                    {result?.error ??
                      "Run a preview request to display the base64 still returned by MoDeck."}
                  </p>
                )}
                </div>
              </div>
              {result?.ok ? (
                <div className="mt-4 flex flex-col gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-emerald-950">
                    Preview looks good? Continue to Generate Package.
                  </p>
                  <Link
                    href="/generate"
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#06153a] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#12306a]"
                  >
                    Generate Package
                  </Link>
                </div>
              ) : null}
            </section>

            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Raw Response Summary</h2>
              <pre className="max-h-80 max-w-full overflow-auto whitespace-pre-wrap break-all rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(
                  result
                    ? {
                        ok: result.ok,
                        status: result.status,
                        durationMs: result.durationMs,
                        requestSummary: result.requestSummary,
                        responseSummary: result.responseSummary,
                        error: result.error,
                      }
                    : { configured, request: form },
                  null,
                  2,
                )}
              </pre>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-[#06153a]">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
  textarea = false,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  textarea?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
        />
      )}
    </label>
  );
}

function toImageSrc(value: string) {
  return value.startsWith("data:image") ? value : `data:image/png;base64,${value}`;
}
