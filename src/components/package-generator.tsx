"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface GenerationProgress {
  total: number;
  completed: number;
  currentLabel: string;
}

const liveRenderOutputIds = new Set([
  "still-1920x1080",
  "still-1080x1080",
  "still-1080x1350",
  "still-1080x1920",
]);
const brandOptions = [{ value: "2", label: "Default brand" }];

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
      : ["still-1920x1080", "still-1080x1080", "still-1080x1350", "still-1080x1920"];
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
  const [approvedPreviewSignature, setApprovedPreviewSignature] = useState("");
  const [previewReadiness, setPreviewReadiness] = useState({
    currentPreviewSignature: "",
    allConnectedPreviewsReady: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [selectedHeadshot, setSelectedHeadshot] = useState<{
    filename: string;
    previewUrl: string;
  } | null>(null);
  const [headshotError, setHeadshotError] = useState("");
  const [isUploadingHeadshot, setIsUploadingHeadshot] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const generatePackageInFlightRef = useRef(false);
  const previewContent = useMemo(
    () => ({
      ...content,
      headshotPreviewUrl: selectedHeadshot?.previewUrl,
    }),
    [content, selectedHeadshot],
  );
  const previewApprovedEffective =
    Boolean(approvedPreviewSignature) &&
    approvedPreviewSignature === previewReadiness.currentPreviewSignature &&
    previewReadiness.allConnectedPreviewsReady;
  const previousPreviewSignatureRef = useRef(previewReadiness.currentPreviewSignature);

  useEffect(() => {
    return () => {
      if (selectedHeadshot?.previewUrl) {
        URL.revokeObjectURL(selectedHeadshot.previewUrl);
      }
    };
  }, [selectedHeadshot]);

  useEffect(() => {
    const previousSignature = previousPreviewSignatureRef.current;

    if (previousSignature && previousSignature !== previewReadiness.currentPreviewSignature) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[modeck-preview-approval]", {
          currentPreviewSignature: previewReadiness.currentPreviewSignature,
          approvedPreviewSignature,
          previewApprovedEffective: false,
          reason: "preview_signature_changed",
        });
      }
    }

    previousPreviewSignatureRef.current = previewReadiness.currentPreviewSignature;
  }, [approvedPreviewSignature, previewReadiness.currentPreviewSignature]);

  useEffect(() => {
    if (
      approvedPreviewSignature &&
      approvedPreviewSignature === previewReadiness.currentPreviewSignature &&
      !previewReadiness.allConnectedPreviewsReady
    ) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[modeck-preview-approval]", {
          currentPreviewSignature: previewReadiness.currentPreviewSignature,
          approvedPreviewSignature,
          previewApprovedEffective: false,
          reason: "connected_previews_not_ready",
        });
      }
    }
  }, [approvedPreviewSignature, previewReadiness]);

  const handlePreviewStateChange = useCallback(
    (state: { currentPreviewSignature: string; allConnectedPreviewsReady: boolean }) => {
      setPreviewReadiness(state);
    },
    [],
  );

  function invalidatePreviewApproval(reason: string) {
    if (approvedPreviewSignature && process.env.NODE_ENV !== "production") {
      console.info("[modeck-preview-approval]", {
        currentPreviewSignature: previewReadiness.currentPreviewSignature,
        approvedPreviewSignature,
        previewApprovedEffective: false,
        reason,
      });
    }

    setApprovedPreviewSignature("");
  }

  function toggleOutput(id: string) {
    invalidatePreviewApproval("selected_outputs_changed");
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
    invalidatePreviewApproval(`${key}_changed`);
    setContent((current) => ({ ...current, [key]: value }));
  }

  async function selectHeadshotFile(file: File | null) {
    invalidatePreviewApproval("headshot_file_changed");
    setHeadshotError("");

    if (selectedHeadshot?.previewUrl) {
      URL.revokeObjectURL(selectedHeadshot.previewUrl);
    }

    if (!file) {
      setSelectedHeadshot(null);
      setContent((current) => ({ ...current, headshot: "" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedHeadshot(null);
      setHeadshotError("Choose an image file.");
      return;
    }

    logHeadshotSelection(file.name);

    const previewUrl = URL.createObjectURL(file);
    setSelectedHeadshot({
      filename: file.name,
      previewUrl,
    });
    setIsUploadingHeadshot(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/modeck/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        ok: boolean;
        filename?: string;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.filename) {
        throw new Error(data.error ?? "Headshot upload failed.");
      }

      logHeadshotUploadResult({
        selectedFilename: file.name,
        uploadedFilename: data.filename,
      });
      setContent((current) => ({ ...current, headshot: data.filename ?? "" }));
      setSelectedHeadshot((current) =>
        current
          ? {
              ...current,
              filename: data.filename ?? current.filename,
            }
          : current,
      );
    } catch (error) {
      setHeadshotError(error instanceof Error ? error.message : "Headshot upload failed.");
    } finally {
      setIsUploadingHeadshot(false);
    }
  }

  function clearHeadshotFile() {
    selectHeadshotFile(null);
    setFileInputKey((current) => current + 1);
  }

  async function generatePackage() {
    if (selectedIds.length === 0 || isGenerating || generatePackageInFlightRef.current || !previewApprovedEffective) {
      return;
    }

    generatePackageInFlightRef.current = true;
    setIsGenerating(true);
    setGenerationProgress(null);
    const generateStartedAt = performance.now();
    const headshotReference = getModeckHeadshotFilename(content.headshot);

    const renderRequests = mediaLabPayloadToModeckRenderRequest({
      templateId: template.id,
      packageName: `${content.speakerName || "Quote Card"} Package`,
      fields: {
        quote: content.quote,
        speakerName: content.speakerName,
        speakerTitle: content.speakerTitle,
        contextLine: content.contextLine,
        headshot: headshotReference,
        brand: content.brand ?? "2",
      },
      selectedOutputIds: selectedIds,
      mediaReferences: {
        headshot: headshotReference,
      },
    });

    const renderResults = await Promise.all(
      renderRequests.map((request) => mockModeckAdapter.requestRender(request)),
    );
    const liveRenderOutputIdsToStart = selectedIds.filter((outputId) => liveRenderOutputIds.has(outputId));
    const liveRenderOutputsToStart = liveRenderOutputIdsToStart
      .map((outputId) => outputs.find((output) => output.id === outputId))
      .filter((output): output is MvpOutputFormat => Boolean(output));

    logModeckRenderCreationPlan(liveRenderOutputIdsToStart);
    logGenerateStage({
      stage: "client-click-to-render-start",
      durationMs: Math.round(performance.now() - generateStartedAt),
      outputIds: liveRenderOutputIdsToStart,
    });
    setGenerationProgress({
      total: liveRenderOutputsToStart.length,
      completed: 0,
      currentLabel: getUserFacingOutputLabel(liveRenderOutputsToStart[0] ?? outputs[0]),
    });

    const liveRenderStartedAt = performance.now();
    const liveRenderResults = await Promise.all(
      liveRenderOutputsToStart.map((output, index) =>
        startLiveModeckRender(output.id, content).finally(() => {
          setGenerationProgress((current) => ({
            total: current?.total ?? liveRenderOutputsToStart.length,
            completed: Math.min((current?.completed ?? index) + 1, liveRenderOutputsToStart.length),
            currentLabel:
              liveRenderOutputsToStart[Math.min(index + 1, liveRenderOutputsToStart.length - 1)]
                ? getUserFacingOutputLabel(liveRenderOutputsToStart[Math.min(index + 1, liveRenderOutputsToStart.length - 1)])
                : getUserFacingOutputLabel(output),
          }));
        }),
      ),
    );

    logModeckRenderCreationTotal({
      outputIds: liveRenderOutputIdsToStart,
      durationMs: Math.round(performance.now() - liveRenderStartedAt),
    });
    setGenerationProgress((current) =>
      current
        ? {
            ...current,
            completed: current.total,
            currentLabel: "Preparing downloads",
          }
        : current,
    );
    const liveRenderByOutputId = new Map(
      liveRenderResults
        .filter((result) => result.outputId)
        .map((result) => [result.outputId as string, result]),
    );
    const renderedOutputs = renderResults.map((result) => {
      const livePreviewDownloadUrl = getLivePreviewDownloadUrl(result.outputId, outputs, content);
      const liveRenderResult = liveRenderByOutputId.get(result.outputId);

      if (liveRenderResult?.ok && liveRenderResult.editId) {
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
          liveRenderResult && !liveRenderResult.ok
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
      headshotFilename: headshotReference,
      brand: content.brand ?? "2",
      outputs: selectedIds.join(","),
      previewApproved: previewApprovedEffective ? "1" : "0",
      renders: encodeURIComponent(JSON.stringify(renderedOutputs)),
    });

    logGenerateStage({
      stage: "client-generate-total-before-route",
      durationMs: Math.round(performance.now() - generateStartedAt),
      outputIds: liveRenderOutputIdsToStart,
    });

    router.push(`/package?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.35fr)] xl:items-start">
        <div className="space-y-4">
          <SectionCard title="Template Selection">
            <TemplateSummary
              outputs={outputs}
              selectedIds={selectedIds}
              onToggle={toggleOutput}
            />
          </SectionCard>

          <SectionCard title="Content Fields" action={<Icon name="sliders" className="h-5 w-5 text-slate-500" />}>
            <div className="grid gap-4">
              {template.required_fields.map((fieldName) => {
                const key = fieldMap[fieldName] ?? "quote";
                if (fieldName === "Headshot") {
                  return (
                    <HeadshotField
                      key={fieldName}
                      value={content[key] ?? ""}
                      onChange={(value) => updateContent(key, value)}
                      selectedFilename={selectedHeadshot?.filename}
                      previewUrl={selectedHeadshot?.previewUrl}
                      isUploading={isUploadingHeadshot}
                      errorMessage={headshotError}
                      fileInputKey={fileInputKey}
                      onFileChange={selectHeadshotFile}
                      onClearFile={clearHeadshotFile}
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
          <SectionCard title="Render Preview" action={<Icon name="eye" className="h-5 w-5 text-blue-700" />}>
            <PreviewGrid
              outputs={outputs}
              selectedOutputIds={selectedIds}
              activeOutputId={activeOutputId}
              content={previewContent}
              onActiveOutputChange={setActiveOutputId}
              onPreviewStateChange={handlePreviewStateChange}
              templateId="quote-card"
            />
          </SectionCard>

          <PreviewActionPanel
            allConnectedPreviewsReady={previewReadiness.allConnectedPreviewsReady}
            previewApprovedEffective={previewApprovedEffective}
            selectedOutputCount={selectedIds.length}
            isGenerating={isGenerating}
            progress={generationProgress}
            onApprove={() => setApprovedPreviewSignature(previewReadiness.currentPreviewSignature)}
            onEdit={() => setApprovedPreviewSignature("")}
            onGenerate={generatePackage}
          />
        </div>
      </div>
    </div>
  );
}

function TemplateSummary({
  outputs,
  selectedIds,
  onToggle,
}: {
  outputs: MvpOutputFormat[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-[var(--silver)] bg-[var(--light-gray)] text-sm font-bold text-[var(--navy-blue)]">
          QT
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[var(--navy-blue)]">Quote Card</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--slate-blue)]">
            Fast quote graphics for social and digital use.
          </p>
        </div>
      </div>
      <OutputSelector
        outputs={outputs}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}

function PreviewActionPanel({
  allConnectedPreviewsReady,
  previewApprovedEffective,
  selectedOutputCount,
  isGenerating,
  progress,
  onApprove,
  onEdit,
  onGenerate,
}: {
  allConnectedPreviewsReady: boolean;
  previewApprovedEffective: boolean;
  selectedOutputCount: number;
  isGenerating: boolean;
  progress: GenerationProgress | null;
  onApprove: () => void;
  onEdit: () => void;
  onGenerate: () => void;
}) {
  const progressStep = progress && progress.total > 0
    ? Math.min(progress.completed + 1, progress.total)
    : 0;
  const primaryDisabled = previewApprovedEffective
    ? selectedOutputCount === 0 || isGenerating
    : !allConnectedPreviewsReady;

  return (
    <div className="border border-slate-200 bg-white px-3 py-2 shadow-sm">
      {isGenerating ? (
        <div className="mb-2 text-xs text-slate-600">
          <p className="font-semibold">
            {progressStep > 0 && progress
              ? `Generating ${progressStep} of ${progress.total}: ${progress.currentLabel}`
              : "Generating final PNGs"}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--navy-blue)]">
            {previewApprovedEffective ? "Approved." : allConnectedPreviewsReady ? "Preview ready." : "Rendering previews."}
          </p>
          {!previewApprovedEffective ? (
            <p className="mt-0.5 text-xs text-slate-500">Approve before generating final files.</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {previewApprovedEffective ? (
            <ButtonLike variant="secondary" onClick={onEdit} className="min-h-9 px-3 text-sm">
              Edit
            </ButtonLike>
          ) : null}
          <ButtonLike
            variant="primary"
            onClick={previewApprovedEffective ? onGenerate : onApprove}
            disabled={primaryDisabled}
            className="min-h-9 px-4 text-sm"
          >
            {previewApprovedEffective
              ? isGenerating ? "Generating..." : "Generate"
              : allConnectedPreviewsReady ? "Approve" : "Rendering"}
          </ButtonLike>
        </div>
      </div>
    </div>
  );
}

async function startLiveModeckRender(outputId: string, content: PreviewContent): Promise<RenderStartResult> {
  const startedAt = performance.now();

  try {
    logModeckRenderCreateRequest(outputId);

    const response = await fetch("/api/modeck/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outputId,
        size: outputId.replace("still-", ""),
        quote: content.quote,
        speakerName: content.speakerName,
        speakerTitle: content.speakerTitle,
        contextLine: content.contextLine,
        brand: content.brand ?? "2",
        headshotFilename: getModeckHeadshotFilename(content.headshot),
      }),
    });
    const data = (await response.json()) as RenderStartResult;
    const durationMs = Math.round(performance.now() - startedAt);

    logModeckRenderCreateResponse(outputId, data, response.ok, durationMs);

    return response.ok
      ? { ...data, outputId: data.outputId ?? outputId }
      : { ...data, ok: false, outputId: data.outputId ?? outputId };
  } catch (error) {
    logModeckRenderCreateResponse(
      outputId,
      {
        ok: false,
        outputId,
        error: error instanceof Error ? error.message : "Render request failed.",
      },
      false,
      Math.round(performance.now() - startedAt),
    );

    return {
      ok: false,
      outputId,
      error: error instanceof Error ? error.message : "Render request failed.",
    };
  }
}

function logModeckRenderCreationPlan(outputIds: string[]) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-render-create-plan]", {
    outputIds,
    renderJobCount: outputIds.length,
  });
}

function logModeckRenderCreateRequest(outputId: string) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-render-create-request]", {
    outputId,
  });
}

function logModeckRenderCreationTotal({
  outputIds,
  durationMs,
}: {
  outputIds: string[];
  durationMs: number;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-render-create-total]", {
    outputIds,
    renderJobCount: outputIds.length,
    durationMs,
  });
}

function logGenerateStage({
  stage,
  durationMs,
  outputIds,
}: {
  stage: string;
  durationMs: number;
  outputIds: string[];
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-generate-client-timing]", {
    stage,
    durationMs,
    outputIds,
  });
}

function logModeckRenderCreateResponse(
  outputId: string,
  result: RenderStartResult,
  responseOk: boolean,
  durationMs: number,
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-render-create-response]", {
    outputId: result.outputId ?? outputId,
    editId: result.editId ?? null,
    status: result.status ?? null,
    responseOk,
    ok: result.ok,
    error: result.error ?? null,
    durationMs,
  });
}

function logHeadshotSelection(filename: string) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-headshot-selected]", {
    selectedFilename: filename,
  });
}

function logHeadshotUploadResult({
  selectedFilename,
  uploadedFilename,
}: {
  selectedFilename: string;
  uploadedFilename: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[modeck-headshot-uploaded]", {
    selectedFilename,
    uploadedFilename,
  });
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
  onToggle,
}: {
  outputs: MvpOutputFormat[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {outputs.map((output) => {
        const selected = selectedIds.includes(output.id);

        return (
          <button
            key={output.id}
            type="button"
            onClick={() => onToggle(output.id)}
            aria-pressed={selected}
            title={getOutputTitle(output)}
            className={`relative inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold leading-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--flame)] ${
              selected
                ? "border-[var(--flame)] bg-[var(--navy-blue)] text-white shadow-sm ring-1 ring-orange-200"
                : "border-slate-300 bg-white text-[var(--navy-blue)] shadow-none hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            {selected ? <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-[var(--flame)]" /> : null}
            {getOutputDisplayLabel(output)}
          </button>
        );
      })}
    </div>
  );
}

function HeadshotField({
  value,
  onChange,
  selectedFilename,
  previewUrl,
  isUploading,
  errorMessage,
  fileInputKey,
  onFileChange,
  onClearFile,
}: {
  value: string;
  onChange: (value: string) => void;
  selectedFilename?: string;
  previewUrl?: string;
  isUploading: boolean;
  errorMessage: string;
  fileInputKey: number;
  onFileChange: (file: File | null) => void | Promise<void>;
  onClearFile: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Headshot</span>
        <input
          className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-[#06153a]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="URL or filename"
        />
      </label>
      <p className="text-xs text-slate-500">
        Use a public image URL or a file in MoDeck Sync/_modk-data/User media.
      </p>
      {isUploading ? <p className="text-sm font-semibold text-slate-600">Attaching headshot...</p> : null}
      {errorMessage ? <p className="text-sm font-semibold text-orange-800">{errorMessage}</p> : null}

      <details className="group rounded-md border border-slate-200 bg-white p-3 [&>summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-600">
          <span>Preview local image</span>
          <span className="text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true">
            &gt;
          </span>
        </summary>
        <div className="mt-3 grid gap-3">
          <p className="text-xs text-slate-500">For checking the crop only. Rendering uses the URL or filename above.</p>
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[#06153a] file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-white file:px-4 file:text-sm file:font-semibold file:text-[#06153a] hover:file:bg-slate-50"
          />
          {previewUrl ? (
            <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-300 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selected local headshot preview" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#06153a]">{selectedFilename}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Local preview only</p>
              </div>
              <button
                type="button"
                onClick={onClearFile}
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-[#06153a] hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </details>
    </div>
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
        {brandOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getModeckHeadshotFilename(value: string) {
  return value.trim();
}

function getOutputTitle(output: MvpOutputFormat) {
  if (output.id === "still-1080x1350") {
    return "1400x1800 - 4:5 - Instagram Feed, Facebook";
  }

  return `${output.width}x${output.height} - ${output.aspectLabel} - ${output.recommendedPlatforms
    .slice(0, 2)
    .join(", ")}`;
}

function getUserFacingOutputLabel(output: MvpOutputFormat | undefined) {
  if (!output) {
    return "final PNG";
  }

  if (output.id === "still-1080x1350") {
    return "1400x1800 \u00b7 4:5 \u00b7 Still";
  }

  return `${output.label} \u00b7 ${output.aspectLabel} \u00b7 ${output.type === "video" ? "Video" : "Still"}`;
}

function getOutputDisplayLabel(output: MvpOutputFormat) {
  const labelByRatio: Record<string, string> = {
    "16:9": "16:9 Landscape",
    "1:1": "1:1 Square",
    "4:5": "4:5 Portrait",
    "9:16": "9:16 Vertical",
  };

  return labelByRatio[output.aspectLabel] ?? `${output.aspectLabel} ${output.label}`;
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
