import {
  DELIVERY_OPTIONS,
  DISTRIBUTION_PLATFORMS,
  GUARDRAIL_CARDS,
  LIBRARY_FILTERS,
  NAV_ITEMS,
  PERFORMANCE_INSIGHTS,
  PERFORMANCE_KPIS,
  QUICK_ACTIONS,
  RECOMMENDED_FORMATS,
  SETTINGS_TABS,
  TEMPLATE_FILTERS,
  TOP_NAV_ITEMS,
  type NavigationItem,
  type PlatformDefinition,
} from "./constants";
import { MVP_OUTPUT_FORMATS, type MvpOutputFormat } from "./output-formats";
import {
  approvals,
  assetPackages,
  captions,
  outputFiles,
  packageFields,
  performanceRecords,
  renderJobs,
  storyRecords,
  templates,
  users,
} from "./mock-data";
import type {
  AssetPackage,
  AssetPackageView,
  Caption,
  OutputFile,
  RenderJob,
  StoryRecord,
  Template,
  User,
} from "./types";

export interface MediaLabRepository {
  getNavigationItems(): NavigationItem[];
  getTopNavigationItems(): Array<{ href: string; label: string }>;
  getOutputFormats(): MvpOutputFormat[];
  getDeliveryOptions(): string[];
  getRecommendedFormats(): string[];
  getTemplateFilters(): string[];
  getLibraryFilters(): string[];
  getDistributionPlatforms(): PlatformDefinition[];
  getSettingsTabs(): string[];
  getGuardrailCards(): string[];
  getQuickActions(): Array<{ label: string; href: string }>;
  getPerformanceKpis(): Array<{ label: string; value: string; icon: string }>;
  getPerformanceInsights(): string[];
  getCurrentUser(): User;
  getDashboard(): DashboardData;
  getTemplates(): Template[];
  getTemplate(id: string): Template | undefined;
  getStoryRecords(): StoryRecord[];
  getFeaturedStory(): StoryRecord;
  getAssetPackages(): AssetPackage[];
  getFeaturedAssetPackageView(): AssetPackageView | undefined;
  getAssetPackageView(id: string): AssetPackageView | undefined;
  searchAssetPackages(query: string): AssetPackageView[];
  previewQuoteCardPackage(): GeneratedPackagePreview;
}

export interface DashboardData {
  stats: {
    openOpportunities: number;
    packagesInReview: number;
    readyToPublish: number;
    publishedToday: number;
  };
  opportunities: StoryRecord[];
  templates: Template[];
  recentPackages: AssetPackageView[];
  topFormats: Array<{ name: string; lift: string }>;
}

export interface GeneratedPackagePreview {
  story: StoryRecord;
  template: Template;
  packageDraft: AssetPackage;
  renderJob: RenderJob;
  outputFiles: OutputFile[];
  captions: Caption[];
}

class MockMediaLabRepository implements MediaLabRepository {
  getNavigationItems(): NavigationItem[] {
    return NAV_ITEMS;
  }

  getTopNavigationItems(): Array<{ href: string; label: string }> {
    return TOP_NAV_ITEMS;
  }

  getOutputFormats(): MvpOutputFormat[] {
    return MVP_OUTPUT_FORMATS;
  }

  getDeliveryOptions(): string[] {
    return DELIVERY_OPTIONS;
  }

  getRecommendedFormats(): string[] {
    return RECOMMENDED_FORMATS;
  }

  getTemplateFilters(): string[] {
    return TEMPLATE_FILTERS;
  }

  getLibraryFilters(): string[] {
    return LIBRARY_FILTERS;
  }

  getDistributionPlatforms(): PlatformDefinition[] {
    return DISTRIBUTION_PLATFORMS;
  }

  getSettingsTabs(): string[] {
    return SETTINGS_TABS;
  }

  getGuardrailCards(): string[] {
    return GUARDRAIL_CARDS;
  }

  getQuickActions(): Array<{ label: string; href: string }> {
    return QUICK_ACTIONS;
  }

  getPerformanceKpis(): Array<{ label: string; value: string; icon: string }> {
    return PERFORMANCE_KPIS;
  }

  getPerformanceInsights(): string[] {
    return PERFORMANCE_INSIGHTS;
  }

  getCurrentUser(): User {
    return users[0];
  }

  getDashboard(): DashboardData {
    return {
      stats: {
        openOpportunities: 14,
        packagesInReview: 8,
        readyToPublish: 11,
        publishedToday: 27,
      },
      opportunities: storyRecords,
      templates: templates.slice(0, 6),
      recentPackages: assetPackages
        .map((assetPackage) => this.getAssetPackageView(assetPackage.id))
        .filter((view): view is AssetPackageView => Boolean(view)),
      topFormats: [
        { name: "Quote Card V.2", lift: "+48%" },
        { name: "Clip Packaging Pack", lift: "+37%" },
        { name: "Contrast Card", lift: "+29%" },
        { name: "In Your State Card", lift: "+21%" },
      ],
    };
  }

  getTemplates(): Template[] {
    return templates;
  }

  getTemplate(id: string): Template | undefined {
    return templates.find((template) => template.id === id);
  }

  getStoryRecords(): StoryRecord[] {
    return storyRecords;
  }

  getFeaturedStory(): StoryRecord {
    return storyRecords[0];
  }

  getAssetPackages(): AssetPackage[] {
    return assetPackages;
  }

  getFeaturedAssetPackageView(): AssetPackageView | undefined {
    return this.getAssetPackageView(assetPackages[0]?.id ?? "");
  }

  searchAssetPackages(query: string): AssetPackageView[] {
    const normalizedQuery = query.trim().toLowerCase();

    return assetPackages
      .map((assetPackage) => this.getAssetPackageView(assetPackage.id))
      .filter((view): view is AssetPackageView => Boolean(view))
      .filter((view) => {
        if (!normalizedQuery) {
          return true;
        }

        const searchableText = [
          view.assetPackage.title,
          view.template.name,
          view.story.series,
          view.story.primary_messenger,
          view.story.topic,
          view.assetPackage.status,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      });
  }

  getAssetPackageView(id: string): AssetPackageView | undefined {
    const assetPackage = assetPackages.find((item) => item.id === id);
    if (!assetPackage) {
      return undefined;
    }

    const story = storyRecords.find((item) => item.id === assetPackage.story_record_id);
    const template = templates.find((item) => item.id === assetPackage.template_id);
    const renderJob = renderJobs.find((item) => item.asset_package_id === assetPackage.id);
    const creator = users.find((user) => user.id === assetPackage.created_by);

    if (!story || !template || !renderJob || !creator) {
      return undefined;
    }

    return {
      story,
      template,
      assetPackage,
      packageFields: packageFields.filter((field) => field.asset_package_id === assetPackage.id),
      renderJob,
      outputFiles: outputFiles.filter((file) => file.asset_package_id === assetPackage.id),
      captions: captions.filter((caption) => caption.asset_package_id === assetPackage.id),
      approvals: approvals.filter((approval) => approval.asset_package_id === assetPackage.id),
      performance: performanceRecords.filter((record) => record.asset_package_id === assetPackage.id),
      creator,
    };
  }

  previewQuoteCardPackage(): GeneratedPackagePreview {
    const story = storyRecords[0];
    const template = templates.find((item) => item.id === "template-quote-card-v2") ?? templates[0];
    const packageDraft = assetPackages[0];
    const renderJob = renderJobs[0];

    return {
      story,
      template,
      packageDraft,
      renderJob,
      outputFiles: outputFiles.filter((file) => file.asset_package_id === packageDraft.id),
      captions: captions.filter((caption) => caption.asset_package_id === packageDraft.id),
    };
  }
}

export const mediaLab = new MockMediaLabRepository();
