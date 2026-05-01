import { AppShell } from "@/components/app-shell";
import { AssetPreview, PageHeader, PrimaryActionButton, SectionCard, StatusBadge } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function ApprovalsPage() {
  const view = mediaLab.getFeaturedAssetPackageView();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Media Operations / Approval Queue"
        title="Approvals"
        subtitle="Review, comment, and approve content packages."
      />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Needs My Review">
          {view ? (
            <a href={`/library/${view.assetPackage.id}`} className="grid gap-4 rounded-lg border border-orange-100 bg-orange-50/60 p-4 md:grid-cols-[180px_1fr]">
              <AssetPreview compact />
              <div>
                <StatusBadge status="needs_review" />
                <h2 className="mt-3 text-lg font-semibold text-[#06153a]">{view.assetPackage.title}</h2>
                <p className="text-sm text-slate-600">{view.template.name}</p>
              </div>
            </a>
          ) : null}
        </SectionCard>
        <SectionCard title="Review Detail">
          {view ? (
            <div className="space-y-5">
              <AssetPreview />
              <div className="grid gap-4 md:grid-cols-4">
                <Metric label="Images" value={String(view.outputFiles.filter((file) => file.file_type === "image").length)} />
                <Metric label="Videos" value={String(view.outputFiles.filter((file) => file.file_type === "video").length)} />
                <Metric label="Caption Pack" value={String(view.outputFiles.filter((file) => file.file_type === "zip").length)} />
                <Metric label="Source File" value={String(view.outputFiles.filter((file) => file.file_type === "source").length)} />
              </div>
              <div className="flex flex-wrap gap-3">
                <PrimaryActionButton href={`/library/${view.assetPackage.id}`}>Approve & Open Asset</PrimaryActionButton>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-center">
      <p className="text-2xl font-semibold text-[#06153a]">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
