import {
  getModeckApiConfig,
  isRecord,
  parseJsonObject,
} from "@/lib/modeck/quote-box-test";

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

  return Response.json({
    ok: true,
    ...normalized,
    responseSummary: summarizeResponse(responseJson ?? responseText),
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
  const status = normalizeStatus(render?.code ?? render?.status ?? response?.status);
  const progress = normalizeProgress(render?.progress ?? response?.progress, status);
  const downloadUrl = extractDownloadUrl(render) ?? extractDownloadUrl(response);
  const errorMessage = extractErrorMessage(render) ?? extractErrorMessage(response);

  return {
    editId,
    outputId,
    status,
    progress,
    temporaryDownloadUrl: downloadUrl,
    errorMessage,
  };
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
  const status = typeof value === "string" ? value.toLowerCase() : "";

  if (
    ["completed", "complete", "done", "success", "succeeded", "ready", "render is ready"].includes(status)
  ) {
    return "completed";
  }

  if (["failed", "error", "canceled", "cancelled"].includes(status)) {
    return status === "canceled" || status === "cancelled" ? "canceled" : "failed";
  }

  if (["rendering", "processing", "running", "in_progress", "rendering queued"].includes(status)) {
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

  const files = Array.isArray(record.files) ? record.files : [];
  const renders = Array.isArray(record.renders) ? record.renders : [];
  const videoUrls = Array.isArray(record.videoUrls) ? record.videoUrls : [];
  const candidates = [
    record.temporaryDownloadUrl,
    record.downloadUrl,
    record.url,
    record.link,
    ...files.flatMap((file) =>
      isRecord(file) ? [file.temporaryDownloadUrl, file.downloadUrl, file.url, file.link] : [],
    ),
    ...renders.flatMap((render) =>
      isRecord(render) ? [render.temporaryDownloadUrl, render.downloadUrl, render.url, render.link] : [],
    ),
    ...videoUrls.flatMap((video) =>
      isRecord(video) ? [video.temporaryDownloadUrl, video.downloadUrl, video.url, video.link] : [],
    ),
  ];

  return candidates.find((candidate): candidate is string => typeof candidate === "string") ?? null;
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

  return {
    keys: Object.keys(response),
    status: response.status,
    success: response.success,
    info: response.info,
    message: response.message,
    error: response.error,
    hasDownload: Boolean(extractDownloadUrl(response) ?? extractDownloadUrl(getRenderStatusRecord(response))),
  };
}
