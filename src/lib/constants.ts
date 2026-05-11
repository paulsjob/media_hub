import type { PackageStatus, StoryRecord } from "./types";

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  count?: number;
}

export interface OutputFormatDefinition {
  id: string;
  label: string;
  ratio: string;
  format: string;
  kind: "image" | "video" | "zip" | "source";
  platform: string;
}

export interface PlatformDefinition {
  id: string;
  label: string;
  ratio: string;
  selected: boolean;
}

export interface StatusDefinition {
  label: string;
  tone: "neutral" | "info" | "warning" | "success";
}

export const NAV_ITEMS: NavigationItem[] = [
  { href: "/generate", label: "Generate", icon: "GN" },
];

export const TOP_NAV_ITEMS = [
  { href: "/generate", label: "Generate" },
];

export const OUTPUT_FORMATS: OutputFormatDefinition[] = [
  { id: "16-9-png", label: "16:9 PNG", ratio: "16:9", format: "PNG", kind: "image", platform: "All" },
  { id: "1-1-png", label: "1:1 PNG", ratio: "1:1", format: "PNG", kind: "image", platform: "Instagram" },
  { id: "9-16-png", label: "9:16 PNG", ratio: "9:16", format: "PNG", kind: "image", platform: "Stories" },
  { id: "16-9-mp4", label: "16:9 MP4", ratio: "16:9", format: "MP4", kind: "video", platform: "YouTube" },
  { id: "1-1-mp4", label: "1:1 MP4", ratio: "1:1", format: "MP4", kind: "video", platform: "Instagram" },
  { id: "9-16-mp4", label: "9:16 MP4", ratio: "9:16", format: "MP4", kind: "video", platform: "TikTok / Reels" },
];

export const DELIVERY_OPTIONS = ["Caption Pack", "Alt Text", "Archive Metadata", "Send To Approval"];

export const RECOMMENDED_FORMATS = ["Quote Card", "Clip Pack", "What Happened", "Stat Card"];

export const TEMPLATE_FILTERS = ["All", "Static", "Motion", "Top Performing", "New"];

export const LIBRARY_FILTERS = ["Template", "Series", "Status"];

export const SETTINGS_TABS = [
  "Brand Guidelines",
  "Content Rules",
  "Approval Rules",
  "Disclaimers",
  "Sources",
];

export const GUARDRAIL_CARDS = [
  "Brand Standards",
  "Content Rules",
  "Legal & Compliance",
  "Source Requirements",
  "Restricted Content",
  "Usage Rules",
];

export const DISTRIBUTION_PLATFORMS: PlatformDefinition[] = [
  { id: "x-twitter", label: "X / Twitter", ratio: "1:1 (1080x1080)", selected: true },
  { id: "instagram-feed", label: "Instagram Feed", ratio: "1:1 (1080x1080)", selected: true },
  { id: "instagram-story", label: "Instagram Story", ratio: "9:16 (1080x1920)", selected: true },
  { id: "tiktok-reels", label: "TikTok / Reels", ratio: "9:16 (1080x1920)", selected: true },
  { id: "facebook", label: "Facebook", ratio: "1:1 (1080x1080)", selected: false },
];

export const QUICK_ACTIONS = [
  { label: "Generate Graphics", href: "/generate" },
];

export const PERFORMANCE_INSIGHTS = [
  "Quote Cards are driving highest engagement.",
  "Best posting window is 9:00 AM to 11:00 AM.",
  "Democracy and health care topics are outperforming baseline.",
];

export const PERFORMANCE_KPIS = [
  { label: "Engagements", value: "42K", icon: "EN" },
  { label: "Impressions", value: "986K", icon: "IM" },
  { label: "Shares", value: "11K", icon: "SH" },
  { label: "Rate", value: "4.2%", icon: "%" },
  { label: "Downloads", value: "221", icon: "DL" },
];

export const STATUS_DEFINITIONS: Record<string, StatusDefinition> = {
  draft: { label: "Draft", tone: "neutral" },
  ready_for_package: { label: "Ready", tone: "info" },
  in_production: { label: "In Production", tone: "info" },
  in_review: { label: "Needs Review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
  generated: { label: "Generated", tone: "info" },
  needs_review: { label: "Needs Review", tone: "warning" },
  changes_requested: { label: "Changes Requested", tone: "warning" },
  ready_to_publish: { label: "Ready", tone: "info" },
  Popular: { label: "Popular", tone: "success" },
  Core: { label: "Core", tone: "info" },
  Fast: { label: "Fast", tone: "success" },
  New: { label: "New", tone: "info" },
};

export function getStatusDefinition(status: PackageStatus | StoryRecord["status"] | string) {
  return STATUS_DEFINITIONS[status] ?? {
    label: status.replaceAll("_", " "),
    tone: "neutral" as const,
  };
}
