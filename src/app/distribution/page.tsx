import { AppShell } from "@/components/app-shell";
import { AssetPreview, PageHeader, PrimaryActionButton, SectionCard } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function DistributionPage() {
  const view = mediaLab.getFeaturedAssetPackageView();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Library / Prepare for Distribution"
        title="Prepare for"
        accent="Distribution"
        subtitle="Plan approved assets for publishing without auto-posting."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <SectionCard title="Select Platforms">
          <div className="space-y-3">
            {mediaLab.getDistributionPlatforms().map((platform) => (
              <div key={platform.id} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[40px_1fr_150px_220px] md:items-center">
                <input type="checkbox" defaultChecked={platform.selected} className="h-4 w-4 accent-blue-600" />
                <div>
                  <p className="font-semibold text-[#06153a]">{platform.label}</p>
                  <p className="text-sm text-slate-500">{platform.ratio}</p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-center text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  {platform.selected ? "Ready" : "Not selected"}
                </span>
                <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" defaultValue={platform.selected ? "May 1, 2026 9:00 AM" : ""} placeholder="Select date & time" />
              </div>
            ))}
          </div>
        </SectionCard>

        <aside className="space-y-5">
          <SectionCard title="Asset Summary">
            <AssetPreview compact />
            <h2 className="mt-4 font-semibold text-[#06153a]">{view?.assetPackage.title}</h2>
          </SectionCard>
          <SectionCard title="Publish Summary">
            <div className="space-y-3 text-sm">
              <Summary label="Platforms" value="4 selected" />
              <Summary label="Assets" value="7 files" />
              <Summary label="Captions" value="5 versions" />
              <Summary label="Scheduled" value="May 1, 2026 at 9:00 AM" />
            </div>
            <div className="mt-5">
              <PrimaryActionButton href={`/library/${view?.assetPackage.id ?? "pkg-spanberger-town-hall"}`}>Schedule & Export</PrimaryActionButton>
            </div>
          </SectionCard>
        </aside>
      </div>
    </AppShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-200 pb-2">
      <span className="font-medium text-[#06153a]">{label}</span>
      <span className="text-slate-600">{value}</span>
    </div>
  );
}
