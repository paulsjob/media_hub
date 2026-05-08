import { AppShell } from "@/components/app-shell";
import { Chip, PageHeader, SectionCard, StatusBadge } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Majority Democrats / Guardrails"
        title="Brand & Safety"
        accent="Guardrails"
        subtitle="Keep every asset direct, approved, and ready to move."
      />
      <SectionCard title="Publishing Rules">
        <div className="mb-5 flex flex-wrap gap-3">
          {mediaLab.getSettingsTabs().map((tab, index) => (
            <Chip key={tab} selected={index === 0}>
              {tab}
            </Chip>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {mediaLab.getGuardrailCards().map((item) => (
            <div key={item} className="border border-[var(--silver)] bg-white p-5">
              <StatusBadge status="approved" />
              <h2 className="brand-heading mt-3 text-2xl text-[var(--navy-blue)]">{item}</h2>
              <p className="mt-2 text-sm text-[var(--black)]">Active rules apply to generated packages.</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
