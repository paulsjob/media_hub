import type { MvpOutputFormat } from "./output-formats";

export interface PreviewRatio {
  key: string;
  aspectLabel: string;
  width: number;
  height: number;
  outputIds: string[];
}

export interface PreviewContent {
  quote: string;
  speakerName: string;
  speakerTitle: string;
  contextLine: string;
  headshot: string;
  headshotPreviewUrl?: string;
  brand?: string;
}

export type PreviewStatusState = "idle" | "updating" | "updated" | "error";

export function getUniquePreviewRatios(
  outputs: MvpOutputFormat[],
  selectedOutputIds: string[],
): PreviewRatio[] {
  const ratios = new Map<string, PreviewRatio>();

  outputs
    .filter((output) => selectedOutputIds.includes(output.id))
    .forEach((output) => {
      const key = output.aspectLabel;
      const existing = ratios.get(key);

      if (existing) {
        existing.outputIds.push(output.id);
        return;
      }

      ratios.set(key, {
        key,
        aspectLabel: output.aspectLabel,
        width: output.width,
        height: output.height,
        outputIds: [output.id],
      });
    });

  return Array.from(ratios.values());
}
