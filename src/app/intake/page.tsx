import { AppShell } from "@/components/app-shell";
import {
  Chip,
  FieldGroup,
  FormField,
  OutputChip,
  PageHeader,
  PrimaryActionButton,
  SecondaryButton,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function IntakePage() {
  const story = mediaLab.getFeaturedStory();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Majority Democrats / Signal Intake"
        title="Capture"
        accent="The Signal"
        subtitle="Capture the moment once. Turn it into assets that compete everywhere."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <SectionCard title="Story Basics">
            <FieldGroup>
              <FormField label="Story Title" value={story.title} />
              <div />
              <FormField label="What happened?" value={story.what_happened} textarea />
              <FormField label="Why it matters" value={story.why_it_matters} textarea />
            </FieldGroup>
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Urgency</p>
              <div className="flex gap-3">
                {["High", "Med", "Low"].map((urgency) => (
                  <Chip key={urgency} selected={urgency.toLowerCase() === story.urgency}>
                    {urgency}
                  </Chip>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Source & Receipts">
            <FieldGroup>
              <FormField label="Primary Source / Type" value={story.source_type} />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Supporting Links / Receipts
                </p>
                <div className="space-y-2">
                  {[story.source_type, "Press release", "Source transcript"].map((receipt) => (
                    <div key={receipt} className="border border-[var(--silver)] bg-white px-3 py-2 text-sm text-[var(--navy-blue)]">
                      {receipt}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Source Confidence</p>
                <StatusBadge status={story.source_confidence} />
              </div>
            </FieldGroup>
          </SectionCard>

          <SectionCard title="Messaging & Output">
            <FieldGroup>
              <FormField label="Primary Messenger" value={story.primary_messenger} />
              <FormField label="Audience / Target" value={story.audience} />
            </FieldGroup>
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended Formats</p>
              <div className="flex flex-wrap gap-3">
                {mediaLab.getRecommendedFormats().map((format, index) => (
                  <OutputChip key={format} label={format} selected={index < 2} />
                ))}
              </div>
            </div>
            <div className="mt-5 max-w-md">
              <FormField label="Approval Route" value="Editorial + Comms" />
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Package Preview">
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended Package</p>
                <StatusLine label="Quote Card V.2" />
                <StatusLine label="Clip Pack" />
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ready For</p>
                <StatusLine label="Source linked" />
                <StatusLine label="Messenger identified" />
                <StatusLine label="Formats selected" />
              </div>
              <div className="border border-[var(--silver)]">
                {[
                  ["Story Title", story.title],
                  ["Messenger", story.primary_messenger],
                  ["Urgency", story.urgency],
                  ["Formats", "Quote Card, Clip Pack"],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[110px_1fr] border-b border-slate-100 px-3 py-3 text-sm last:border-0">
                    <span className="font-medium text-[var(--slate-blue)]">{label}</span>
                    <span className="font-semibold text-[var(--navy-blue)]">{value}</span>
                  </div>
                ))}
              </div>
              <PrimaryActionButton href="/templates">Select Template</PrimaryActionButton>
              <SecondaryButton href="/">Hold Draft</SecondaryButton>
            </div>
          </SectionCard>
        </aside>
      </div>
    </AppShell>
  );
}

function StatusLine({ label }: { label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--navy-blue)]">
      <span className="grid h-5 w-5 place-items-center border border-[var(--navy-blue)] bg-[var(--powder-blue)] text-[10px] font-semibold text-[var(--navy-blue)]">
        OK
      </span>
      {label}
    </div>
  );
}
