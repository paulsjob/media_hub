"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import {
  CollapsibleSection,
  PageHeader,
  SectionCard,
} from "@/components/ui";
import Link from "next/link";

interface ConnectedTemplate {
  name: string;
  requiredFields: string[];
  availableOutputs: string[];
  bestFor: string;
  useHref: string;
}

interface PlannedTemplate {
  name: string;
  bestFor: string;
}

const quoteCardTemplate: ConnectedTemplate = {
  name: "Quote Card",
  bestFor: "Official statements, member quotes, rapid response",
  requiredFields: ["Quote", "Speaker", "Speaker Title", "Context Line"],
  availableOutputs: [
    "Static image",
    "Motion render",
    "Package download",
    "Platform copy",
    "Archive details",
  ],
  useHref: "/generate",
};

const plannedTemplates: PlannedTemplate[] = [
  {
    name: "Stat Card",
    bestFor: "Single-number proof points and sourced metrics.",
  },
  {
    name: "Contrast Card",
    bestFor: "Side-by-side comparisons and clear before/after framing.",
  },
  {
    name: "Vote Record Card",
    bestFor: "Plain-English summaries of votes and legislative records.",
  },
  {
    name: "Explainer Card",
    bestFor: "Short context explainers and what-it-means moments.",
  },
  {
    name: "Clip Packaging Pack",
    bestFor: "Short video clips, captions, thumbnails, and platform cutdowns.",
  },
];

export default function TemplatesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Media Operations / Template Library"
        title="Template"
        accent="Library"
        subtitle="Start with Quote Card. More templates are planned."
      />

      <div className="mb-5">
        <ConnectedTemplateCard template={quoteCardTemplate} />
      </div>

      <SectionCard title="Planned Templates" action={<Icon name="template" className="h-5 w-5 text-slate-500" />}>
        <div className="divide-y divide-slate-100">
          {plannedTemplates.map((template) => (
            <PlannedTemplateRow key={template.name} template={template} />
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

function ConnectedTemplateCard({ template }: { template: ConnectedTemplate }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Primary Template</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#06153a]">{template.name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Turn a quote into reviewed files, captions, and archive details.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={template.useHref}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#06153a] px-4 text-sm font-semibold !text-white shadow-sm hover:bg-[#12306a]"
            style={{ color: "#ffffff" }}
          >
            <span className="text-white">Build</span>
          </Link>
          <StatusDot status="ready" label="Available" />
        </div>
      </div>

      <CollapsibleSection title="Details" compact className="mt-4 border-slate-100 bg-transparent shadow-none">
        <div className="mt-4 grid gap-5 lg:grid-cols-[0.9fr_1fr]">
          <TemplateSamplePreview />
          <div className="grid content-start gap-3">
            <TemplateText title="Best for" value="Official statements, quotes, rapid response" />
            <TemplateText title="Fields" value="Quote, speaker, title, context" />
            <TemplateText title="Outputs" value="Static, motion, package, copy" />
            <TemplateText title="Note" value="Brand and media controls are being connected in the production workflow." />
          </div>
        </div>
      </CollapsibleSection>
    </article>
  );
}

const sampleRatios = [
  { label: "16:9", value: "16 / 9" },
  { label: "1:1", value: "1 / 1" },
  { label: "4:5", value: "4 / 5" },
  { label: "9:16", value: "9 / 16" },
];

function TemplateSamplePreview() {
  const [selectedRatio, setSelectedRatio] = useState(sampleRatios[0]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {sampleRatios.map((ratio) => {
          const selected = selectedRatio.label === ratio.label;

          return (
            <button
              key={ratio.label}
              type="button"
              onClick={() => setSelectedRatio(ratio)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                selected
                  ? "border-[#06153a] bg-[#06153a] text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {ratio.label}
            </button>
          );
        })}
      </div>
      <div className="grid place-items-center rounded-lg bg-slate-50 p-4">
        <div
          className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-[#06153a] p-4 text-white shadow-sm"
          style={{ aspectRatio: selectedRatio.value }}
        >
          <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70">
            <span>Official Statement</span>
            <span>{selectedRatio.label}</span>
          </div>
          <div className="grid h-[calc(100%-2rem)] grid-cols-[1fr_auto] gap-4">
            <div className="flex flex-col justify-end">
              <p className="text-xl font-semibold leading-tight md:text-2xl">
                A short statement appears here.
              </p>
              <div className="mt-4">
                <p className="font-semibold">Speaker Name</p>
                <p className="text-sm text-white/70">Short supporting title</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-white/55">Organization Name</p>
              </div>
            </div>
            <div className="grid h-16 w-16 place-items-center self-end rounded-full border border-white/20 bg-white/10 sm:h-20 sm:w-20">
              <span className="text-[10px] font-semibold uppercase text-white/55">Avatar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlannedTemplateRow({ template }: { template: PlannedTemplate }) {
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-semibold text-[#06153a]">{template.name}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{template.bestFor}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusDot status="planned" label="Planned" />
        <DisabledAction>Coming soon</DisabledAction>
      </div>
    </div>
  );
}

function TemplateText({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function StatusDot({
  status,
  label,
}: {
  status: "ready" | "planned" | "unavailable";
  label: string;
}) {
  const dotClass = {
    ready: "bg-emerald-500",
    planned: "bg-amber-500",
    unavailable: "bg-red-500",
  }[status];

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`}
      aria-label={label}
      title={label}
    />
  );
}

function DisabledAction({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      aria-disabled="true"
      className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400 sm:min-w-36"
    >
      <Icon name="warning" />
      {children}
    </span>
  );
}
