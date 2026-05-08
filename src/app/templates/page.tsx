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
        eyebrow="Majority Democrats / Approved Creative"
        title="Template"
        accent="Library"
        subtitle="Select an approved template to generate native assets."
      />

      <div className="mb-5">
        <ConnectedTemplateCard template={quoteCardTemplate} />
      </div>

      <SectionCard title="Semi-Automated Templates" action={<Icon name="template" className="h-5 w-5 text-[var(--slate-blue)]" />}>
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
    <article className="flex h-full flex-col border border-[var(--navy-blue)] bg-[var(--white)] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="chip mb-2 bg-[var(--navy-blue)] text-white">Fully Automated</p>
          <h2 className="mt-1 text-3xl font-extrabold text-[var(--navy-blue)]">{template.name}</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--black)]">
            Turn a quote into approved files, platform copy, and archive details.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={template.useHref}
            className="inline-flex min-h-10 items-center justify-center border border-[var(--flame)] bg-[var(--flame)] px-4 text-sm font-bold uppercase tracking-wide !text-white hover:border-[var(--navy-blue)] hover:bg-[var(--navy-blue)]"
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
            <TemplateText title="Best for" value="Official statements, leader quotes, rapid response" />
            <TemplateText title="Fields" value="Quote, speaker, title, context" />
            <TemplateText title="Outputs" value="Static, motion, package, copy" />
            <TemplateText title="Note" value="Brand and headshot media are wired through the render workflow." />
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
              className={`border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                selected
                  ? "border-[var(--navy-blue)] bg-[var(--navy-blue)] text-white"
                  : "border-[var(--silver)] bg-white text-[var(--slate-blue)] hover:border-[var(--flame)]"
              }`}
            >
              {ratio.label}
            </button>
          );
        })}
      </div>
      <div className="grid place-items-center border border-[var(--silver)] bg-[var(--light-gray)] p-4">
        <div
          className="w-full max-w-md overflow-hidden border border-[var(--navy-blue)] bg-[var(--navy-blue)] p-4 text-white"
          style={{ aspectRatio: selectedRatio.value }}
        >
          <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70">
            <span>Official Statement</span>
            <span>{selectedRatio.label}</span>
          </div>
          <div className="grid h-[calc(100%-2rem)] grid-cols-[1fr_auto] gap-4">
            <div className="flex flex-col justify-end">
              <p className="text-xl font-semibold leading-tight md:text-2xl">
                Results people can feel at home.
              </p>
              <div className="mt-4">
                <p className="font-semibold">Speaker Name</p>
                <p className="text-sm text-white/70">Short supporting title</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-white/55">Organization Name</p>
              </div>
            </div>
            <div className="grid h-16 w-16 place-items-center self-end border border-white/20 bg-white/10 sm:h-20 sm:w-20">
              <span className="text-[10px] font-bold uppercase text-white/55">Headshot</span>
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
        <h3 className="font-extrabold text-[var(--navy-blue)]">{template.name}</h3>
        <p className="mt-1 text-sm font-medium leading-6 text-[var(--black)]">{template.bestFor}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusDot status="planned" label="Planned" />
        <DisabledAction>Queued</DisabledAction>
      </div>
    </div>
  );
}

function TemplateText({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--slate-blue)]">{title}</p>
      <p className="text-sm font-medium leading-6 text-[var(--black)]">{value}</p>
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
    planned: "bg-[var(--slate-blue)]",
    unavailable: "bg-[var(--flame)]",
  }[status];

  return (
    <span
      className={`inline-block h-2.5 w-2.5 ${dotClass}`}
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
      className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 border border-[var(--silver)] bg-[var(--light-gray)] px-4 text-sm font-bold uppercase tracking-wide text-[var(--slate-blue)] sm:min-w-36"
    >
      <Icon name="warning" />
      {children}
    </span>
  );
}
