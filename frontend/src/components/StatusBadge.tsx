type Status = "DRAFT" | "PAID" | "OVERDUE";

const config: Record<Status, { dot: string; text: string; bg: string; label: string }> = {
  DRAFT:   { dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-400/10 border border-amber-400/20",   label: "Draft"   },
  PAID:    { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10 border border-emerald-400/20", label: "Paid"    },
  OVERDUE: { dot: "bg-rose-400",    text: "text-rose-400",    bg: "bg-rose-400/10 border border-rose-400/20",       label: "Overdue" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const c = config[status] ?? config.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}