export type MvpOutputType = "still" | "video";

export interface MvpOutputFormat {
  id: string;
  label: string;
  type: MvpOutputType;
  width: number;
  height: number;
  aspectLabel: string;
  recommendedPlatforms: string[];
}

const sizes = [
  {
    key: "1920x1080",
    label: "1920x1080",
    width: 1920,
    height: 1080,
    aspectLabel: "16:9",
    recommendedPlatforms: ["Broadcast", "YouTube", "Web"],
  },
  {
    key: "1080x1080",
    label: "1080x1080",
    width: 1080,
    height: 1080,
    aspectLabel: "1:1",
    recommendedPlatforms: ["Instagram", "Facebook", "LinkedIn"],
  },
  {
    key: "1080x1350",
    label: "1080x1350",
    width: 1080,
    height: 1350,
    aspectLabel: "4:5",
    recommendedPlatforms: ["Instagram Feed", "Facebook"],
  },
  {
    key: "1080x1920",
    label: "1080x1920",
    width: 1080,
    height: 1920,
    aspectLabel: "9:16",
    recommendedPlatforms: ["Stories", "Reels", "TikTok", "Shorts"],
  },
];

export const MVP_OUTPUT_FORMATS: MvpOutputFormat[] = [
  ...sizes.map((size) => ({
    id: `still-${size.key}`,
    label: size.label,
    type: "still" as const,
    width: size.width,
    height: size.height,
    aspectLabel: size.aspectLabel,
    recommendedPlatforms: size.recommendedPlatforms,
  })),
  ...sizes.map((size) => ({
    id: `video-${size.key}`,
    label: size.label,
    type: "video" as const,
    width: size.width,
    height: size.height,
    aspectLabel: size.aspectLabel,
    recommendedPlatforms: size.recommendedPlatforms,
  })),
];
