import type { PreviewStatusState } from "@/lib/preview-state";

const labels: Record<PreviewStatusState, string> = {
  idle: "Preview ready",
  updating: "Rendering",
  updated: "Preview ready",
  error: "Render unavailable",
};

export function PreviewStatus({ status = "updated" }: { status?: PreviewStatusState }) {
  const isError = status === "error";

  return (
    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--slate-blue)]">
      <span
        className={`h-2 w-2 ${isError ? "bg-[var(--flame)]" : "bg-[var(--navy-blue)]"}`}
        aria-hidden="true"
      />
      <span>{labels[status]}</span>
    </div>
  );
}
