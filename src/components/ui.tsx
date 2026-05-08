import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { getStatusDefinition } from "@/lib/constants";
import type { MvpOutputFormat } from "@/lib/output-formats";
import type { AssetPackageView, PackageStatus, StoryRecord, Template } from "@/lib/types";

const focusState =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--flame)]";

const buttonBase =
  `inline-flex min-h-10 items-center justify-center border px-4 text-sm font-bold uppercase tracking-wide transition ${focusState}`;

const chipBase =
  `chip transition ${focusState}`;

export function PageHeader({
  eyebrow,
  title,
  accent,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 border-b border-[var(--navy-blue)] pb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-4xl">
        {eyebrow ? (
          <p className="mb-2 inline-block bg-[var(--powder-blue)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--navy-blue)]">{eyebrow}</p>
        ) : null}
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--navy-blue)] md:text-6xl">
          {title} {accent ? <span className="text-[var(--flame)]">{accent}</span> : null}
        </h1>
        <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[var(--black)]">{subtitle}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  children,
  action,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-[var(--silver)] bg-[var(--white)] p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between border-b border-[var(--silver)] pb-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--navy-blue)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  rightContent,
  compact = false,
  className = "",
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  rightContent?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className={`group border border-[var(--silver)] bg-[var(--white)] [&>summary::-webkit-details-marker]:hidden ${
        compact ? "p-3" : "p-5"
      } ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold uppercase tracking-wide text-[var(--navy-blue)]">
        <span>{title}</span>
        <span className="flex shrink-0 items-center gap-3">
          {rightContent}
          <span className="text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true">
            &gt;
          </span>
        </span>
      </summary>
      <div className={compact ? "mt-3" : "mt-4"}>{children}</div>
    </details>
  );
}

export type StatusPillLabel =
  | "Ready"
  | "Rendering"
  | "Render unavailable"
  | "File unavailable"
  | "Downloaded"
  | "Not connected"
  | "Preview ready"
  | "Preview approved";

export function StatusPill({ label }: { label: StatusPillLabel }) {
  const toneClass = {
    Ready: "bg-[var(--powder-blue)] text-[var(--navy-blue)] ring-[var(--silver)]",
    Downloaded: "bg-[var(--navy-blue)] text-white ring-[var(--navy-blue)]",
    "Preview ready": "bg-[var(--powder-blue)] text-[var(--navy-blue)] ring-[var(--silver)]",
    "Preview approved": "bg-[var(--navy-blue)] text-white ring-[var(--navy-blue)]",
    Rendering: "bg-[var(--powder-blue)] text-[var(--navy-blue)] ring-[var(--silver)]",
    "Not connected": "bg-[var(--light-gray)] text-[var(--slate-blue)] ring-[var(--silver)]",
    "Render unavailable": "bg-[var(--flame)] text-white ring-[var(--flame)]",
    "File unavailable": "bg-[var(--flame)] text-white ring-[var(--flame)]",
  }[label];

  const iconName = {
    Ready: "check",
    Downloaded: "check",
    "Preview ready": "check",
    "Preview approved": "check",
    Rendering: "refresh",
    "Not connected": "warning",
    "Render unavailable": "warning",
    "File unavailable": "warning",
  }[label] as "check" | "refresh" | "warning";

  return (
    <span className={`chip gap-1.5 ring-1 ${toneClass}`}>
      <Icon name={iconName} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function PrimaryButton({
  href,
  children,
  className = "",
  disabled = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${buttonBase} cursor-not-allowed gap-2 border-[var(--silver)] bg-[var(--silver)] !text-white ${className}`}
      >
        <span className="text-white">{children}</span>
        <span className="text-white" aria-hidden="true">
          -&gt;
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${buttonBase} gap-2 border-[var(--flame)] bg-[var(--flame)] !text-white hover:border-[var(--navy-blue)] hover:bg-[var(--navy-blue)] hover:!text-white active:bg-[var(--navy-blue)] active:!text-white ${className}`}
      style={{ color: "#ffffff" }}
    >
      <span className="text-white">{children}</span>
      <span className="text-white" aria-hidden="true">
        -&gt;
      </span>
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${buttonBase} border-[var(--navy-blue)] bg-[var(--white)] text-[var(--navy-blue)] hover:border-[var(--flame)] hover:text-[var(--flame)] active:bg-[var(--light-gray)] ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${buttonBase} border-transparent bg-transparent text-[var(--navy-blue)] hover:border-[var(--flame)] hover:text-[var(--flame)] active:bg-[var(--light-gray)] ${className}`}
    >
      {children}
    </Link>
  );
}

export function ButtonLike({
  children,
  variant = "secondary",
  className = "",
  type = "button",
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const variantClass =
    variant === "primary"
      ? "border-[var(--flame)] bg-[var(--flame)] !text-white hover:border-[var(--navy-blue)] hover:bg-[var(--navy-blue)] hover:!text-white active:bg-[var(--navy-blue)] active:!text-white"
      : variant === "ghost"
        ? "border-transparent bg-transparent text-[var(--navy-blue)] hover:border-[var(--flame)] hover:text-[var(--flame)] active:bg-[var(--light-gray)]"
        : "border-[var(--navy-blue)] bg-[var(--white)] text-[var(--navy-blue)] hover:border-[var(--flame)] hover:text-[var(--flame)] active:bg-[var(--light-gray)]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonBase} ${variantClass} ${disabled ? "cursor-not-allowed opacity-60" : ""} ${className}`}
      style={variant === "primary" ? { color: "#ffffff" } : undefined}
    >
      {children}
    </button>
  );
}

export const PrimaryActionButton = PrimaryButton;

export function MvpShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--light-gray)] px-5 py-6 text-[var(--black)]">
      <div className="mx-auto max-w-[1024px]">
        <header className="mb-10 flex items-center justify-between border-b border-[var(--navy-blue)] pb-5">
          <Link href="/" className="brand-heading text-3xl font-extrabold tracking-tight text-[var(--navy-blue)]">
            MEDIA LAB
          </Link>
          <Link href="/templates" className="text-sm font-bold uppercase tracking-wide text-[var(--slate-blue)] hover:text-[var(--flame)]">
            Approved Templates
          </Link>
        </header>
        {children}
      </div>
    </main>
  );
}

export function NavItem({
  href,
  label,
  icon,
  active,
  count,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${focusState} ${
        active
          ? "bg-white !text-[#06153a] shadow-sm"
          : "text-white/78 hover:bg-white/8 hover:text-white"
      }`}
      style={active ? { color: "#06153a" } : undefined}
    >
      <span
        className={`grid h-7 w-8 shrink-0 place-items-center rounded border text-[11px] font-semibold ${
          active ? "border-slate-300 bg-slate-50 !text-[#06153a]" : "border-white/15 text-white/80"
        }`}
        style={active ? { color: "#06153a" } : undefined}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className={active ? "min-w-0 flex-1 whitespace-nowrap !text-[#06153a]" : "min-w-0 flex-1 whitespace-nowrap"}>
        {label}
      </span>
      {count ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            active ? "bg-[#e64a19] text-white" : "bg-white/12 text-white"
          }`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function Chip({
  children,
  selected = false,
  disabled = false,
}: {
  children: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
}) {
  const stateClass = disabled
    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
    : selected
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : "border-slate-300 bg-white text-[#06153a] hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

  return (
    <button type="button" disabled={disabled} className={`${chipBase} ${stateClass}`}>
      {children}
    </button>
  );
}

export function ToggleChip({
  label,
  selected = true,
  disabled = false,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <span
      className={`${chipBase} ${
        disabled
          ? "border-slate-200 bg-slate-100 text-slate-400"
          : selected
            ? "border-blue-300 bg-blue-50 text-blue-800"
            : "border-slate-300 bg-white text-slate-600"
      }`}
      aria-disabled={disabled}
    >
      {label}
    </span>
  );
}

export const OutputChip = ToggleChip;

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-[#06153a]">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-[#06153a]">{value}</p>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: PackageStatus | StoryRecord["status"] | string }) {
  const definition = getStatusDefinition(status);
  const toneClass = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    info: "bg-blue-50 text-blue-800 ring-blue-200",
    warning: "bg-orange-50 text-orange-800 ring-orange-200",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  }[definition.tone];

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ${toneClass}`}>
      {definition.label}
    </span>
  );
}

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

export function FormField({
  label,
  value,
  textarea = false,
  required = false,
}: {
  label: string;
  value: string;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} {required ? <span className="text-orange-700">Required</span> : null}
      </span>
      {textarea ? (
        <textarea
          className="min-h-24 w-full rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-[#06153a]"
          defaultValue={value}
        />
      ) : (
        <input
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-[#06153a]"
          defaultValue={value}
        />
      )}
    </label>
  );
}

export function TemplateListItem({ template }: { template: Template }) {
  return (
    <div className="grid gap-4 border-b border-slate-100 py-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-[#06153a]">
          {template.name.includes("Quote") ? "QT" : template.name.includes("Clip") ? "CL" : "TP"}
        </div>
        <div>
          <h3 className="font-semibold text-[#06153a]">{template.name}</h3>
          <p className="text-sm text-slate-600">{template.description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>{template.required_fields.length} fields</span>
            <span>{template.available_outputs.length} outputs</span>
            <span>{template.motion_ready ? "Motion ready" : "Static"}</span>
            <StatusBadge status={template.performance_tag} />
          </div>
        </div>
      </div>
      <SecondaryButton href="/generate" className="min-w-32">
        Use Template
      </SecondaryButton>
    </div>
  );
}

export function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-800">
        {template.name.includes("Quote") ? "QT" : template.name.includes("Clip") ? "CL" : "TP"}
      </div>
      <h2 className="text-xl font-semibold text-[#06153a]">{template.name.replace(" V.2", "")}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{template.description}</p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
        <span>{template.required_fields.length} fields</span>
        <span>{template.motion_ready ? "Still + video" : "Still outputs"}</span>
      </div>
      <PrimaryButton href="/generate" className="mt-5 w-full">
        Use Template
      </PrimaryButton>
    </div>
  );
}

export function AssetPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-md border border-slate-300 bg-[#dceeff] ${
        compact ? "min-w-0" : ""
      }`}
    >
      <Image
        src="/assets/quote-card-v2-16x9.png"
        alt="Quote Card V.2 16:9 graphic"
        fill
        sizes={compact ? "240px" : "(min-width: 1280px) 560px, 100vw"}
        className="object-contain"
        priority={!compact}
      />
    </div>
  );
}

export function PreviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="self-start rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-[#06153a]">{title}</h2>
      {children}
    </aside>
  );
}

export function OutputOption({
  output,
  checked,
  onChange,
}: {
  output: MvpOutputFormat;
  checked: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
        checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(output.id)}
        className="mt-1 h-4 w-4 accent-blue-600"
      />
      <span>
        <span className="block font-semibold text-[#06153a]">{output.label}</span>
        <span className="text-sm text-slate-500">
          {output.aspectLabel} · {output.recommendedPlatforms.slice(0, 2).join(", ")}
        </span>
      </span>
    </label>
  );
}

export function OutputGroup({
  title,
  outputs,
  selectedIds,
  onToggle,
}: {
  title: string;
  outputs: MvpOutputFormat[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {outputs.map((output) => (
          <OutputOption
            key={output.id}
            output={output}
            checked={selectedIds.includes(output.id)}
            onChange={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

export function DownloadRow({
  output,
  editId,
  downloadUrl = "/package",
  source = "mock-placeholder",
  status,
  progress,
  errorMessage,
}: {
  output: MvpOutputFormat;
  editId?: string;
  downloadUrl?: string;
  source?: "modeck-render" | "modeck-preview" | "mock-placeholder";
  status?: string;
  progress?: number;
  errorMessage?: string;
}) {
  const safeDownloadUrl = getSafeDownloadUrl(downloadUrl, editId, output.id);
  const isLiveModeckRender = source === "modeck-render";
  const isLiveModeckPreview = source === "modeck-preview";
  const isRenderable = !isLiveModeckRender || status === "completed";
  const deliveryState: StatusPillLabel =
    status === "failed" || status === "canceled"
      ? "Render unavailable"
      : isLiveModeckRender
        ? status === "completed"
          ? "Ready"
          : "Rendering"
        : source === "mock-placeholder"
          ? "Not connected"
          : "Ready";
  const fileKind = isLiveModeckRender
    ? output.type === "still"
      ? "Final PNG"
      : "Final video"
    : isLiveModeckPreview
      ? "Preview PNG"
      : output.type === "still"
        ? "Preview SVG"
        : "Preview MP4";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[#06153a]">
            {output.type === "still" ? "Still" : "Video"} - {output.label}
          </p>
          <StatusPill label={deliveryState} />
        </div>
        <p className="text-sm text-slate-500">
          {output.aspectLabel} - {fileKind}
        </p>
        {editId ? (
          <p className="mt-1 text-xs text-slate-400">
            Version ID: {editId}
          </p>
        ) : null}
        {isLiveModeckRender ? (
          <div className="mt-3 max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  status === "failed" || status === "canceled" ? "bg-orange-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.max(5, Math.min(100, progress ?? 5))}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {status === "completed"
                ? output.type === "still"
                  ? "PNG ready"
                  : "Video ready"
                : status === "failed" || status === "canceled"
                  ? errorMessage ?? "Render unavailable."
                  : "Rendering"}
            </p>
          </div>
        ) : errorMessage ? (
          <p className="mt-2 text-xs text-orange-700">{errorMessage}</p>
        ) : null}
      </div>
      {isRenderable && safeDownloadUrl ? (
        <SecondaryButton href={safeDownloadUrl} className="shrink-0">
          Download
        </SecondaryButton>
      ) : (
        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
          File unavailable
        </span>
      )}
    </div>
  );
}

function getSafeDownloadUrl(downloadUrl: string, editId: string | undefined, outputId: string) {
  if (!downloadUrl.includes("mock.modeck.local")) {
    return downloadUrl;
  }

  const query = new URLSearchParams({
    editId: editId ?? "mock-edit",
    outputId,
  });

  return `/api/mock-modeck/download?${query.toString()}`;
}

export function AssetListItem({ view }: { view: AssetPackageView }) {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[220px_1fr_auto] md:items-center">
      <AssetPreview compact />
      <div>
        <h2 className="text-lg font-semibold text-[#06153a]">{view.assetPackage.title}</h2>
        <p className="text-sm text-slate-600">
          {view.template.name} · {view.story.series} · {view.story.primary_messenger}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[view.story.topic, view.story.series, view.story.primary_messenger].map((tag) => (
            <Chip key={tag} selected>
              {tag}
            </Chip>
          ))}
        </div>
      </div>
      <div className="space-y-3 md:text-right">
        <StatusBadge status={view.assetPackage.status} />
        <p className="text-sm text-slate-500">{view.outputFiles.length} outputs</p>
        <PrimaryButton href={`/library/${view.assetPackage.id}`}>View Asset</PrimaryButton>
      </div>
    </div>
  );
}
