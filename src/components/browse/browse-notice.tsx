import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrowseNotice } from "@/lib/browse-search";

/**
 * The degraded / unavailable banner.
 *
 * The live region is always rendered, empty when there is nothing to say, so a
 * client-side navigation that changes the message is announced. Copy comes
 * from decideBrowseNotice; this component only lays it out.
 */
export function BrowseNoticeBanner({
  notice,
  className,
}: {
  notice: BrowseNotice;
  className?: string;
}) {
  const unavailable = notice.kind === "unavailable";
  const Icon = unavailable ? AlertTriangle : Info;
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={className}>
      {notice.kind !== "none" && (
        <div
          data-notice={notice.kind}
          className={cn(
            "flex gap-3 rounded-2xl border p-4 text-sm",
            unavailable
              ? "border-destructive/40 bg-destructive/5"
              : "border-primary/30 bg-primary/5",
          )}
        >
          <Icon
            aria-hidden="true"
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0",
              unavailable ? "text-destructive" : "text-primary",
            )}
          />
          <div className="min-w-0">
            <p className="break-words text-foreground">{notice.message}</p>
            {notice.action && (
              <a
                href={notice.action.href}
                className="mt-2 inline-block font-semibold text-primary hover:underline"
              >
                {notice.action.label} →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
