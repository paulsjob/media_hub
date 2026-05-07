import { DownloadRow, MvpShell, SecondaryButton, SectionCard } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

export default async function PackagePage({
  searchParams,
}: {
  searchParams: Promise<{ outputs?: string; renders?: string }>;
}) {
  const { outputs = "", renders = "" } = await searchParams;
  const allOutputs = mediaLab.getOutputFormats();
  const selectedIds = outputs ? outputs.split(",") : allOutputs.map((output) => output.id);
  const selectedOutputs = allOutputs.filter((output) => selectedIds.includes(output.id));
  const stills = selectedOutputs.filter((output) => output.type === "still");
  const videos = selectedOutputs.filter((output) => output.type === "video");
  const renderResults = parseRenderResults(renders);
  const hasLiveModeckOutput = Object.values(renderResults).some(
    (result) => result.source === "modeck-preview",
  );

  return (
    <MvpShell>
      <section className="mx-auto mb-8 max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {hasLiveModeckOutput ? "MoDeck Preview Package Ready" : "Package Ready"}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[#06153a]">Your package is ready.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Download the available files below. Live MoDeck stills are labeled separately from placeholder outputs.
        </p>
      </section>

      <div className="mx-auto grid max-w-4xl gap-5">
        <SectionCard title="Stills">
          <div className="space-y-3">
            {stills.length > 0 ? (
              stills.map((output) => (
                <DownloadRow
                  key={output.id}
                  output={output}
                  editId={renderResults[output.id]?.editId}
                  downloadUrl={renderResults[output.id]?.temporaryDownloadUrl}
                  source={renderResults[output.id]?.source}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">No still outputs selected.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Videos">
          <div className="space-y-3">
            {videos.length > 0 ? (
              videos.map((output) => (
                <DownloadRow
                  key={output.id}
                  output={output}
                  editId={renderResults[output.id]?.editId}
                  downloadUrl={renderResults[output.id]?.temporaryDownloadUrl}
                  source={renderResults[output.id]?.source}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">No video outputs selected.</p>
            )}
          </div>
        </SectionCard>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <SecondaryButton href="/">Create Another Package</SecondaryButton>
        </div>
      </div>
    </MvpShell>
  );
}

interface PackageRenderResult {
  outputId: string;
  editId: string;
  temporaryDownloadUrl: string;
  source?: "modeck-preview" | "mock-placeholder";
}

function parseRenderResults(value: string): Record<string, PackageRenderResult> {
  if (!value) {
    return {};
  }

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as PackageRenderResult[];

    return parsed.reduce<Record<string, PackageRenderResult>>((results, result) => {
      results[result.outputId] = result;
      return results;
    }, {});
  } catch {
    return {};
  }
}
