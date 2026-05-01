"use client";

import { useMemo, useState } from "react";
import {
  AssetPreview,
  ButtonLike,
  FormField,
  OutputGroup,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "@/components/ui";
import type { MvpOutputFormat } from "@/lib/output-formats";
import type { PackageField, Template } from "@/lib/types";

export function PackageGenerator({
  template,
  fields,
  outputs,
}: {
  template: Template;
  fields: PackageField[];
  outputs: MvpOutputFormat[];
}) {
  const stills = outputs.filter((output) => output.type === "still");
  const videos = outputs.filter((output) => output.type === "video");
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "still-1920x1080",
    "still-1080x1080",
    "video-1920x1080",
  ]);

  const packageHref = useMemo(() => {
    const ids = selectedIds.length > 0 ? selectedIds : [outputs[0]?.id].filter(Boolean);
    return `/package?outputs=${ids.join(",")}`;
  }, [outputs, selectedIds]);

  function toggleOutput(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function selectByType(type: MvpOutputFormat["type"]) {
    setSelectedIds(outputs.filter((output) => output.type === type).map((output) => output.id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <SectionCard title="Required Fields">
          <div className="grid gap-4">
            {template.required_fields.map((fieldName) => {
              const value = fields.find((field) => field.field_name === fieldName)?.field_value ?? "";
              return (
                <FormField
                  key={fieldName}
                  label={fieldName.replace("Primary ", "")}
                  value={value}
                  textarea={fieldName === "Primary Quote"}
                  required
                />
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Choose Outputs">
          <div className="mb-5 flex flex-wrap gap-2">
            <SecondaryButton href="/generate" className="pointer-events-none">
              {selectedIds.length} selected
            </SecondaryButton>
            <ButtonLike onClick={() => selectByType("still")}>
              Select All Stills
            </ButtonLike>
            <ButtonLike onClick={() => selectByType("video")}>
              Select All Videos
            </ButtonLike>
            <ButtonLike onClick={() => setSelectedIds(outputs.map((output) => output.id))}>
              Select All Outputs
            </ButtonLike>
            <ButtonLike onClick={() => setSelectedIds([])}>
              Clear All
            </ButtonLike>
          </div>
          <div className="space-y-6">
            <OutputGroup title="Stills" outputs={stills} selectedIds={selectedIds} onToggle={toggleOutput} />
            <OutputGroup title="Videos" outputs={videos} selectedIds={selectedIds} onToggle={toggleOutput} />
          </div>
        </SectionCard>
      </div>

      <aside className="space-y-5">
        <SectionCard title="Preview">
          <AssetPreview />
          <p className="mt-3 text-sm text-slate-600">
            {template.name} preview. Generated files will match the selected output sizes.
          </p>
        </SectionCard>
        <PrimaryButton href={packageHref} className="w-full">
          Generate Package
        </PrimaryButton>
      </aside>
    </div>
  );
}
