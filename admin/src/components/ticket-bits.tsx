import { cn } from "@/lib/utils";
import type { TicketPriority, TicketStatus } from "@/lib/mock/data";

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-chart-2/15 text-chart-2 ring-chart-2/30",
  pending: "bg-chart-5/15 text-chart-5 ring-chart-5/30",
  resolved: "bg-primary/12 text-primary ring-primary/25",
  closed: "bg-muted text-muted-foreground ring-border",
};

const priorityStyles: Record<TicketPriority, string> = {
  urgent: "bg-destructive/12 text-destructive ring-destructive/30",
  high: "bg-chart-1/15 text-chart-1 ring-chart-1/30",
  medium: "bg-chart-5/15 text-chart-5 ring-chart-5/30",
  low: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        priorityStyles[priority],
        className,
      )}
    >
      {priority}
    </span>
  );
}

export function Initials({
  name,
  className,
  colorClass,
}: {
  name: string;
  className?: string;
  colorClass?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
        colorClass ?? "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}
