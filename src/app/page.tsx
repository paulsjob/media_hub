import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import {
  PageHeader,
  PrimaryActionButton,
  SecondaryButton,
  SectionCard,
} from "@/components/ui";

const workingFlow = [
  "Choose a template",
  "Fill fields",
  "Preview",
  "Package and download",
];

export default function HomePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Media Operations Command Center"
        title="Media"
        accent="Lab"
        subtitle="Create campaign-ready media packages."
        actions={
          <>
            <PrimaryActionButton href="/templates">
              <Icon name="template" />
              Browse Templates
            </PrimaryActionButton>
            <SecondaryButton href="/generate">
              <Icon name="package" />
              Start Quote Card
            </SecondaryButton>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Working Flow" action={<Icon name="dashboard" className="h-5 w-5 text-blue-700" />}>
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
          <SectionCard title="Demo Status" action={<Icon name="package" className="h-5 w-5 text-blue-700" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <DashboardMetric label="Connected templates" value="1" />
              <DashboardMetric label="Planned templates" value="5" />
              <DashboardValue label="Production workflow" value="Quote Card" />
              <DashboardValue
                label="Package tools"
                value="Review, copy, download"
              />
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
