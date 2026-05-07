import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  PrimaryActionButton,
  SecondaryButton,
  SectionCard,
  StatusBadge,
} from "@/components/ui";

const workingFlow = [
  "Choose a connected template",
  "Fill the structured content fields",
  "Approve the live preview",
  "Generate the package",
  "Review files, metadata, and platform copy",
  "Download ready files or create another version",
];

const templateStatuses = [
  { name: "Quote Card", status: "Connected" },
  { name: "Stat Card", status: "Planned" },
  { name: "Contrast Card", status: "Planned" },
  { name: "Vote Record Card", status: "Planned" },
  { name: "Explainer Card", status: "Planned" },
  { name: "Clip Packaging Pack", status: "Planned" },
];

export default function HomePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Media Operations Command Center"
        title="Media"
        accent="Lab"
        subtitle="Generate, review, package, and reuse campaign-ready media assets from one repeatable workflow."
        actions={
          <>
            <PrimaryActionButton href="/templates">Browse Templates</PrimaryActionButton>
            <SecondaryButton href="/generate">Start Quote Card</SecondaryButton>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Current MVP Flow">
          <div className="grid gap-3">
            {workingFlow.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-blue-50 text-sm font-semibold text-blue-800">
                  {index + 1}
                </span>
                <p className="font-medium text-[#06153a]">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-5">
          <SectionCard title="Demo Factory Status">
            <div className="grid gap-3 sm:grid-cols-2">
              <DashboardMetric label="Connected templates" value="1" />
              <DashboardMetric label="Planned templates" value="5" />
              <DashboardValue label="Production workflow" value="Quote Card" />
              <DashboardValue
                label="Package tools"
                value="Review, Download, Platform Copy, Archive Metadata"
              />
            </div>
          </SectionCard>

          <SectionCard title="Template Status">
            <div className="space-y-2">
              {templateStatuses.map((template) => (
                <div
                  key={template.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="font-medium text-[#06153a]">{template.name}</span>
                  <StatusBadge status={template.status} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-3xl font-semibold text-[#06153a]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function DashboardValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-medium leading-6 text-[#06153a]">{value}</p>
    </div>
  );
}
