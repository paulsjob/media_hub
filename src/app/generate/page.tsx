import { PackageGenerator } from "@/components/package-generator";
import { MvpShell, SecondaryButton } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default function GeneratePage() {
  const preview = mediaLab.previewQuoteCardPackage();
  const view = mediaLab.getAssetPackageView(preview.packageDraft.id);

  return (
    <MvpShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">Quote Card</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#06153a] md:text-4xl">
            Fill the fields and choose your outputs.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            MEDIA LAB will mock-generate stills and videos in the exact sizes selected below.
          </p>
        </div>
        <SecondaryButton href="/">Change Template</SecondaryButton>
      </div>

      <PackageGenerator
        template={preview.template}
        fields={view?.packageFields ?? []}
        outputs={mediaLab.getOutputFormats()}
      />
    </MvpShell>
  );
}
