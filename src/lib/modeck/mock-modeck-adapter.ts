import { MVP_OUTPUT_FORMATS } from "@/lib/output-formats";

import type { ModeckAdapter } from "./modeck-adapter";
import { QUOTE_CARD_MODECK_MAPPING } from "./modeck-mapping";
import type {
  ModeckDeck,
  ModeckDeckSummary,
  ModeckListRendersRequest,
  ModeckListRendersResponse,
  ModeckMogrt,
  ModeckPreviewRequest,
  ModeckPreviewResponse,
  ModeckRefreshAppsResponse,
  ModeckRenderRequest,
  ModeckRenderResponse,
  ModeckRenderStatusResponse,
  ModeckUploadMediaRequest,
  ModeckUploadMediaResponse,
} from "./types";

const MOCK_PREVIEW_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lZr4nQAAAABJRU5ErkJggg==";

const quoteCardMogrts: ModeckMogrt[] = QUOTE_CARD_MODECK_MAPPING.mogrtMappings.map((mogrt) => {
  const output = MVP_OUTPUT_FORMATS.find((format) => format.aspectLabel === mogrt.ratio);

  return {
    name: mogrt.mogrtName,
    ratio: mogrt.ratio,
    width: output?.width ?? 1920,
    height: output?.height ?? 1080,
    options: QUOTE_CARD_MODECK_MAPPING.fieldMappings.map((field) => ({
      name: field.modeckOptionName,
      type: field.optionType,
      required: field.required,
    })),
  };
});

const quoteCardDeck: ModeckDeck = {
  name: QUOTE_CARD_MODECK_MAPPING.deckName,
  displayName: "Quote Card",
  description: "Mock MoDeck deck metadata for MEDIA LAB Quote Card rendering.",
  mogrtNames: quoteCardMogrts.map((mogrt) => mogrt.name),
  mogrts: quoteCardMogrts,
};

export class MockModeckAdapter implements ModeckAdapter {
  async listDecks(): Promise<ModeckDeckSummary[]> {
    return [
      {
        name: quoteCardDeck.name,
        displayName: quoteCardDeck.displayName,
        mogrtNames: quoteCardDeck.mogrtNames,
      },
    ];
  }

  async getDeck(deckName: string): Promise<ModeckDeck | null> {
    return deckName === quoteCardDeck.name ? quoteCardDeck : null;
  }

  async getMogrt(deckName: string, mogrtName: string): Promise<ModeckMogrt | null> {
    if (deckName !== quoteCardDeck.name) {
      return null;
    }

    return quoteCardDeck.mogrts.find((mogrt) => mogrt.name === mogrtName) ?? null;
  }

  async requestPreview(payload: ModeckPreviewRequest): Promise<ModeckPreviewResponse> {
    return {
      editId: payload.editId ?? createMockEditId(payload.packageName, payload.ratio),
      imageBase64: MOCK_PREVIEW_BASE64,
      ratio: payload.ratio,
      width: payload.width,
      height: payload.height,
      generatedAt: new Date().toISOString(),
    };
  }

  async requestRender(payload: ModeckRenderRequest): Promise<ModeckRenderResponse> {
    const editId = payload.editId ?? createMockEditId(payload.packageName, payload.output.id);

    return {
      editId,
      status: "completed",
      outputId: payload.output.id,
      files: [createMockRenderFile(editId, payload.output)],
    };
  }

  async getRenderStatus(editId: string): Promise<ModeckRenderStatusResponse> {
    return {
      editId,
      status: "completed",
      progress: 100,
      files: [createMockRenderFile(editId, inferOutputFromEditId(editId))],
    };
  }

  async listRenders(payload: ModeckListRendersRequest): Promise<ModeckListRendersResponse> {
    const editIds = payload.editIds?.length ? payload.editIds : [createMockEditId(payload.packageName ?? "package", "render")];
    const renders = await Promise.all(editIds.map((editId) => this.getRenderStatus(editId)));

    return { renders };
  }

  async uploadMedia(payload: ModeckUploadMediaRequest): Promise<ModeckUploadMediaResponse> {
    const safeFilename = payload.filename.replaceAll(" ", "-").toLowerCase();

    return {
      uploadUrl: `https://mock.modeck.local/uploads/${safeFilename}`,
      uploadedFilename: `mock-upload-${safeFilename}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async refreshApps(): Promise<ModeckRefreshAppsResponse> {
    return {
      success: true,
      refreshedAt: new Date().toISOString(),
    };
  }
}

export const mockModeckAdapter = new MockModeckAdapter();

function createMockEditId(packageName: string, suffix: string) {
  return `mock-edit-${slugify(packageName)}-${slugify(suffix)}`;
}

function createMockRenderFile(editId: string, output: (typeof MVP_OUTPUT_FORMATS)[number]) {
  return {
    outputId: output.id,
    filename: `quote-card-${output.id}.${output.type === "video" ? "mp4" : "png"}`,
    contentType: output.type === "video" ? "video/mp4" : "image/png",
    temporaryDownloadUrl: `https://mock.modeck.local/renders/${editId}/${output.id}`,
    width: output.width,
    height: output.height,
    ratio: output.aspectLabel,
  };
}

function inferOutputFromEditId(editId: string) {
  return (
    MVP_OUTPUT_FORMATS.find((output) => editId.endsWith(slugify(output.id))) ??
    MVP_OUTPUT_FORMATS[0]
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
