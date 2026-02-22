import { router } from "@inertiajs/react";
import { ArrowDown, ArrowUp, Newspaper } from "lucide-react";
import { useState } from "react";
import PaginationBar from "@/components/common/PaginationBar";
import SectionHeader from "@/components/common/SectionHeader";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewsListProps {
  items?: Array<{
    id: number;
    title: string;
    excerpt?: string;
    url?: string;
    author?: string;
    date?: string;
    mediaType?: "anime" | "manga";
    mediaMalId?: number;
    mediaTitle?: string;
  }>;
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  filters?: {
    type?: "all" | "anime" | "manga";
    search?: string;
    sort?: "recent" | "comments";
    sort_dir?: "asc" | "desc";
  };
}

export default function NewsList({
  items = [],
  meta = { currentPage: 1, lastPage: 1, perPage: 18, total: 0 },
  filters = {},
}: NewsListProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [type, setType] = useState<"all" | "anime" | "manga">(filters.type ?? "all");
  const [sort, setSort] = useState<"recent" | "comments">(filters.sort ?? "recent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(filters.sort_dir ?? "desc");

  const submit = (page = 1) => {
    router.get("/news", {
      search: search || undefined,
      type: type === "all" ? undefined : type,
      sort,
      sort_dir: sortDir,
      page,
    }, {
      preserveScroll: true,
      replace: true,
    });
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10">
        <SectionHeader title="Notícias" />

        <div className="mb-6 grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_170px_210px_44px_150px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submit(1);
              }
            }}
            placeholder="Buscar notícia..."
            className="h-10"
          />
          <Select value={type} onValueChange={(value) => setType(value as "all" | "anime" | "manga")}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
              <SelectItem value="manga">Mangá</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as "recent" | "comments")}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="comments">Mais comentadas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setSortDir((current) => current === "desc" ? "asc" : "desc")}
            className="h-10 w-11"
            title={sortDir === "desc" ? "Ordem decrescente" : "Ordem crescente"}
            aria-label={sortDir === "desc" ? "Ordem decrescente" : "Ordem crescente"}
          >
            {sortDir === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            onClick={() => submit(1)}
            className="h-10"
          >
            Aplicar filtros
          </Button>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article key={`${item.mediaType}-${item.mediaMalId}-${item.id}`} className="rounded-xl border bg-card p-4">
                <a
                  href={`${item.mediaType === "manga" ? "/manga" : "/anime"}/${item.mediaMalId ?? 0}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {item.mediaTitle ?? "—"}
                </a>
                <h2 className="mt-1 text-sm font-semibold leading-snug">{item.title}</h2>
                {item.excerpt ? (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{item.author || "Fonte externa"} · {item.date || "—"}</span>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                      Ler fonte
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-10 text-center">
            <Newspaper className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhuma notícia encontrada.</p>
          </div>
        )}

        <PaginationBar
          currentPage={meta.currentPage}
          lastPage={meta.lastPage}
          onPageChange={(page) => submit(page)}
        />
      </div>
    </AppShell>
  );
}
