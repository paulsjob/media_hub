import { PackageGenerator } from "@/components/package-generator";
import { MvpShell } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function GeneratePage() {
  const preview = mediaLab.previewQuoteCardPackage();
  const view = mediaLab.getAssetPackageView(preview.packageDraft.id);

  return (
    <MvpShell>
      <div className="mb-8">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">Quote Card</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#06153a] md:text-4xl">
            Fill the fields and choose your outputs.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Preview the active source render with MoDeck, then generate the selected stills and videos.
          </p>
        </div>
      </div>

      <PackageGenerator
        template={preview.template}
        fields={view?.packageFields ?? []}
        outputs={mediaLab.getOutputFormats()}
      />
    </MvpShell>
  );
}
