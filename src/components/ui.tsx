import Image from "next/image";
import Link from "next/link";
import { getStatusDefinition } from "@/lib/constants";
import type { MvpOutputFormat } from "@/lib/output-formats";
import type { AssetPackageView, PackageStatus, StoryRecord, Template } from "@/lib/types";

const focusState =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

const buttonBase =
  `inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition ${focusState}`;

const chipBase =
  `inline-flex min-h-8 items-center justify-center rounded-md border px-3 text-xs font-semibold transition ${focusState}`;

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
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-4xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-[#06153a] md:text-4xl">
          {title} {accent ? <span className="text-[#e64a19]">{accent}</span> : null}
        </h1>
        <p className="mt-2 max-w-3xl text-base text-slate-600">{subtitle}</p>
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
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#06153a]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PrimaryButton({
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
      className={`${buttonBase} gap-2 bg-[#06153a] !text-white shadow-sm hover:bg-[#12306a] hover:!text-white active:bg-[#020b21] active:!text-white ${className}`}
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
      className={`${buttonBase} border border-slate-300 bg-white text-[#06153a] hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 ${className}`}
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
      className={`${buttonBase} bg-transparent text-[#06153a] hover:bg-slate-100 active:bg-slate-200 ${className}`}
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
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  const variantClass =
    variant === "primary"
      ? "bg-[#06153a] !text-white hover:bg-[#12306a] hover:!text-white active:bg-[#020b21] active:!text-white"
      : variant === "ghost"
        ? "bg-transparent text-[#06153a] hover:bg-slate-100 active:bg-slate-200"
        : "border border-slate-300 bg-white text-[#06153a] hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${buttonBase} ${variantClass} ${className}`}
      style={variant === "primary" ? { color: "#ffffff" } : undefined}
    >
      {children}
    </button>
  );
}

export const PrimaryActionButton = PrimaryButton;

export function MvpShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-[#06153a]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between border-b border-slate-200 pb-5">
          <Link href="/" className="text-2xl font-semibold tracking-tight text-[#06153a]">
            MEDIA LAB
          </Link>
          <Link href="/templates" className="text-sm font-medium text-slate-500 hover:text-[#06153a]">
            Platform preview
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
          ? "bg-white text-[#06153a] shadow-sm"
          : "text-white/78 hover:bg-white/8 hover:text-white"
      }`}
    >
      <span
        className={`grid h-7 w-8 shrink-0 place-items-center rounded border text-[11px] font-semibold ${
          active ? "border-slate-300 bg-slate-50 text-[#06153a]" : "border-white/15 text-white/80"
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 whitespace-nowrap">{label}</span>
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

export function DownloadRow({ output }: { output: MvpOutputFormat }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="font-semibold text-[#06153a]">
          {output.type === "still" ? "Still" : "Video"} · {output.label}
        </p>
        <p className="text-sm text-slate-500">
          {output.aspectLabel} · Mock {output.type === "still" ? "PNG" : "MP4"}
        </p>
      </div>
      <SecondaryButton href="/package" className="shrink-0">
        Download
      </SecondaryButton>
    </div>
  );
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
