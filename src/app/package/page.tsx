import { PackageResults, type PackageRenderResult } from "@/components/package-results";
import { MvpShell, SecondaryButton } from "@/components/ui";
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

  return (
    <MvpShell>
      <div className="mx-auto grid max-w-4xl gap-5">
        <PackageResults stills={stills} videos={videos} initialRenderResults={renderResults} />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <SecondaryButton href="/">Create Another Package</SecondaryButton>
        </div>
      </div>
    </MvpShell>
  );
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
