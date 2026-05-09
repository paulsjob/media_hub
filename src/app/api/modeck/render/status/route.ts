import {
  getModeckApiConfig,
  isRecord,
  parseJsonObject,
  slugify,
} from "@/lib/modeck/quote-box-test";
import { registerRenderDownload } from "@/lib/modeck/render-download-store";
import { MVP_OUTPUT_FORMATS } from "@/lib/output-formats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = getModeckApiConfig();

  if (!config) {
    return Response.json(
      { ok: false, error: "Live MoDeck render is not configured." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const editId = url.searchParams.get("editId") ?? "";
  const outputId = url.searchParams.get("outputId") ?? "still-1920x1080";

  if (!editId) {
    return Response.json({ ok: false, error: "Missing editId." }, { status: 400 });
  }

  const response = await fetch(`${config.apiBaseUrl}/renderstatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.apiKey,
    },
    body: JSON.stringify({
      apiKey: config.apiKey,
      editId,
    }),
  });
  const responseText = await response.text();
  const responseJson = parseJsonObject(responseText);

  if (!response.ok || responseJson?.success === false) {
    return Response.json(
      {
        ok: false,
        status: response.status,
        error: responseJson?.error ?? responseJson?.message ?? responseJson?.info ?? responseText,
      },
      { status: response.ok ? 502 : response.status },
    );
  }

  const normalized = normalizeRenderStatus(responseJson, editId, outputId);
  const debug =
    process.env.NODE_ENV !== "production" && responseJson
      ? buildDebugResponse(responseJson, editId)
      : null;

  return Response.json({
    ok: true,
    ...normalized,
    responseSummary: summarizeResponse(responseJson ?? responseText),
    ...(debug ? { debug } : {}),
  });
}

function getRenderStatusRecord(response: Record<string, unknown>) {
  return isRecord(response.renderStatus) ? response.renderStatus : null;
}

function normalizeRenderStatus(
  response: Record<string, unknown> | null,
  editId: string,
  outputId: string,
) {
  const render = findRenderRecord(response, editId) ?? response;
  const status = normalizeRenderRecordStatus(render, response);
  const progress = normalizeProgress(render?.progress ?? response?.progress, status);
  const sourceDownloadUrl = extractDownloadUrl(render) ?? extractDownloadUrl(response);
  const downloadUrl =
    status === "completed" && sourceDownloadUrl
      ? createMediaLabDownloadUrl(editId, outputId, sourceDownloadUrl, render ?? response)
      : null;
  const errorMessage = extractErrorMessage(render) ?? extractErrorMessage(response);

  return {
    editId,
    outputId,
    status,
    progress,
    temporaryDownloadUrl: downloadUrl,
    errorMessage,
    statusDebug: buildStatusDebug(render, response),
  };
}

function normalizeRenderRecordStatus(
  render: Record<string, unknown> | null,
  response: Record<string, unknown> | null,
) {
  const status = normalizeStatus(render?.code ?? render?.status ?? response?.status);

  if (status === "queued" && render?.currentlyRendering === true) {
    return "rendering";
  }

  return status;
}

function buildStatusDebug(
  render: Record<string, unknown> | null,
  response: Record<string, unknown> | null,
) {
  return {
    renderStatusCode: render?.code,
    renderStatusStatus: render?.status,
    renderStatusDetails: render?.details,
    renderStatusCurrentlyRendering: render?.currentlyRendering,
    responseStatus: response?.status,
  };
}

function buildDebugResponse(response: Record<string, unknown>, editId: string) {
  const renderStatus = getRenderStatusRecord(response);
  const render = findRenderRecord(response, editId);

  return redactDebugValue({
    responseKeys: Object.keys(response),
    renderStatus,
    selectedRenderRecord: render,
    normalizationFields: getNormalizationFields(response, render),
    downloadUrlCandidates: collectAllDownloadUrlCandidates(response, renderStatus, render),
  });
}

function getNormalizationFields(
  response: Record<string, unknown>,
  render: Record<string, unknown> | null,
) {
  return {
    status: {
      renderCode: render?.code,
      renderStatus: render?.status,
      responseStatus: response.status,
      selectedRawValue: render?.code ?? render?.status ?? response.status,
    },
    progress: {
      renderProgress: render?.progress,
      responseProgress: response.progress,
      selectedRawValue: render?.progress ?? response.progress,
    },
  };
}

function createMediaLabDownloadUrl(
  editId: string,
  outputId: string,
  mediaUrl: string,
  render: Record<string, unknown> | null,
) {
  const output = MVP_OUTPUT_FORMATS.find((format) => format.id === outputId);
  const renderName = typeof render?.name === "string" ? render.name : "";
  const fallbackBase = output
    ? `quote-card-${output.id}`
    : `quote-card-${outputId || "modeck-render"}`;
  const token = registerRenderDownload({
    editId,
    outputId,
    mediaUrl,
    filenameBase: slugify(renderName || fallbackBase),
  });

  return `/api/modeck/render/download?token=${encodeURIComponent(token)}`;
}

function findRenderRecord(response: Record<string, unknown> | null, editId: string) {
  if (!response) {
    return null;
  }

  const candidates = [
    response.renderStatus,
    response.render,
    response.data,
    ...(Array.isArray(response.renders) ? response.renders : []),
    ...(Array.isArray(response.renderData) ? response.renderData : []),
  ];

  return (
    candidates.find(
      (candidate): candidate is Record<string, unknown> =>
        isRecord(candidate) &&
        (candidate.editId === editId || candidate.id === editId || typeof candidate.status === "string"),
    ) ?? null
  );
}

function normalizeStatus(value: unknown) {
  const status = typeof value === "string" ? value.toLowerCase().trim() : "";

  if (
    ["completed", "complete", "done", "success", "succeeded", "ready", "render is ready"].includes(status)
  ) {
    return "completed";
  }

  if (["renrq", "queued", "request received by pc"].includes(status)) {
    return "queued";
  }

  if (["failed", "error", "canceled", "cancelled"].includes(status)) {
    return status === "canceled" || status === "cancelled" ? "canceled" : "failed";
  }

  if (
    ["rendering", "rendering...", "processing", "running", "in_progress", "rendering queued"].includes(status)
  ) {
    return "rendering";
  }

  return "queued";
}

function normalizeProgress(value: unknown, status: string) {
  if (typeof value === "number") {
    return Math.max(0, Math.min(100, value > 1 ? value : value * 100));
  }

  return status === "completed" ? 100 : status === "queued" ? 5 : 50;
}

function extractDownloadUrl(record: Record<string, unknown> | null | undefined) {
  if (!record) {
    return null;
  }

  const candidates = collectDownloadUrlCandidates(record, "record").map((candidate) => candidate.value);

  return candidates.find((candidate): candidate is string => typeof candidate === "string") ?? null;
}

function collectDownloadUrlCandidates(record: Record<string, unknown> | null | undefined, path: string) {
  if (!record) {
    return [];
  }

  const candidates = [
    ...collectDirectDownloadUrlCandidates(record, path),
    ...collectDownloadUrlCandidatesFromArray(record.files, `${path}.files`),
    ...collectDownloadUrlCandidatesFromArray(record.renders, `${path}.renders`),
    ...collectDownloadUrlCandidatesFromArray(record.videoUrls, `${path}.videoUrls`),
  ];

  return candidates.filter((candidate) => typeof candidate.value === "string");
}

function collectAllDownloadUrlCandidates(
  response: Record<string, unknown>,
  renderStatus: Record<string, unknown> | null,
  render: Record<string, unknown> | null,
) {
  const candidates = [
    ...collectDownloadUrlCandidates(response, "response"),
    ...collectDownloadUrlCandidates(renderStatus, "response.renderStatus"),
    ...collectDownloadUrlCandidates(render, "selectedRenderRecord"),
  ];
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = `${candidate.path}:${candidate.value}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function hasDownloadUrl(record: Record<string, unknown> | null | undefined) {
  return Boolean(extractDownloadUrl(record));
}

function collectDirectDownloadUrlCandidates(record: Record<string, unknown>, path: string) {
  const fields = ["temporaryDownloadUrl", "downloadUrl", "url", "link"] as const;

  return fields.map((field) => ({
    path: `${path}.${field}`,
    field,
    value: record[field],
  }));
}

function collectDownloadUrlCandidatesFromArray(value: unknown, path: string) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) =>
    isRecord(item) ? collectDirectDownloadUrlCandidates(item, `${path}[${index}]`) : [],
  );
}

function extractErrorMessage(record: Record<string, unknown> | null | undefined) {
  if (!record) {
    return null;
  }

  const candidates = [record.errorMessage, record.error, record.message, record.info];

  return candidates.find((candidate): candidate is string => typeof candidate === "string") ?? null;
}

function summarizeResponse(response: Record<string, unknown> | string | null) {
  if (!response) {
    return null;
  }

  if (typeof response === "string") {
    return response.slice(0, 1000);
  }

  const renderStatus = getRenderStatusRecord(response);

  return {
    keys: Object.keys(response),
    status: response.status,
    success: response.success,
    info: response.info,
    message: response.message,
    error: response.error,
    renderStatus: renderStatus
      ? {
          keys: Object.keys(renderStatus),
          status: renderStatus.status,
          code: renderStatus.code,
          progress: renderStatus.progress,
          message: renderStatus.message,
          error: renderStatus.error,
          info: renderStatus.info,
          details: renderStatus.details,
          currentlyRendering: renderStatus.currentlyRendering,
          hasDownload: hasDownloadUrl(renderStatus),
        }
      : null,
    renderStatusKeys: renderStatus ? Object.keys(renderStatus) : null,
    renderStatusStatus: renderStatus?.status,
    renderStatusCode: renderStatus?.code,
    renderStatusProgress: renderStatus?.progress,
    renderStatusMessage: renderStatus?.message,
    renderStatusError: renderStatus?.error,
    renderStatusInfo: renderStatus?.info,
    renderStatusDetails: renderStatus?.details,
    renderStatusCurrentlyRendering: renderStatus?.currentlyRendering,
    renderStatusHasDownload: hasDownloadUrl(renderStatus),
    hasDownload: hasDownloadUrl(response) || hasDownloadUrl(renderStatus),
  };
}

function redactDebugValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactDebugValue);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isSecretKey(key) ? "[redacted]" : redactDebugValue(entry),
    ]),
  );
}

function isSecretKey(key: string) {
  return /api[-_]?key|authorization|secret|password|bearer|access[-_]?token|refresh[-_]?token/i.test(key);
}
