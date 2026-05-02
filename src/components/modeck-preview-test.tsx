"use client";

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

export function ModeckPreviewTest({ configured, defaults }: ModeckPreviewTestProps) {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);

  function updateField(key: keyof typeof defaults, value: string) {
    setForm((current) => ({
      ...current,
      [key]: key === "frame" ? Number(value) : value,
    }));
  }

  async function fetchPreview() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/modeck/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as PreviewResult;
      setResult(data);
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
            Test whether MoDeck /preview can become the source-of-truth preview layer for Quote Card.
          </p>
        </header>

        {!configured ? (
          <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            Live MoDeck preview is disabled. Set server-side env vars{" "}
            <code className="font-semibold">MODECK_API_KEY</code> and{" "}
            <code className="font-semibold">MODECK_API_BASE_URL</code> to enable this harness.
          </div>
        ) : null}

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
          </form>

          <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide">MoDeck Preview Response</h2>
                <p className="text-sm text-slate-500">
                  Status: <span className="font-semibold">{result?.status ?? (configured ? "ready" : "disabled")}</span>
                  {typeof result?.durationMs === "number" ? ` / ${result.durationMs}ms` : ""}
                </p>
              </div>

              <div className="grid min-h-[360px] place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                {result?.imageBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={toImageSrc(result.imageBase64)}
                    alt="MoDeck preview result"
                    className="max-h-[560px] max-w-full object-contain"
                  />
                ) : (
                  <p className="max-w-md text-center text-sm text-slate-500">
                    {result?.error ??
                      "Run a preview request to display the base64 still returned by MoDeck."}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Raw Summary</h2>
              <pre className="max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(result ?? { configured }, null, 2)}
              </pre>
            </section>
          </div>
        </section>
      </div>
    </main>
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
