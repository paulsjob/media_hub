import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import {
  PageHeader,
  PrimaryActionButton,
  SectionCard,
} from "@/components/ui";

interface ConnectedTemplate {
  name: string;
  status: "Connected";
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
  status: "Connected",
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
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Primary Connected Template</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#06153a]">{template.name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Turn a quote into reviewed files, captions, and archive details.
          </p>
        </div>
        <StatusPill label={template.status} tone="success" icon="check" />
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <TemplateText title="Best For" value={template.bestFor} />
        <TemplateList title="Required Fields" items={template.requiredFields} />
        <TemplateList title="Available Outputs" items={template.availableOutputs} />
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <PrimaryActionButton href={template.useHref} className="sm:min-w-40">
          <Icon name="package" />
          Use Quote Card
        </PrimaryActionButton>
      </div>
    </article>
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
        <span>1 connected template</span>
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
        <StatusPill label="Planned" tone="neutral" icon="warning" />
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

function TemplateList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="space-y-1.5 text-sm leading-5 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function StatusPill({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: "success" | "info" | "neutral";
  icon?: "check" | "warning";
}) {
  const toneClass = {
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    info: "bg-blue-50 text-blue-800 ring-blue-200",
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ${toneClass}`}>
      {icon ? <Icon name={icon} className="h-3.5 w-3.5" /> : null}
      {label}
    </span>
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
