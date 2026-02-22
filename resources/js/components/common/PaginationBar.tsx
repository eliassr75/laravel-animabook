import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface PaginationBarProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({ currentPage, lastPage, onPageChange }: PaginationBarProps) {
  if (lastPage <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 py-6" aria-label={t("common.pagination")}>
      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label={t("common.prev_page")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(p)}
            className="min-w-[36px]"
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label={t("common.next_page")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
