import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface Filter {
  key: string;
  label: string;
  value: string;
}

interface FiltersBarProps {
  activeFilters: Filter[];
  onRemove: (key: string) => void;
  onClear: () => void;
  children?: React.ReactNode;
}

export default function FiltersBar({ activeFilters, onRemove, onClear, children }: FiltersBarProps) {
  if (activeFilters.length === 0 && !children) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      {children}
      {activeFilters.map((f) => (
        <Badge
          key={f.key}
          variant="outline"
          className="gap-1 pl-2.5 pr-1.5 py-1 cursor-pointer hover:bg-destructive/10 transition-colors"
          onClick={() => onRemove(f.key)}
        >
          <span className="text-xs text-muted-foreground">{f.label}:</span>
          <span className="text-xs font-medium">{f.value}</span>
          <X className="h-3 w-3 ml-0.5" />
        </Badge>
      ))}
      {activeFilters.length > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-muted-foreground h-7">
          {t("common.clear_all")}
        </Button>
      )}
    </div>
  );
}
