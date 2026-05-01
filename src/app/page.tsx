import { MvpShell, TemplateCard } from "@/components/ui";
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
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </section>
    </MvpShell>
  );
}
