"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { PreviewGrid } from "@/components/preview-grid";
import {
  ButtonLike,
  SectionCard,
} from "@/components/ui";
import { mediaLabPayloadToModeckRenderRequest } from "@/lib/modeck/modeck-mapping";
import { mockModeckAdapter } from "@/lib/modeck/mock-modeck-adapter";
import type { MvpOutputFormat } from "@/lib/output-formats";
import type { PreviewContent } from "@/lib/preview-state";
import type { PackageField, Template } from "@/lib/types";

const fieldMap: Record<string, keyof PreviewContent> = {
  "Primary Quote": "quote",
  "Speaker Name": "speakerName",
  "Speaker Title": "speakerTitle",
  "Context Line": "contextLine",
  Headshot: "headshot",
} satisfies Record<string, keyof PreviewContent>;

interface RenderStartResult {
  ok: boolean;
  outputId?: string;
  editId?: string;
  status?: string;
  source?: "modeck-render";
  error?: string;
}

export function PackageGenerator({
  template,
  fields,
  outputs,
  initialContent,
  initialSelectedIds,
}: {
  template: Template;
  fields: PackageField[];
  outputs: MvpOutputFormat[];
  initialContent?: Partial<PreviewContent>;
  initialSelectedIds?: string[];
}) {
  const router = useRouter();
  const defaultSelectedIds =
    initialSelectedIds && initialSelectedIds.length > 0
      ? initialSelectedIds
      : ["still-1920x1080", "still-1080x1080", "video-1920x1080"];
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedIds);
  const [activeOutputId, setActiveOutputId] = useState(defaultSelectedIds[0] ?? "");
  const [content, setContent] = useState<PreviewContent>(() => ({
    quote: initialContent?.quote ?? getFieldValue(fields, "Primary Quote"),
    speakerName: initialContent?.speakerName ?? getFieldValue(fields, "Speaker Name"),
    speakerTitle: initialContent?.speakerTitle ?? getFieldValue(fields, "Speaker Title"),
    contextLine: initialContent?.contextLine ?? getFieldValue(fields, "Context Line"),
    headshot: initialContent?.headshot ?? getFieldValue(fields, "Headshot"),
    brand: initialContent?.brand ?? "2",
  }));
  const [outputsOpen, setOutputsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  function toggleOutput(id: string) {
    setSelectedIds((current) => {
      if (!current.includes(id)) {
        setActiveOutputId(id);
        return [...current, id];
      }

      setActiveOutputId(id);

      if (current.length === 1) {
        return current;
      }

      const next = current.filter((item) => item !== id);

      if (activeOutputId === id) {
        setActiveOutputId(next[0] ?? "");
      }

      return next;
    });
  }

  function updateContent(key: keyof PreviewContent, value: string) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  async function generatePackage() {
    if (selectedIds.length === 0 || isGenerating) {
      return;
    }

    setIsGenerating(true);

    const renderRequests = mediaLabPayloadToModeckRenderRequest({
      templateId: template.id,
      packageName: `${content.speakerName || "Quote Card"} Package`,
      fields: {
        quote: content.quote,
        speakerName: content.speakerName,
        speakerTitle: content.speakerTitle,
        contextLine: content.contextLine,
        headshot: content.headshot,
        brand: content.brand ?? "2",
      },
      selectedOutputIds: selectedIds,
      mediaReferences: {
        headshot: content.headshot,
      },
    });

    const renderResults = await Promise.all(
      renderRequests.map((request) => mockModeckAdapter.requestRender(request)),
    );
    const liveRenderResult = selectedIds.includes("still-1920x1080")
      ? await startLiveModeckRender(content)
      : null;
    const renderedOutputs = renderResults.map((result) => {
      const livePreviewDownloadUrl = getLivePreviewDownloadUrl(result.outputId, outputs, content);

      if (result.outputId === "still-1920x1080" && liveRenderResult?.ok && liveRenderResult.editId) {
        return {
          outputId: result.outputId,
          editId: liveRenderResult.editId,
          temporaryDownloadUrl: "",
          source: "modeck-render",
          status: liveRenderResult.status ?? "queued",
        };
      }

      return {
        outputId: result.outputId,
        editId: result.editId,
        temporaryDownloadUrl: livePreviewDownloadUrl ?? result.files[0]?.temporaryDownloadUrl ?? "",
        source: livePreviewDownloadUrl ? "modeck-preview" : "mock-placeholder",
        errorMessage:
          result.outputId === "still-1920x1080" && liveRenderResult && !liveRenderResult.ok
            ? liveRenderResult.error
            : undefined,
      };
    });
    const params = new URLSearchParams({
      template: "quote-card",
      quote: content.quote,
      speakerName: content.speakerName,
      speakerTitle: content.speakerTitle,
      contextLine: content.contextLine,
      headshotFilename: content.headshot,
      brand: content.brand ?? "2",
      outputs: selectedIds.join(","),
      previewApproved: outputsOpen ? "1" : "0",
      renders: encodeURIComponent(JSON.stringify(renderedOutputs)),
    });

    router.push(`/package?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.35fr)] xl:items-start">
        <div className="space-y-4">
          <SectionCard title="Select Package Outputs" className="p-4">
            <OutputSelector
              outputs={outputs}
              selectedIds={selectedIds}
              activeOutputId={activeOutputId}
              onToggle={toggleOutput}
            />
          </SectionCard>

          <SectionCard title="Required Quote Card Fields" action={<Icon name="sliders" className="h-5 w-5 text-slate-500" />}>
            <div className="grid gap-4">
              {template.required_fields.map((fieldName) => {
                const key = fieldMap[fieldName] ?? "quote";
                if (fieldName === "Headshot") {
                  return (
                    <HeadshotField
                      key={fieldName}
                      value={content[key] ?? ""}
                      onChange={(value) => updateContent(key, value)}
                    />
                  );
                }

                return (
                  <GeneratorField
                    key={fieldName}
                    label={fieldName.replace("Primary ", "")}
                    value={content[key] ?? ""}
                    textarea={fieldName === "Primary Quote"}
                    onChange={(value) => updateContent(key, value)}
                  />
                );
              })}
              <BrandControl value={content.brand} onChange={(value) => updateContent("brand", value)} />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Live Package Preview" action={<Icon name="eye" className="h-5 w-5 text-blue-700" />}>
            <PreviewGrid
              outputs={outputs}
              selectedOutputIds={selectedIds}
              activeOutputId={activeOutputId}
              content={content}
              onActiveOutputChange={setActiveOutputId}
            />
          </SectionCard>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#06153a]">Looks good? Continue to package.</p>
              </div>
              {outputsOpen ? (
                <span className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800">
                  Preview approved.
                </span>
              ) : (
                <ButtonLike variant="primary" onClick={() => setOutputsOpen(true)} className="shrink-0 gap-2">
                  <Icon name="check" />
                  Looks Good
                </ButtonLike>
              )}
            </div>
          </div>
        </div>
      </div>

      {outputsOpen ? (
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <ButtonLike variant="secondary" onClick={() => setOutputsOpen(false)} className="gap-2">
            <Icon name="sliders" />
            Back to Edit
          </ButtonLike>
          <ButtonLike
            variant="primary"
            onClick={generatePackage}
            disabled={selectedIds.length === 0 || isGenerating}
            className="gap-2"
          >
            <Icon name="package" />
            {isGenerating ? "Generating package..." : "Generate Package"}
          </ButtonLike>
        </div>
      ) : null}
    </div>
  );
}

async function startLiveModeckRender(content: PreviewContent): Promise<RenderStartResult> {
  try {
    const response = await fetch("/api/modeck/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outputId: "still-1920x1080",
        size: "1920x1080",
        quote: content.quote,
        speakerName: content.speakerName,
        speakerTitle: content.speakerTitle,
        contextLine: content.contextLine,
        brand: content.brand ?? "2",
        headshotFilename: getModeckHeadshotFilename(content.headshot),
      }),
    });
    const data = (await response.json()) as RenderStartResult;

    return response.ok ? data : { ...data, ok: false };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "MoDeck render request failed.",
    };
  }
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

function OutputSelector({
  outputs,
  selectedIds,
  activeOutputId,
  onToggle,
}: {
  outputs: MvpOutputFormat[];
  selectedIds: string[];
  activeOutputId: string;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {(["still", "video"] as const).map((type) => (
        <div key={type} className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-[#06153a]"
            title={type === "still" ? "Still outputs" : "Video outputs"}
            aria-label={type === "still" ? "Still outputs" : "Video outputs"}
          >
            {type === "still" ? "IMG" : "PLAY"}
          </span>
          <div className="flex flex-wrap gap-2">
            {outputs
              .filter((output) => output.type === type)
              .map((output) => {
                const selected = selectedIds.includes(output.id);
                const active = activeOutputId === output.id;
                const selectedClass =
                  output.type === "still"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-blue-600 bg-blue-600 text-white";

                return (
                  <button
                    key={output.id}
                    type="button"
                    onClick={() => onToggle(output.id)}
                    aria-pressed={selected}
                    title={getOutputTitle(output)}
                    className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                      selected
                        ? `${selectedClass} ${active ? "ring-2 ring-slate-300 ring-offset-1" : ""}`
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <RatioGlyph ratio={output.aspectLabel} active={active} selected={selected} />
                    <span>{output.aspectLabel}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function HeadshotField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <GeneratorField label="Headshot" value={value} onChange={onChange} />
      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#06153a]">Media reference</p>
            <p className="text-xs text-slate-500">Enter a filename available to the renderer. Browser upload is not wired.</p>
          </div>
          {/* TODO: Add media storage so browser uploads can resolve to a renderer-accessible filename. */}
          <input type="file" accept="image/*" disabled className="text-xs text-slate-400" />
        </div>
      </div>
    </div>
  );
}

function RatioGlyph({
  ratio,
  active,
  selected,
}: {
  ratio: string;
  active: boolean;
  selected: boolean;
}) {
  const shapeClass = {
    "16:9": "h-3 w-5",
    "1:1": "h-4 w-4",
    "4:5": "h-5 w-4",
    "9:16": "h-5 w-3",
  }[ratio] ?? "h-4 w-4";

  return (
    <span
      className={`inline-block rounded-sm border ${
        active
          ? "border-current bg-white/35"
          : selected
            ? "border-current bg-white/35"
            : "border-slate-400 bg-slate-100"
      } ${shapeClass}`}
      aria-hidden="true"
    />
  );
}

function BrandControl({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Brand
      </span>
      <select
        className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-[#06153a]"
        value={value ?? "2"}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="2">Default brand</option>
      </select>
    </label>
  );
}

function getModeckHeadshotFilename(value: string) {
  const trimmed = value.trim();

  return /\.[a-z0-9]{2,5}$/i.test(trimmed) ? trimmed : "";
}

function getOutputTitle(output: MvpOutputFormat) {
  return `${output.width}x${output.height} - ${output.aspectLabel} - ${output.recommendedPlatforms
    .slice(0, 2)
    .join(", ")}`;
}

function getFieldValue(fields: PackageField[], fieldName: string) {
  return fields.find((field) => field.field_name === fieldName)?.field_value ?? "";
}

function getLivePreviewDownloadUrl(
  outputId: string,
  outputs: MvpOutputFormat[],
  content: PreviewContent,
) {
  const output = outputs.find((item) => item.id === outputId);

  if (!output || output.type !== "still" || output.aspectLabel !== "16:9") {
    return null;
  }

  const query = new URLSearchParams({
    size: `${output.width}x${output.height}`,
    quote: content.quote,
    speakerName: content.speakerName,
    speakerTitle: content.speakerTitle,
    contextLine: content.contextLine,
    brand: content.brand ?? "2",
    headshotFilename: getModeckHeadshotFilename(content.headshot),
  });

  return `/api/modeck/preview/download?${query.toString()}`;
}
