import { AppShell } from "@/components/app-shell";
import { AssetPreview, PageHeader, PrimaryActionButton, SectionCard, StatusBadge } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function ApprovalsPage() {
  const view = mediaLab.getFeaturedAssetPackageView();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Majority Democrats / Approval Queue"
        title="Approvals"
        subtitle="Built for speed. Max two approvals, then package or kill."
      />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Max 2 Approvals">
          {view ? (
            <a href={`/library/${view.assetPackage.id}`} className="grid gap-4 border border-[var(--flame)] bg-[var(--powder-blue)] p-4 md:grid-cols-[180px_1fr]">
              <AssetPreview compact />
              <div>
                <StatusBadge status="needs_review" />
                <h2 className="mt-3 text-xl font-extrabold text-[var(--navy-blue)]">{view.assetPackage.title}</h2>
                <p className="text-sm font-bold uppercase tracking-wide text-[var(--slate-blue)]">{view.template.name}</p>
              </div>
            </a>
          ) : (
            <div className="border border-[var(--silver)] bg-[var(--white)] p-6 font-bold uppercase tracking-wide text-[var(--navy-blue)]">
              Queue clear. No pending reviews.
            </div>
          )}
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
                <PrimaryActionButton href={`/library/${view.assetPackage.id}`}>Approve Asset</PrimaryActionButton>
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
    <div className="border border-[var(--silver)] bg-white p-3 text-center">
      <p className="text-3xl font-extrabold text-[var(--navy-blue)]">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--slate-blue)]">{label}</p>
    </div>
  );
}
