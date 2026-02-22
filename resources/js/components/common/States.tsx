import { AlertTriangle, SearchX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-card border animate-pulse">
      <div className="aspect-[3/4] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 bg-muted rounded-xl" />
      <div className="space-y-3">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

export function EmptyState({ message, onClear }: { message?: string; onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-[fade-in_0.3s_ease-out]">
      <SearchX className="h-16 w-16 text-muted-foreground/40 mb-4" />
      <h3 className="font-heading text-lg font-semibold mb-2">{t("states.empty_title")}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {message ?? t("states.empty_desc")}
      </p>
      {onClear && (
        <Button variant="outline" onClick={onClear}>
          {t("common.clear_filters")}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-[fade-in_0.3s_ease-out]">
      <AlertTriangle className="h-16 w-16 text-destructive/60 mb-4" />
      <h3 className="font-heading text-lg font-semibold mb-2">{t("states.error_title")}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {message ?? t("states.error_desc")}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {t("states.retry")}
        </Button>
      )}
    </div>
  );
}

export function SyncBanner() {
  return (
    <div className="bg-secondary/50 border border-accent/30 rounded-lg p-3 flex items-center gap-3 animate-[fade-in_0.3s_ease-out]">
      <Loader2 className="h-5 w-5 text-accent animate-spin flex-shrink-0" />
      <div>
        <p className="text-sm font-medium">{t("states.syncing_title")}</p>
        <p className="text-xs text-muted-foreground">{t("states.syncing_desc")}</p>
      </div>
    </div>
  );
}
