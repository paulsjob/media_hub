import { randomUUID } from "node:crypto";

interface RenderDownloadRecord {
  editId: string;
  outputId: string;
  mediaUrl: string;
  filenameBase: string;
  createdAt: number;
}

const STORE_TTL_MS = 1000 * 60 * 60 * 2;

const globalStore = globalThis as typeof globalThis & {
  __mediaLabModeckRenderDownloads?: Map<string, RenderDownloadRecord>;
};

const renderDownloads =
  globalStore.__mediaLabModeckRenderDownloads ??
  new Map<string, RenderDownloadRecord>();

globalStore.__mediaLabModeckRenderDownloads = renderDownloads;

export function registerRenderDownload(record: Omit<RenderDownloadRecord, "createdAt">) {
  pruneRenderDownloads();

  const token = randomUUID();
  renderDownloads.set(token, {
    ...record,
    createdAt: Date.now(),
  });

  return token;
}

export function getRenderDownload(token: string) {
  pruneRenderDownloads();
  return renderDownloads.get(token) ?? null;
}

function pruneRenderDownloads() {
  const cutoff = Date.now() - STORE_TTL_MS;

  for (const [token, record] of renderDownloads) {
    if (record.createdAt < cutoff) {
      renderDownloads.delete(token);
    }
  }
}
