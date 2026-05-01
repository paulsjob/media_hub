import { MvpShell, SecondaryButton, TemplateCard } from "@/components/ui";
import { mediaLab } from "@/lib/media-lab-service";

const mvpTemplateNames = ["Quote Card V.2", "Stat Card", "Contrast Card", "Clip Packaging Pack"];

export default function HomePage() {
  const templates = mediaLab
    .getTemplates()
    .filter((template) => mvpTemplateNames.includes(template.name))
    .map((template) =>
      template.name === "Clip Packaging Pack" ? { ...template, name: "Clip Pack" } : template,
    );

  return (
    <MvpShell>
      <section className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Create Package</p>
        <h1 className="text-4xl font-semibold tracking-tight text-[#06153a] md:text-5xl">
          Create a complete content package in minutes.
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Choose a template, enter the content, select still/video outputs, and download every format you need.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((template, index) =>
          index === 0 ? (
            <TemplateCard key={template.id} template={template} />
          ) : (
            <div key={template.id} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                {template.name.includes("Clip") ? "CL" : "TP"}
              </div>
              <h2 className="text-xl font-semibold text-[#06153a]">{template.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{template.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>Preview only</span>
                <span>Coming soon</span>
              </div>
              <SecondaryButton href="/" className="pointer-events-none mt-5 w-full opacity-70">
                Coming Soon
              </SecondaryButton>
            </div>
          ),
        )}
      </section>
    </MvpShell>
  );
}
