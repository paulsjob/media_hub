import { AppShell } from "@/components/app-shell";
import { AssetPreview, PageHeader, PrimaryActionButton, SectionCard } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function DistributionPage() {
  const view = mediaLab.getFeaturedAssetPackageView();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Majority Democrats / Distribution"
        title="Distribute"
        accent="Everywhere"
        subtitle="Package approved assets for every native channel without slowing the room down."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <SectionCard title="Select Platforms">
          <div className="space-y-3">
            {mediaLab.getDistributionPlatforms().map((platform) => (
              <div key={platform.id} className="grid gap-3 border border-[var(--silver)] bg-white p-4 md:grid-cols-[40px_1fr_150px_220px] md:items-center">
                <input type="checkbox" defaultChecked={platform.selected} className="h-4 w-4 accent-[var(--flame)]" />
                <div>
                  <p className="font-extrabold text-[var(--navy-blue)]">{platform.label}</p>
                  <p className="text-sm font-bold uppercase tracking-wide text-[var(--slate-blue)]">{platform.ratio}</p>
                </div>
                <span className="chip justify-center bg-[var(--powder-blue)] text-[var(--navy-blue)] ring-1 ring-[var(--silver)]">
                  {platform.selected ? "Ready" : "Not selected"}
                </span>
                <input className="h-10 border border-[var(--silver)] px-3 text-sm" defaultValue={platform.selected ? "May 1, 2026 9:00 AM" : ""} placeholder="Select date & time" />
              </div>
            ))}
          </div>
        </SectionCard>

        <aside className="space-y-5">
          <SectionCard title="Asset Summary">
            <AssetPreview compact />
            <h2 className="mt-4 font-extrabold text-[var(--navy-blue)]">{view?.assetPackage.title}</h2>
          </SectionCard>
          <SectionCard title="Publish Summary">
            <div className="space-y-3 text-sm">
              <Summary label="Platforms" value="4 selected" />
              <Summary label="Assets" value="7 files" />
              <Summary label="Captions" value="5 versions" />
              <Summary label="Scheduled" value="May 1, 2026 at 9:00 AM" />
            </div>
            <div className="mt-5">
              <PrimaryActionButton href={`/library/${view?.assetPackage.id ?? "pkg-spanberger-town-hall"}`}>Package Export</PrimaryActionButton>
            </div>
          </SectionCard>
        </aside>
      </div>
    </AppShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[var(--silver)] pb-2">
      <span className="font-bold uppercase tracking-wide text-[var(--navy-blue)]">{label}</span>
      <span className="font-medium text-[var(--slate-blue)]">{value}</span>
    </div>
  );
}
