import { t } from "@/lib/i18n";
import type { EventStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  draft: { label: t.events.status.draft, className: "bg-muted text-muted-foreground" },
  published: { label: t.events.status.published, className: "bg-accent/15 text-accent" },
  scheduled: { label: t.events.status.scheduled, className: "bg-primary/15 text-primary" },
  archived: { label: t.events.status.archived, className: "bg-secondary text-secondary-foreground" },
  ended: { label: t.events.status.ended, className: "bg-destructive/15 text-destructive" },
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
