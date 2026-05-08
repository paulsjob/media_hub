import { AppShell } from "@/components/app-shell";
import { PageHeader, SectionCard, StatCard } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function PerformancePage() {
  const kpis = mediaLab.getPerformanceKpis();
  const insights = mediaLab.getPerformanceInsights();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Majority Democrats / Performance"
        title="Performance"
        subtitle="Track deep attention. Double-down on formats that move people."
      />
      <div className="mb-5 grid gap-4 md:grid-cols-5">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} />
        ))}
      </div>
      <SectionCard title="Attention Signals">
        <div className="grid gap-4 md:grid-cols-3">
          {insights.map((insight) => (
            <div key={insight} className="border border-[var(--silver)] bg-white p-5 font-bold text-[var(--navy-blue)]">
              <p>{insight}</p>
              <div className="mt-4 flex gap-2">
                <button className="border border-[var(--navy-blue)] bg-[var(--navy-blue)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
                  Double-down
                </button>
                <button className="border border-[var(--flame)] bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-[var(--flame)]">
                  Kill Format
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
