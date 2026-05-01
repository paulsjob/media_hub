import { AppShell } from "@/components/app-shell";
import { Chip, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Media Operations / Guardrails"
        title="Brand & Safety"
        accent="Guardrails"
        subtitle="Make compliance fast, visible, and calm."
      />
      <SectionCard title="All Systems Go">
        <div className="mb-5 flex flex-wrap gap-3">
          {mediaLab.getSettingsTabs().map((tab, index) => (
            <Chip key={tab} selected={index === 0}>
              {tab}
            </Chip>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {mediaLab.getGuardrailCards().map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white p-5">
              <StatusBadge status="approved" />
              <h2 className="mt-3 font-semibold text-[#06153a]">{item}</h2>
              <p className="mt-2 text-sm text-slate-600">Active guardrails are applied to generated packages.</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
