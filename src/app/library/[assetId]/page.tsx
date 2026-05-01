import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  AssetPreview,
  ButtonLike,
  Chip,
  PageHeader,
  PrimaryActionButton,
  SecondaryButton,
  SectionCard,
  StatusBadge,
} from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const view = mediaLab.getAssetPackageView(assetId);

  if (!view) {
    notFound();
  }

  const xCaption = view.captions.find((caption) => caption.platform === "x_twitter") ?? view.captions[0];
  const performance = view.performance[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Library / ${view.template.name}`}
        title={view.assetPackage.title}
        subtitle={`${view.template.name} · Created by ${view.creator.name} · Approved package`}
        actions={
          <>
            <SecondaryButton href="/library">Back To Library</SecondaryButton>
            <PrimaryActionButton href="/distribution">Prepare For Distribution</PrimaryActionButton>
          </>
        }
      />
      <div className="mb-5">
        <StatusBadge status={view.assetPackage.status} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr_0.85fr]">
        <SectionCard title="Asset Preview">
          <AssetPreview />
          <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-slate-100 pt-4">
            {mediaLab.getOutputFormats().slice(0, 3).map((output) => (
              <Chip key={output.id} selected={output.aspectLabel === "16:9"}>
                {output.aspectLabel}
              </Chip>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Asset Details">
          <dl className="space-y-4 text-sm">
            {[
              ["Content Type", view.template.template_type],
              ["Template", `${view.template.name} ${view.template.version}`],
              ["Series", view.story.series],
              ["Intake Record", view.story.id],
              ["Primary Quote", getField(view, "Primary Quote")],
              ["Speaker", getField(view, "Speaker Name")],
              ["Context Line", getField(view, "Context Line")],
              ["Source", view.story.source_type],
              ["Created", "April 30, 2026 by Avery Smith"],
              ["Approved", "April 30, 2026 by Jordan Lee"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[120px_1fr] gap-3">
                <dt className="font-semibold text-[#06153a]">{label}</dt>
                <dd className="text-slate-600">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Caption Pack">
          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            {view.captions.slice(0, 3).map((caption, index) => (
              <Chip key={caption.id} selected={index === 0}>
                {caption.platform.replaceAll("_", " ")}
              </Chip>
            ))}
          </div>
          <div className="whitespace-pre-line rounded-md border border-slate-300 bg-white p-4 text-sm leading-7 text-[#06153a]">
            {xCaption.caption_text}
          </div>
          <div className="mt-4">
            <SecondaryButton href={`/library/${view.assetPackage.id}`}>Copy Caption</SecondaryButton>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Alt Text</p>
            <p className="text-sm text-slate-600">{xCaption.alt_text}</p>
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.85fr_0.85fr]">
        <SectionCard title="Outputs">
          <div className="space-y-2">
            {view.outputFiles.map((file) => (
              <div key={file.id} className="grid grid-cols-[1fr_110px_120px] items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="font-semibold text-[#06153a]">
                  {file.ratio} {file.format}
                </span>
                <span className="text-slate-500">{file.file_size}</span>
                <ButtonLike variant="secondary" className="min-h-9 px-3">
                  Download
                </ButtonLike>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <PrimaryActionButton href={`/library/${view.assetPackage.id}`}>Download All</PrimaryActionButton>
          </div>
        </SectionCard>

        <SectionCard title="Performance Snapshot">
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Total Engagements" value={performance ? "4.2K" : "0"} />
            <Metric label="Best Format" value="9:16 MP4" />
            <Metric label="Impressions" value={performance ? "98.6K" : "0"} />
            <Metric label="Engagement Rate" value={performance ? "4.26%" : "0%"} />
            <Metric label="Shares" value={performance ? "1.1K" : "0"} />
            <Metric label="Saves" value={performance ? "732" : "0"} />
          </div>
        </SectionCard>

        <SectionCard title="Approval History">
          <div className="space-y-4">
            {view.approvals.map((approval) => (
              <div key={approval.id} className="flex gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                  OK
                </span>
                <div>
                  <p className="font-semibold capitalize text-[#06153a]">{approval.review_stage}</p>
                  <p className="text-sm text-slate-600">{approval.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function getField(view: NonNullable<ReturnType<typeof mediaLab.getAssetPackageView>>, fieldName: string) {
  return view.packageFields.find((field) => field.field_name === fieldName)?.field_value ?? "";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-[#06153a]">{value}</p>
    </div>
  );
}
