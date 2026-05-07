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
        eyebrow="Media Operations / Library Search"
        title="Asset"
        accent="Library"
        subtitle="Search, filter, and reuse approved content packages."
      />
      <SectionCard title="Global Asset Search">
        <form className="mb-5 grid gap-3 md:grid-cols-[1fr_repeat(3,150px)_120px]">
          <input
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            name="q"
            placeholder="Search assets, speakers, topics..."
            defaultValue={q}
          />
          {mediaLab.getLibraryFilters().map((filter) => (
            <ButtonLike key={filter} variant="secondary">
              {filter}
            </ButtonLike>
          ))}
          <ButtonLike type="submit" variant="primary">
            Search
          </ButtonLike>
        </form>
        <div className="space-y-3">
          {packageViews.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <h2 className="font-semibold text-[#06153a]">No assets found</h2>
              <p className="mt-2 text-sm text-slate-600">Try a speaker, template, topic, or package status.</p>
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
