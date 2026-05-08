import { AppShell } from "@/components/app-shell";
import { AssetListItem, ButtonLike, PageHeader, SectionCard } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const packageViews = mediaLab.searchAssetPackages(q);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Majority Democrats / Receipt Vault"
        title="Receipt"
        accent="Vault"
        subtitle="Search approved assets, transcripts, tags, topics, and reusable winning frames."
      />
      <SectionCard title="Vault Search">
        <form className="mb-5 grid gap-3 md:grid-cols-[1fr_repeat(3,150px)_120px]">
          <input
            className="h-10 border border-[var(--silver)] bg-white px-3 text-sm"
            name="q"
            placeholder="Search assets, leaders, topics..."
            defaultValue={q}
          />
          {mediaLab.getLibraryFilters().map((filter) => (
            <ButtonLike key={filter} variant="secondary">
              {filter}
            </ButtonLike>
          ))}
          <ButtonLike type="submit" variant="primary">
            Find
          </ButtonLike>
        </form>
        <div className="space-y-3">
          {packageViews.length === 0 ? (
            <div className="border border-[var(--silver)] bg-white p-8 text-center">
              <h2 className="font-extrabold text-[var(--navy-blue)]">No assets found</h2>
              <p className="mt-2 text-sm font-medium text-[var(--slate-blue)]">Try a leader, template, topic, or package status.</p>
            </div>
          ) : null}
          {packageViews.map((view) => (
            <AssetListItem key={view.assetPackage.id} view={view} />
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
