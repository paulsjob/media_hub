"use client";

import { useMemo, useState } from "react";
import { PreviewGrid } from "@/components/preview-grid";
import {
  ButtonLike,
  OutputGroup,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "@/components/ui";
import type { MvpOutputFormat } from "@/lib/output-formats";
import { getUniquePreviewRatios, type PreviewContent } from "@/lib/preview-state";
import type { PackageField, Template } from "@/lib/types";

const fieldMap: Record<string, keyof PreviewContent> = {
  "Primary Quote": "quote",
  "Speaker Name": "speakerName",
  "Speaker Title": "speakerTitle",
  "Context Line": "contextLine",
  Headshot: "headshot",
} satisfies Record<string, keyof PreviewContent>;

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
  const [content, setContent] = useState<PreviewContent>(() => ({
    quote: getFieldValue(fields, "Primary Quote"),
    speakerName: getFieldValue(fields, "Speaker Name"),
    speakerTitle: getFieldValue(fields, "Speaker Title"),
    contextLine: getFieldValue(fields, "Context Line"),
    headshot: getFieldValue(fields, "Headshot"),
  }));

  const selectedRatios = useMemo(
    () => getUniquePreviewRatios(outputs, selectedIds),
    [outputs, selectedIds],
  );

  const packageHref = useMemo(() => `/package?outputs=${selectedIds.join(",")}`, [selectedIds]);

  function toggleOutput(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function selectByType(type: MvpOutputFormat["type"]) {
    setSelectedIds(outputs.filter((output) => output.type === type).map((output) => output.id));
  }

  function updateContent(key: keyof PreviewContent, value: string) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Required Fields">
        <div className="grid gap-4">
          {template.required_fields.map((fieldName) => {
            const key = fieldMap[fieldName] ?? "quote";
            return (
              <GeneratorField
                key={fieldName}
                label={fieldName.replace("Primary ", "")}
                value={content[key]}
                textarea={fieldName === "Primary Quote"}
                onChange={(value) => updateContent(key, value)}
              />
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Choose Outputs">
        <div className="mb-5 flex flex-wrap gap-2">
          <ButtonLike disabled>{selectedIds.length} selected</ButtonLike>
          <ButtonLike onClick={() => selectByType("still")}>Select All Stills</ButtonLike>
          <ButtonLike onClick={() => selectByType("video")}>Select All Videos</ButtonLike>
          <ButtonLike onClick={() => setSelectedIds(outputs.map((output) => output.id))}>
            Select All Outputs
          </ButtonLike>
          <ButtonLike onClick={() => setSelectedIds([])}>Clear All</ButtonLike>
        </div>
        <div className="space-y-6">
          <OutputGroup title="Stills" outputs={stills} selectedIds={selectedIds} onToggle={toggleOutput} />
          <OutputGroup title="Videos" outputs={videos} selectedIds={selectedIds} onToggle={toggleOutput} />
        </div>
      </SectionCard>

      <SectionCard title="Live Preview">
        <PreviewGrid ratios={selectedRatios} content={content} />
      </SectionCard>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <SecondaryButton href="/">Change Template</SecondaryButton>
        <PrimaryButton href={packageHref} disabled={selectedIds.length === 0}>
          Generate Package
        </PrimaryButton>
      </div>
    </div>
  );
}

function GeneratorField({
  label,
  value,
  textarea = false,
  onChange,
}: {
  label: string;
  value: string;
  textarea?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} <span className="text-orange-700">Required</span>
      </span>
      {textarea ? (
        <textarea
          className="min-h-28 w-full rounded-md border border-slate-300 bg-white p-3 text-base leading-7 text-[#06153a]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-[#06153a]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function getFieldValue(fields: PackageField[], fieldName: string) {
  return fields.find((field) => field.field_name === fieldName)?.field_value ?? "";
}
