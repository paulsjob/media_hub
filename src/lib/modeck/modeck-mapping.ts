import { MVP_OUTPUT_FORMATS } from "@/lib/output-formats";

import type {
  MediaLabModeckPayload,
  ModeckMediaReference,
  ModeckOptionValue,
  ModeckPreviewRequest,
  ModeckRenderRequest,
  ModeckTemplateMapping,
} from "./types";

export const QUOTE_CARD_MODECK_MAPPING: ModeckTemplateMapping = {
  templateId: "template-quote-card-v2",
  deckName: "Quote Card",
  fieldMappings: [
    {
      mediaLabFieldId: "quote",
      modeckOptionName: "Quote Text",
      optionType: "multiline_text",
      required: true,
    },
    {
      mediaLabFieldId: "speakerName",
      modeckOptionName: "Speaker Name",
      optionType: "text",
      required: true,
    },
    {
      mediaLabFieldId: "speakerTitle",
      modeckOptionName: "Speaker Title",
      optionType: "text",
      required: true,
    },
    {
      mediaLabFieldId: "contextLine",
      modeckOptionName: "Context Line",
      optionType: "text",
      required: true,
    },
    {
      mediaLabFieldId: "brand",
      modeckOptionName: "BRAND",
      optionType: "text",
      required: false,
    },
    {
      mediaLabFieldId: "headshot",
      modeckOptionName: "Headshot",
      optionType: "media_replacement",
      required: true,
    },
  ],
  mogrtMappings: [
    { ratio: "16:9", mogrtName: "QuoteCard_16x9" },
    { ratio: "1:1", mogrtName: "QuoteCard_1x1" },
    { ratio: "4:5", mogrtName: "QuoteCard_4x5" },
    { ratio: "9:16", mogrtName: "QuoteCard_9x16" },
  ],
  outputFormatIds: MVP_OUTPUT_FORMATS.map((output) => output.id),
};

export const MODECK_TEMPLATE_MAPPINGS = [QUOTE_CARD_MODECK_MAPPING];

export function getModeckTemplateMapping(templateId: string) {
  return MODECK_TEMPLATE_MAPPINGS.find((mapping) => mapping.templateId === templateId) ?? null;
}

export function getModeckMogrtName(templateId: string, ratio: string) {
  const mapping = getModeckTemplateMapping(templateId);
  return mapping?.mogrtMappings.find((mogrt) => mogrt.ratio === ratio)?.mogrtName ?? null;
}

export function getModeckPreviewRatios(selectedOutputIds: string[]) {
  const selectedOutputs = MVP_OUTPUT_FORMATS.filter((output) => selectedOutputIds.includes(output.id));
  return Array.from(new Set(selectedOutputs.map((output) => output.aspectLabel)));
}

export function mediaLabPayloadToModeckPreviewRequest(
  payload: MediaLabModeckPayload,
): ModeckPreviewRequest[] {
  const mapping = requireMapping(payload.templateId);
  const selectedOutputs = MVP_OUTPUT_FORMATS.filter((output) => payload.selectedOutputIds.includes(output.id));
  const ratios = getModeckPreviewRatios(payload.selectedOutputIds);

  return ratios.map((ratio) => {
    const representativeOutput = selectedOutputs.find((output) => output.aspectLabel === ratio);
    const mogrtName = getRequiredMogrtName(mapping, ratio);

    if (!representativeOutput) {
      throw new Error(`No selected output found for preview ratio ${ratio}.`);
    }

    return {
      deckName: mapping.deckName,
      mogrtName,
      templateId: payload.templateId,
      packageName: payload.packageName,
      ratio,
      width: representativeOutput.width,
      height: representativeOutput.height,
      previewFrame: payload.previewFrame ?? 0,
      options: mapFieldOptions(mapping, payload),
      media: mapMediaReferences(mapping, payload),
      editId: payload.editId,
    };
  });
}

export function mediaLabPayloadToModeckRenderRequest(payload: MediaLabModeckPayload): ModeckRenderRequest[] {
  const mapping = requireMapping(payload.templateId);
  const selectedOutputs = MVP_OUTPUT_FORMATS.filter((output) => payload.selectedOutputIds.includes(output.id));

  return selectedOutputs.map((output) => ({
    deckName: mapping.deckName,
    mogrtName: getRequiredMogrtName(mapping, output.aspectLabel),
    templateId: payload.templateId,
    packageName: payload.packageName,
    output,
    options: mapFieldOptions(mapping, payload),
    media: mapMediaReferences(mapping, payload),
    editId: payload.editId,
  }));
}

function requireMapping(templateId: string) {
  const mapping = getModeckTemplateMapping(templateId);

  if (!mapping) {
    throw new Error(`No MoDeck mapping exists for template ${templateId}.`);
  }

  return mapping;
}

function getRequiredMogrtName(mapping: ModeckTemplateMapping, ratio: string) {
  const mogrtName = mapping.mogrtMappings.find((mogrt) => mogrt.ratio === ratio)?.mogrtName;

  if (!mogrtName) {
    throw new Error(`No MoDeck MOGRT mapping exists for ratio ${ratio}.`);
  }

  return mogrtName;
}

function mapFieldOptions(mapping: ModeckTemplateMapping, payload: MediaLabModeckPayload): ModeckOptionValue[] {
  return mapping.fieldMappings
    .filter((field) => field.optionType !== "media_replacement")
    .map((field) => ({
      name: field.modeckOptionName,
      type: field.optionType,
      value: payload.fields[field.mediaLabFieldId] ?? "",
    }));
}

function mapMediaReferences(
  mapping: ModeckTemplateMapping,
  payload: MediaLabModeckPayload,
): ModeckMediaReference[] | undefined {
  const media = mapping.fieldMappings
    .filter((field) => field.optionType === "media_replacement")
    .map((field) => ({
      fieldId: field.mediaLabFieldId,
      optionName: field.modeckOptionName,
      mediaLabReference:
        payload.mediaReferences?.[field.mediaLabFieldId] ?? payload.fields[field.mediaLabFieldId] ?? "",
      uploadedFilename: payload.mediaReferences?.[`${field.mediaLabFieldId}UploadedFilename`],
    }))
    .filter((reference) => reference.mediaLabReference);

  return media.length > 0 ? media : undefined;
}
