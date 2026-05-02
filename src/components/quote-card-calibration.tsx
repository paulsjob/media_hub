"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { RatioPreview } from "@/components/ratio-preview";
import {
  quoteCardTemplateSpec,
  type QuoteCardBoxSpec,
  type QuoteCardRatio,
} from "@/lib/quote-card-layouts";
import type { PreviewContent, PreviewRatio } from "@/lib/preview-state";

const ratios: Record<QuoteCardRatio, PreviewRatio> = {
  "16:9": {
    key: "16:9",
    aspectLabel: "16:9",
    width: 1920,
    height: 1080,
    outputIds: ["still-1920x1080", "video-1920x1080"],
  },
  "1:1": {
    key: "1:1",
    aspectLabel: "1:1",
    width: 1080,
    height: 1080,
    outputIds: ["still-1080x1080", "video-1080x1080"],
  },
  "4:5": {
    key: "4:5",
    aspectLabel: "4:5",
    width: 1080,
    height: 1350,
    outputIds: ["still-1080x1350", "video-1080x1350"],
  },
  "9:16": {
    key: "9:16",
    aspectLabel: "9:16",
    width: 1080,
    height: 1920,
    outputIds: ["still-1080x1920", "video-1080x1920"],
  },
};

const defaultContent: PreviewContent = {
  quote: "We cannot defend democracy by standing still.",
  speakerName: "Abigail Spanberger",
  speakerTitle: "U.S. Representative",
  contextLine: "April 2028 Town Hall in Michigan",
  headshot: "AS",
};

export function QuoteCardCalibration() {
  const [activeRatio, setActiveRatio] = useState<QuoteCardRatio>("16:9");
  const [overlay, setOverlay] = useState(false);
  const [content, setContent] = useState<PreviewContent>(defaultContent);
  const ratio = ratios[activeRatio];
  const spec = quoteCardTemplateSpec[activeRatio];
  const specRows = useMemo<Array<[string, QuoteCardBoxSpec]>>(
    () => [
      ["Label", spec.label],
      ["Quote", spec.quote],
      ["Headshot", spec.headshot],
      ["Speaker", spec.speakerName],
      ["Context", spec.context],
      ["Orange rule", spec.orangeRule],
      ["Footer", spec.footer],
    ],
    [spec],
  );

  function updateContent(key: keyof PreviewContent, value: string) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 text-[#06153a]">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 border-b border-slate-300 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Dev Calibration</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Quote Card Calibration</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Tune the shared browser preview spec against the 16:9 reference without changing the product flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(ratios) as QuoteCardRatio[]).map((ratioKey) => (
              <button
                key={ratioKey}
                type="button"
                onClick={() => setActiveRatio(ratioKey)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  activeRatio === ratioKey
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-slate-300 bg-white text-[#06153a]"
                }`}
              >
                {ratioKey}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOverlay((current) => !current)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                overlay ? "border-orange-300 bg-orange-50 text-orange-800" : "border-slate-300 bg-white"
              }`}
            >
              Overlay {overlay ? "On" : "Off"}
            </button>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {overlay ? (
              <CalibrationPanel title="Overlay Comparison">
                <ArtboardShell ratio={ratio}>
                  <Image
                    src="/assets/quote-card-v2-16x9.png"
                    alt="Quote Card 16:9 reference"
                    fill
                    sizes="820px"
                    className={`object-contain ${
                      activeRatio === "16:9" ? "opacity-60" : "opacity-20"
                    }`}
                  />
                  <div className="absolute inset-0 opacity-75 mix-blend-multiply">
                    <RatioPreview ratio={ratio} content={content} />
                  </div>
                </ArtboardShell>
              </CalibrationPanel>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <CalibrationPanel title="Reference">
                  <ArtboardShell ratio={ratios["16:9"]}>
                    <Image
                      src="/assets/quote-card-v2-16x9.png"
                      alt="Quote Card 16:9 reference"
                      fill
                      sizes="820px"
                      className="object-contain"
                    />
                  </ArtboardShell>
                </CalibrationPanel>

                <CalibrationPanel title={`Browser Preview ${activeRatio}`}>
                  <ArtboardShell ratio={ratio}>
                    <RatioPreview ratio={ratio} content={content} />
                  </ArtboardShell>
                </CalibrationPanel>
              </div>
            )}

            <CalibrationPanel title="Template Spec">
              <div className="grid gap-2 text-xs md:grid-cols-2">
                {specRows.map(([label, box]) => (
                  <div key={label as string} className="rounded border border-slate-200 bg-white p-3">
                    <p className="font-semibold text-[#06153a]">{label as string}</p>
                    <p className="mt-1 font-mono text-slate-600">
                      x {box.leftPct}% / y {box.topPct}% / w {box.widthPct}%
                      {"heightPct" in box && box.heightPct ? ` / h ${box.heightPct}%` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </CalibrationPanel>
          </div>

          <aside className="space-y-4">
            <CalibrationPanel title="Test Content">
              <div className="space-y-4">
                <CalibrationField
                  label="Quote"
                  value={content.quote}
                  textarea
                  onChange={(value) => updateContent("quote", value)}
                />
                <CalibrationField
                  label="Speaker Name"
                  value={content.speakerName}
                  onChange={(value) => updateContent("speakerName", value)}
                />
                <CalibrationField
                  label="Speaker Title"
                  value={content.speakerTitle}
                  onChange={(value) => updateContent("speakerTitle", value)}
                />
                <CalibrationField
                  label="Context Line"
                  value={content.contextLine}
                  onChange={(value) => updateContent("contextLine", value)}
                />
                <CalibrationField
                  label="Headshot"
                  value={content.headshot}
                  onChange={(value) => updateContent("headshot", value)}
                />
                <button
                  type="button"
                  onClick={() => setContent(defaultContent)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                >
                  Reset Demo Content
                </button>
              </div>
            </CalibrationPanel>
          </aside>
        </section>
      </div>
    </main>
  );
}

function CalibrationPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#06153a]">{title}</h2>
      {children}
    </section>
  );
}

function ArtboardShell({
  ratio,
  children,
}: {
  ratio: PreviewRatio;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-md bg-slate-200 p-4">
      <div
        className="relative max-h-[600px] w-full max-w-[820px] overflow-hidden bg-[#dceeff]"
        style={{ aspectRatio: `${ratio.width} / ${ratio.height}` }}
      >
        {children}
      </div>
    </div>
  );
}

function CalibrationField({
  label,
  value,
  textarea = false,
  onChange,
}: {
  label: string;
  value: string;
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
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
        />
      )}
    </label>
  );
}
