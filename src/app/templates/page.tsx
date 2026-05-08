import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import {
  PageHeader,
  PrimaryActionButton,
  SectionCard,
} from "@/components/ui";

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

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <ConnectedTemplateCard template={quoteCardTemplate} />
        <FactorySummary />
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
          <StatusDot status="ready" label="Available" />
          <PrimaryActionButton href={template.useHref} className="sm:min-w-36">
            <Icon name="package" />
            Use Template
          </PrimaryActionButton>
        </div>
      </div>

      <details className="mt-4 border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">Details</summary>
        <div className="mt-4 grid gap-5 lg:grid-cols-[0.9fr_1fr]">
          <TemplateSamplePreview />
          <div className="grid content-start gap-3">
            <TemplateText title="Best for" value="Official statements, quotes, rapid response" />
            <TemplateText title="Fields" value="Quote, speaker, title, context" />
            <TemplateText title="Outputs" value="Static, motion, package, copy" />
            <TemplateText title="Note" value="Brand and media controls are being connected in the production workflow." />
          </div>
        </div>
      </details>
    </article>
  );
}

function TemplateSamplePreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#06153a] p-4 text-white shadow-sm">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70">
        <span>Official Statement</span>
        <span>16:9 sample</span>
      </div>
      <div className="grid min-h-44 grid-cols-[1fr_auto] gap-4">
        <div className="flex flex-col justify-end">
          <p className="text-2xl font-semibold leading-tight">
            A short statement appears here.
          </p>
          <div className="mt-4">
            <p className="font-semibold">Speaker Name</p>
            <p className="text-sm text-white/70">Short supporting title</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-white/55">Organization Name</p>
          </div>
        </div>
        <div className="grid h-24 w-24 place-items-center self-end rounded-full border border-white/20 bg-white/10">
          <span className="text-xs font-semibold uppercase text-white/55">Avatar</span>
        </div>
      </div>
    </div>
  );
}

function FactorySummary() {
  return (
    <aside className="rounded-lg border border-blue-200 bg-blue-50 p-5 text-blue-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Template Factory</p>
      <h2 className="mt-1 text-xl font-semibold text-[#06153a]">Repeatable media packages</h2>
      <p className="mt-3 text-sm leading-6">
        Pick a template, preview the work, then leave with files and copy.
      </p>
      <div className="mt-4 grid gap-2 text-sm font-semibold">
        <span>1 available template</span>
        <span>5 planned formats</span>
        <span>Package delivery workflow live</span>
      </div>
    </aside>
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
