import { AppShell } from "@/components/app-shell";
import { PageHeader, SectionCard, StatCard } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function PerformancePage() {
  const kpis = mediaLab.getPerformanceKpis();
  const insights = mediaLab.getPerformanceInsights();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Media Operations / Performance"
        title="Performance"
        subtitle="Simple mock signal on what worked."
      />
      <div className="mb-5 grid gap-4 md:grid-cols-5">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} />
        ))}
      </div>
      <SectionCard title="Insights">
        <div className="grid gap-4 md:grid-cols-3">
          {insights.map((insight) => (
            <div key={insight} className="rounded-lg border border-slate-200 bg-white p-5 font-medium text-[#06153a]">
              {insight}
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
