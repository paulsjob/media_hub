import type { MvpOutputFormat } from "@/lib/output-formats";

export type ModeckOptionType = "text" | "multiline_text" | "media_replacement";

export type ModeckRenderStatus = "queued" | "rendering" | "completed" | "failed" | "canceled";

export interface ModeckDeckSummary {
  name: string;
  displayName: string;
  mogrtNames: string[];
}

export interface ModeckDeck extends ModeckDeckSummary {
  description: string;
  mogrts: ModeckMogrt[];
}

export interface ModeckMogrt {
  name: string;
  ratio: string;
  width: number;
  height: number;
  options: ModeckOption[];
}

export interface ModeckOption {
  name: string;
  type: ModeckOptionType;
  required: boolean;
  defaultValue?: string;
}

export interface ModeckOptionValue {
  name: string;
  type: ModeckOptionType;
  value: string;
}

export interface ModeckMediaReference {
  fieldId: string;
  optionName: string;
  mediaLabReference: string;
  uploadedFilename?: string;
}

export interface ModeckPreviewRequest {
  deckName: string;
  mogrtName: string;
  templateId: string;
  packageName: string;
  ratio: string;
  width: number;
  height: number;
  previewFrame: number;
  options: ModeckOptionValue[];
  globalOptions?: Record<string, string>;
  media?: ModeckMediaReference[];
  editId?: string;
}

export interface ModeckPreviewResponse {
  editId: string;
  imageBase64: string;
  ratio: string;
  width: number;
  height: number;
  generatedAt: string;
}

export interface ModeckRenderRequest {
  deckName: string;
  mogrtName: string;
  templateId: string;
  packageName: string;
  output: MvpOutputFormat;
  options: ModeckOptionValue[];
  globalOptions?: Record<string, string>;
  media?: ModeckMediaReference[];
  editId?: string;
}

export interface ModeckRenderResponse {
  editId: string;
  status: ModeckRenderStatus;
  outputId: string;
}

export interface ModeckRenderFile {
  outputId: string;
  filename: string;
  contentType: string;
  temporaryDownloadUrl: string;
  width: number;
  height: number;
  ratio: string;
}

export interface ModeckRenderStatusResponse {
  editId: string;
  status: ModeckRenderStatus;
  progress: number;
  files: ModeckRenderFile[];
  errorMessage?: string;
}

export interface ModeckListRendersRequest {
  packageName?: string;
  editIds?: string[];
}

export interface ModeckListRendersResponse {
  renders: ModeckRenderStatusResponse[];
}

export interface ModeckUploadMediaRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
  mediaLabReference?: string;
}

export interface ModeckUploadMediaResponse {
  uploadUrl: string;
  uploadedFilename: string;
  expiresAt: string;
}

export interface ModeckRefreshAppsResponse {
  success: boolean;
  refreshedAt: string;
}

export interface MediaLabModeckPayload {
  templateId: string;
  packageName: string;
  fields: Record<string, string>;
  selectedOutputIds: string[];
  mediaReferences?: Record<string, string>;
  previewFrame?: number;
  editId?: string;
}

export interface ModeckFieldMapping {
  mediaLabFieldId: string;
  modeckOptionName: string;
  optionType: ModeckOptionType;
  required: boolean;
}

export interface ModeckMogrtMapping {
  ratio: string;
  mogrtName: string;
}

export interface ModeckTemplateMapping {
  templateId: string;
  deckName: string;
  fieldMappings: ModeckFieldMapping[];
  mogrtMappings: ModeckMogrtMapping[];
  outputFormatIds: string[];
}
