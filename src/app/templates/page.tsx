import { AppShell } from "@/components/app-shell";
import {
  Chip,
  PageHeader,
  PrimaryActionButton,
  SecondaryButton,
  SectionCard,
  TemplateListItem,
} from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function TemplatesPage() {
  const templates = mediaLab.getTemplates();
  const selectedTemplate = mediaLab.getTemplate("template-quote-card-v2") ?? templates[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Media Operations / Template Library"
        title="Template"
        accent="Library"
        subtitle="Start with the right format. Generate faster with proven structures."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <SectionCard title="Available Templates">
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="flex h-10 min-w-72 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-500">
                <span className="font-semibold text-[#06153a]">Search</span>
                <span>Search templates</span>
              </div>
              {mediaLab.getTemplateFilters().map((tab) => (
                <Chip key={tab} selected={tab === "All"}>
                  {tab}
                </Chip>
              ))}
            </div>
            {templates.map((template) => (
              <TemplateListItem key={template.id} template={template} />
            ))}
          </SectionCard>

          <SectionCard title="Recently Used">
            <div className="grid gap-3 md:grid-cols-3">
              {templates.slice(0, 3).map((template) => (
                <div key={template.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-[#06153a]">{template.name}</p>
                  <p className="text-sm text-slate-500">used this week</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Template Details" className="self-start">
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-[#06153a]">
                QT
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#06153a]">{selectedTemplate.name}</h2>
                <p className="text-slate-600">{selectedTemplate.description}</p>
              </div>
            </div>
            <DetailList title="Best For" items={selectedTemplate.best_for} check />
            <DetailList title="Requires" items={selectedTemplate.required_fields} />
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Outputs</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedTemplate.available_outputs.map((output) => (
                  <span
                    key={output}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-[#06153a]"
                  >
                    {output}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Performance Snapshot</p>
              <div className="flex items-center justify-between py-1 text-sm">
                <span>Avg engagement</span>
                <span className="font-semibold text-emerald-700">+48%</span>
              </div>
              <div className="flex items-center justify-between py-1 text-sm">
                <span>Avg build time</span>
                <span className="font-semibold text-[#06153a]">4 min</span>
              </div>
            </div>
            <PrimaryActionButton href="/generate">Use Template</PrimaryActionButton>
            <SecondaryButton href="/templates">View Documentation</SecondaryButton>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function DetailList({ title, items, check = false }: { title: string; items: string[]; check?: boolean }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-[#06153a]">
            <span className={check ? "text-emerald-600" : "text-[#0b63f6]"}>{check ? "OK" : "-"}</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
