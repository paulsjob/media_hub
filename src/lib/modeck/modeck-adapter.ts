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

export interface ModeckAdapter {
  listDecks(): Promise<ModeckDeckSummary[]>;
  getDeck(deckName: string): Promise<ModeckDeck | null>;
  getMogrt(deckName: string, mogrtName: string): Promise<ModeckMogrt | null>;
  requestPreview(payload: ModeckPreviewRequest): Promise<ModeckPreviewResponse>;
  requestRender(payload: ModeckRenderRequest): Promise<ModeckRenderResponse>;
  getRenderStatus(editId: string): Promise<ModeckRenderStatusResponse>;
  listRenders(payload: ModeckListRendersRequest): Promise<ModeckListRendersResponse>;
  uploadMedia(payload: ModeckUploadMediaRequest): Promise<ModeckUploadMediaResponse>;
  refreshApps(): Promise<ModeckRefreshAppsResponse>;
}
