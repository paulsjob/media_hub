import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import {
  PageHeader,
  PrimaryActionButton,
  SecondaryButton,
  SectionCard,
} from "@/components/ui";

const workingFlow = [
  "Intake the signal",
  "Render the asset",
  "Approve fast",
  "Package for distribution",
];

export default function HomePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Majority Democrats / War Room"
        title="Signal"
        accent="Drop"
        subtitle="Run the engine. Scale what works. Turn national politics into native media that helps grow the party, win majorities, and deliver results."
        actions={
          <>
            <PrimaryActionButton href="/templates">
              <Icon name="template" />
              Approved Templates
            </PrimaryActionButton>
            <SecondaryButton href="/generate">
              <Icon name="package" />
              Render Quote Card
            </SecondaryButton>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Pipeline Velocity" action={<Icon name="dashboard" className="h-5 w-5 text-[var(--navy-blue)]" />}>
          <div className="grid gap-3">
            {workingFlow.map((step, index) => (
              <div key={step} className="flex items-center gap-3 border border-[var(--silver)] bg-[var(--white)] p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center bg-[var(--powder-blue)] text-sm font-bold text-[var(--navy-blue)]">
                  {index + 1}
                </span>
                <p className="font-bold uppercase tracking-wide text-[var(--navy-blue)]">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-5">
          <SectionCard title="Production Status" action={<Icon name="package" className="h-5 w-5 text-[var(--navy-blue)]" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <DashboardMetric label="Automated templates" value="1" />
              <DashboardMetric label="Next templates" value="5" />
              <DashboardValue label="Active production lane" value="Quote Card" />
              <DashboardValue
                label="Current mandate"
                value="Create once. Distribute everywhere."
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
    <div className="border border-[var(--silver)] bg-[var(--white)] p-4">
      <p className="text-4xl font-extrabold text-[var(--navy-blue)]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--slate-blue)]">{label}</p>
    </div>
  );
}

function DashboardValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--silver)] bg-[var(--white)] p-4 sm:col-span-2">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--slate-blue)]">{label}</p>
      <p className="mt-2 font-bold leading-6 text-[var(--navy-blue)]">{value}</p>
    </div>
  );
}
