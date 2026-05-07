import type { PreviewStatusState } from "@/lib/preview-state";

const labels: Record<PreviewStatusState, string> = {
  idle: "Live preview",
  updating: "Updating preview",
  updated: "Updates as you type",
  error: "Preview unavailable",
};

export function PreviewStatus({ status = "updated" }: { status?: PreviewStatusState }) {
  const isError = status === "error";

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span
        className={`h-2 w-2 rounded-full ${isError ? "bg-orange-500" : "bg-emerald-500"}`}
        aria-hidden="true"
      />
      <span>{labels[status]}</span>
    </div>
  );
}
