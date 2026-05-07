import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  PrimaryActionButton,
  SecondaryButton,
  SectionCard,
} from "@/components/ui";

interface TemplateLibraryItem {
  name: string;
  bestFor: string[];
  requiredFields: string[];
  availableOutputs: string[];
  status: "Active" | "Planned";
  modeckStatus: "Connected" | "Not connected yet";
  useHref?: string;
  previewHref?: string;
}

const templateLibrary: TemplateLibraryItem[] = [
  {
    name: "Quote Card",
    bestFor: ["Rapid response quotes", "Surrogate statements", "Press moments"],
    requiredFields: ["Primary Quote", "Speaker Name", "Speaker Title", "Context Line"],
    availableOutputs: ["16:9 still", "1:1 still", "4:5 still", "9:16 still", "16:9 video"],
    status: "Active",
    modeckStatus: "Connected",
    useHref: "/generate",
    previewHref: "/dev/modeck-preview-test",
  },
  {
    name: "Stat Card",
    bestFor: ["Single-number proof points", "Polling highlights", "Economic claims"],
    requiredFields: ["Stat", "Stat Label", "Source", "Context Line"],
    availableOutputs: ["16:9 still", "1:1 still", "4:5 still"],
    status: "Planned",
    modeckStatus: "Not connected yet",
  },
  {
    name: "Contrast Card",
    bestFor: ["Side-by-side comparisons", "Record contrasts", "Before and after framing"],
    requiredFields: ["Left Label", "Left Claim", "Right Label", "Right Claim", "Source"],
    availableOutputs: ["16:9 still", "1:1 still", "9:16 still"],
    status: "Planned",
    modeckStatus: "Not connected yet",
  },
  {
    name: "What Happened / Why It Matters",
    bestFor: ["Explainers", "Breaking-news context", "Issue education"],
    requiredFields: ["What Happened", "Why It Matters", "Source", "Callout"],
    availableOutputs: ["16:9 still", "4:5 still", "9:16 still", "Caption pack"],
    status: "Planned",
    modeckStatus: "Not connected yet",
  },
  {
    name: "Localized Card",
    bestFor: ["District-specific messaging", "Local proof points", "Geo-targeted social"],
    requiredFields: ["Location", "Localized Claim", "Messenger", "Source"],
    availableOutputs: ["1:1 still", "4:5 still", "9:16 still"],
    status: "Planned",
    modeckStatus: "Not connected yet",
  },
  {
    name: "Clip Packaging Pack",
    bestFor: ["Short video clips", "Captioned moments", "Platform-ready cutdowns"],
    requiredFields: ["Clip File", "Headline", "Speaker", "Caption", "Source"],
    availableOutputs: ["16:9 video", "1:1 video", "9:16 video", "Thumbnail still"],
    status: "Planned",
    modeckStatus: "Not connected yet",
  },
];

export default function TemplatesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Media Operations / Template Library"
        title="Template"
        accent="Library"
        subtitle="Choose the repeatable content package to build next."
      />

      <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        Template Library is the entry point for repeatable content packages. Quote Card is currently the only
        MoDeck-connected template.
      </div>

      <SectionCard title="Internal Template Inventory">
        <div className="grid gap-4 lg:grid-cols-2">
          {templateLibrary.map((template) => (
            <TemplateLibraryCard key={template.name} template={template} />
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

function TemplateLibraryCard({ template }: { template: TemplateLibraryItem }) {
  const isActive = template.status === "Active";

  return (
    <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template</p>
          <h2 className="mt-1 text-xl font-semibold text-[#06153a]">{template.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={template.status} tone={isActive ? "success" : "neutral"} />
          <StatusPill
            label={template.modeckStatus}
            tone={template.modeckStatus === "Connected" ? "info" : "neutral"}
          />
        </div>
      </div>

      <div className="grid flex-1 gap-4 md:grid-cols-3">
        <TemplateList title="Best For" items={template.bestFor} />
        <TemplateList title="Required Fields" items={template.requiredFields} />
        <TemplateList title="Available Outputs" items={template.availableOutputs} />
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
        {template.useHref ? (
          <PrimaryActionButton href={template.useHref} className="sm:min-w-36">
            Use Template
          </PrimaryActionButton>
        ) : (
          <DisabledAction variant="primary">Use Template</DisabledAction>
        )}
        {template.previewHref ? (
          <SecondaryButton href={template.previewHref} className="sm:min-w-36">
            Preview/Test
          </SecondaryButton>
        ) : (
          <DisabledAction>Preview/Test</DisabledAction>
        )}
      </div>
    </article>
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
}: {
  label: string;
  tone: "success" | "info" | "neutral";
}) {
  const toneClass = {
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    info: "bg-blue-50 text-blue-800 ring-blue-200",
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone];

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${toneClass}`}>{label}</span>;
}

function DisabledAction({
  children,
  variant = "secondary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-slate-300 text-white"
      : "border border-slate-200 bg-slate-50 text-slate-400";

  return (
    <span
      aria-disabled="true"
      className={`inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-md px-4 text-sm font-semibold ${variantClass} sm:min-w-36`}
    >
      {children}
    </span>
  );
}
