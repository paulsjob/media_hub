export type UserRole =
  | "requester"
  | "producer"
  | "approver"
  | "publisher"
  | "designer_admin"
  | "executive_viewer";

export type StoryStatus =
  | "draft"
  | "ready_for_package"
  | "in_production"
  | "in_review"
  | "approved"
  | "published"
  | "archived";

export type PackageStatus =
  | "draft"
  | "generated"
  | "needs_review"
  | "changes_requested"
  | "approved"
  | "ready_to_publish"
  | "published"
  | "archived";

export type RenderJobStatus =
  | "queued"
  | "rendering"
  | "complete"
  | "failed"
  | "canceled";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "changes_requested"
  | "skipped";

export type ApprovalStage = "editorial" | "comms" | "legal" | "final";

export type CaptionPlatform =
  | "x_twitter"
  | "instagram"
  | "facebook"
  | "threads"
  | "tiktok_reels"
  | "youtube_community"
  | "email_newsletter";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team: string;
  avatar_url: string;
  created_at: string;
}

export interface StoryRecord {
  id: string;
  title: string;
  what_happened: string;
  why_it_matters: string;
  primary_messenger: string;
  source_url: string;
  source_type: string;
  source_confidence: "unverified" | "verified" | "high_confidence";
  urgency: "low" | "medium" | "high";
  audience: string;
  topic: string;
  series: string;
  status: StoryStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  version: string;
  description: string;
  template_type: "static" | "motion" | "pack";
  required_fields: string[];
  available_outputs: string[];
  motion_ready: boolean;
  source_file_url: string;
  thumbnail_url: string;
  status: "active" | "draft" | "archived";
  created_at: string;
  updated_at: string;
  best_for: string[];
  performance_tag: "Popular" | "Core" | "Fast" | "New";
}

export interface AssetPackage {
  id: string;
  story_record_id: string;
  template_id: string;
  title: string;
  status: PackageStatus;
  created_by: string;
  approval_route: string[];
  created_at: string;
  updated_at: string;
}

export interface PackageField {
  id: string;
  asset_package_id: string;
  field_name: string;
  field_value: string;
  field_type: "text" | "url" | "image";
  required: boolean;
}

export interface RenderJob {
  id: string;
  asset_package_id: string;
  template_id: string;
  status: RenderJobStatus;
  requested_outputs: string[];
  started_at: string;
  completed_at: string;
  error_message: string | null;
}

export interface OutputFile {
  id: string;
  asset_package_id: string;
  render_job_id: string;
  file_type: "image" | "video" | "zip" | "source";
  format: string;
  ratio: string;
  platform: string;
  file_url: string;
  file_size: string;
  duration: string | null;
  created_at: string;
}

export interface Caption {
  id: string;
  asset_package_id: string;
  platform: CaptionPlatform;
  caption_text: string;
  alt_text: string;
  hashtags: string[];
  status: "draft" | "approved";
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  asset_package_id: string;
  reviewer_id: string;
  review_stage: ApprovalStage;
  status: ApprovalStatus;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceRecord {
  id: string;
  asset_package_id: string;
  platform: string;
  published_url: string;
  impressions: number;
  engagements: number;
  shares: number;
  comments: number;
  saves: number;
  downloads: number;
  engagement_rate: number;
  published_at: string;
  created_at: string;
}

export interface AssetPackageView {
  story: StoryRecord;
  template: Template;
  assetPackage: AssetPackage;
  packageFields: PackageField[];
  renderJob: RenderJob;
  outputFiles: OutputFile[];
  captions: Caption[];
  approvals: Approval[];
  performance: PerformanceRecord[];
  creator: User;
}
