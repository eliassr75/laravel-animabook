import { Link, router, usePage } from "@inertiajs/react";
import { ArrowDown, ArrowUp, Medal, Search, SlidersHorizontal, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EntityCard, { type EntityCardItem } from "@/components/common/EntityCard";
import FiltersBar from "@/components/common/FiltersBar";
import PaginationBar from "@/components/common/PaginationBar";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { formatSeason } from "@/lib/season";

interface ListMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

interface FilterOptions {
  years?: number[];
  statuses?: string[];
  seasons?: string[];
  types?: string[];
  genres?: { id: number; name: string }[];
  sorts?: string[];
}

type SortKey = "score" | "title" | "year" | "popularity" | "rank" | "members" | "favorites" | "created_at" | "updated_at";

interface CatalogListProps {
  title: string;
  description?: string | null;
  entityType?: string;
  items?: EntityCardItem[];
  meta?: ListMeta;
  filters?: Record<string, string | number | null | undefined>;
  filterOptions?: FilterOptions;
}

export default function CatalogList({
  title,
  description,
  entityType,
  items = [],
  meta,
  filters = {},
  filterOptions,
}: CatalogListProps) {
  const ALL_OPTION = "__all__";
  const page = usePage();
  const currentPath = useMemo(
    () => new URL(page.url, window.location.origin).pathname,
    [page.url],
  );
  const [search, setSearch] = useState<string>(
    typeof filters.search === "string" ? filters.search : "",
  );
  const [yearFilter, setYearFilter] = useState<string>(
    typeof filters.year !== "undefined" && filters.year !== null ? String(filters.year) : "",
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    typeof filters.status === "string" ? filters.status : "",
  );
  const [genreFilter, setGenreFilter] = useState<string>(
    typeof filters.genre !== "undefined" && filters.genre !== null ? String(filters.genre) : "",
  );
  const [seasonFilter, setSeasonFilter] = useState<string>(
    typeof filters.season === "string" ? filters.season : "",
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    typeof filters.type === "string" ? filters.type : "",
  );
  const [sortBy, setSortBy] = useState<SortKey>(
    isSortKey(filters.sort) ? filters.sort : "score",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    filters.sort_dir === "asc" ? "asc" : "desc",
  );
  const [showFilters, setShowFilters] = useState(false);
  const didMount = useRef(false);
  const isCompactList = ["genre", "producer", "magazine", "club"].includes(entityType ?? "");
  const isRankingPage = currentPath === "/top";
  const isSearchOnlyList = ["character", "person"].includes(entityType ?? "");
  const hasAnyFilterOption = (
    (filterOptions?.genres?.length ?? 0) > 0
    || (filterOptions?.types?.length ?? 0) > 0
    || (filterOptions?.seasons?.length ?? 0) > 0
    || (filterOptions?.years?.length ?? 0) > 0
    || (filterOptions?.statuses?.length ?? 0) > 0
  );
  const hasSortOptions = (filterOptions?.sorts?.length ?? 0) > 0;
  const showAdvancedControls = !isCompactList && !isSearchOnlyList && (hasAnyFilterOption || hasSortOptions);
  const compactBaseHref = (() => {
    switch (entityType) {
      case "genre":
        return "/genres";
      case "producer":
        return "/producers";
      case "magazine":
        return "/magazines";
      case "club":
        return "/clubs";
      default:
        return "/genres";
    }
  })();

  const submit = useCallback(
    (override: Record<string, string | number | null | undefined> = {}) => {
      const params = {
        search: search || undefined,
        year: yearFilter || undefined,
        status: statusFilter || undefined,
        genre: genreFilter || undefined,
        season: seasonFilter || undefined,
        type: typeFilter || undefined,
        sort: sortBy || undefined,
        sort_dir: sortDirection,
        ...override,
      };

      router.get(currentPath, params, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    },
    [currentPath, genreFilter, search, seasonFilter, sortBy, sortDirection, statusFilter, typeFilter, yearFilter],
  );

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    const handle = window.setTimeout(() => submit({ page: 1 }), 400);
    return () => window.clearTimeout(handle);
  }, [search, submit]);

  const activeFilters = [
    genreFilter
      ? {
        key: "genre",
        label: "Gênero",
        value: filterOptions?.genres?.find((g) => String(g.id) === genreFilter)?.name ?? genreFilter,
      }
      : null,
    statusFilter ? { key: "status", label: t("common.status"), value: statusFilter } : null,
    yearFilter ? { key: "year", label: t("common.year"), value: yearFilter } : null,
    seasonFilter ? { key: "season", label: t("common.season"), value: formatSeason(seasonFilter) } : null,
    typeFilter ? { key: "type", label: t("common.type"), value: typeFilter } : null,
  ].filter(Boolean) as { key: string; label: string; value: string }[];

  const quickStatuses = (filterOptions?.statuses ?? []).slice(0, 2);
  const quickYears = (filterOptions?.years ?? []).slice(0, 2);
  const quickGenres = (filterOptions?.genres ?? []).slice(0, 6);

  const handleRemoveFilter = (key: string) => {
    if (key === "genre") {
      setGenreFilter("");
      submit({ genre: undefined, page: 1 });
    }
    if (key === "status") {
      setStatusFilter("");
      submit({ status: undefined, page: 1 });
    }
    if (key === "year") {
      setYearFilter("");
      submit({ year: undefined, page: 1 });
    }
    if (key === "season") {
      setSeasonFilter("");
      submit({ season: undefined, page: 1 });
    }
    if (key === "type") {
      setTypeFilter("");
      submit({ type: undefined, page: 1 });
    }
  };

  const clearAll = () => {
    setSearch("");
    setYearFilter("");
    setStatusFilter("");
    setGenreFilter("");
    setSeasonFilter("");
    setTypeFilter("");
    submit({
      search: undefined,
      year: undefined,
      status: undefined,
      genre: undefined,
      season: undefined,
      type: undefined,
      page: 1,
    });
  };

  return (
    <AppShell hideSearchButton={entityType === "character" || entityType === "person"}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:max-w-xs">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {showAdvancedControls && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("common.filters")}
                </Button>
                <div className="flex items-center gap-1 rounded-lg border px-2">
                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      const next = value as SortKey;
                      setSortBy(next);
                      submit({ sort: next, page: 1 });
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      aria-label={t("common.sort_by")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {(filterOptions?.sorts ?? []).map((sort) => (
                        <SelectItem key={sort} value={sort}>
                          {sortLabel(sort)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={sortDirection === "asc" ? "Ordenação crescente" : "Ordenação decrescente"}
                    onClick={() => {
                      const next = sortDirection === "asc" ? "desc" : "asc";
                      setSortDirection(next);
                      submit({ sort_dir: next, page: 1 });
                    }}
                  >
                    {sortDirection === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showAdvancedControls && showFilters && (
          <div className="mb-4 rounded-2xl border bg-card p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {filterOptions?.genres && filterOptions.genres.length > 0 && (
                <Select
                  value={genreFilter}
                  onValueChange={(value) => {
                    const next = value === ALL_OPTION ? "" : value;
                    setGenreFilter(next);
                    submit({ genre: next || undefined, page: 1 });
                  }}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue placeholder={t("common.genre")} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={ALL_OPTION}>{t("common.genre")}</SelectItem>
                    {filterOptions.genres.map((genre) => (
                      <SelectItem key={genre.id} value={String(genre.id)}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(filterOptions?.types ?? []).length > 0 && (
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    const next = value === ALL_OPTION ? "" : value;
                    setTypeFilter(next);
                    submit({ type: next || undefined, page: 1 });
                  }}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue placeholder={t("common.type")} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={ALL_OPTION}>{t("common.type")}</SelectItem>
                    {(filterOptions?.types ?? []).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(filterOptions?.seasons ?? []).length > 0 && (
                <Select
                  value={seasonFilter}
                  onValueChange={(value) => {
                    const next = value === ALL_OPTION ? "" : value;
                    setSeasonFilter(next);
                    submit({ season: next || undefined, page: 1 });
                  }}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue placeholder={t("common.season")} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={ALL_OPTION}>{t("common.season")}</SelectItem>
                    {(filterOptions?.seasons ?? []).map((season) => (
                      <SelectItem key={season} value={season}>
                        {formatSeason(season)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(filterOptions?.years ?? []).length > 0 && (
                <Select
                  value={yearFilter}
                  onValueChange={(value) => {
                    const next = value === ALL_OPTION ? "" : value;
                    setYearFilter(next);
                    submit({ year: next || undefined, page: 1 });
                  }}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue placeholder={t("common.year")} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={ALL_OPTION}>{t("common.year")}</SelectItem>
                    {(filterOptions?.years ?? []).map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(filterOptions?.statuses ?? []).length > 0 && (
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    const next = value === ALL_OPTION ? "" : value;
                    setStatusFilter(next);
                    submit({ status: next || undefined, page: 1 });
                  }}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue placeholder={t("common.status")} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={ALL_OPTION}>{t("common.status")}</SelectItem>
                    {(filterOptions?.statuses ?? []).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {showAdvancedControls && (
          <FiltersBar activeFilters={activeFilters} onRemove={handleRemoveFilter} onClear={clearAll}>
            <div className="flex flex-col gap-2">
              {quickGenres.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickGenres.map((genre) => (
                    <Button
                      key={genre.id}
                      variant={genreFilter === String(genre.id) ? "default" : "outline"}
                      size="sm"
                      className="h-7 shrink-0 text-xs"
                      onClick={() => {
                        const next = genreFilter === String(genre.id) ? "" : String(genre.id);
                        setGenreFilter(next);
                        submit({ genre: next || undefined, page: 1 });
                      }}
                    >
                      {genre.name}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {quickStatuses.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const next = statusFilter === status ? "" : status;
                      setStatusFilter(next);
                      submit({ status: next || undefined, page: 1 });
                    }}
                  >
                    {status}
                  </Button>
                ))}
                {quickYears.map((year) => (
                  <Button
                    key={year}
                    variant={yearFilter === String(year) ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const next = yearFilter === String(year) ? "" : String(year);
                      setYearFilter(next);
                      submit({ year: next || undefined, page: 1 });
                    }}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>
          </FiltersBar>
        )}

        {meta && (
          <p className="mb-4 text-sm text-muted-foreground">
            {t("common.results", { count: meta.total })}
          </p>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("common.no_items")}
            </p>
          </div>
        ) : (
          isCompactList ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {items.map((item) => (
                <Link
                  key={item.malId}
                  href={item.href ?? `${compactBaseHref}/${item.malId}`}
                  className="rounded-xl border bg-card/60 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          ) : (
            isRankingPage ? (
              <RankingShowcase items={items} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {items.map((item) => (
                  <EntityCard key={item.malId} item={item} />
                ))}
              </div>
            )
          )
        )}

        {meta && (
          <PaginationBar
            currentPage={meta.currentPage}
            lastPage={meta.lastPage}
            onPageChange={(nextPage) => submit({ page: nextPage })}
          />
        )}
      </div>
    </AppShell>
  );
}

function RankingShowcase({ items }: { items: EntityCardItem[] }) {
  const top3 = items.slice(0, 3);
  const rest = items.slice(3);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {top3.map((item, index) => (
          <Link
            key={item.malId}
            href={item.href ?? `/anime/${item.malId}`}
            className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
              index === 0
                ? "border-amber-400/60 bg-gradient-to-br from-amber-100/60 to-card dark:from-amber-500/10"
                : index === 1
                  ? "border-slate-300/70 bg-gradient-to-br from-slate-100/60 to-card dark:from-slate-500/10"
                  : "border-orange-300/70 bg-gradient-to-br from-orange-100/60 to-card dark:from-orange-500/10"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-1 rounded-full border bg-card/80 px-2 py-1 text-xs font-semibold">
                <Medal className="h-3.5 w-3.5" />
                #{item.rank ?? index + 1}
              </div>
              {typeof item.score === "number" ? (
                <div className="inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-semibold">
                  <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                  {item.score.toFixed(1)}
                </div>
              ) : null}
            </div>
            <div className="overflow-hidden rounded-xl border bg-muted/40">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
                  <span className="text-4xl font-heading font-bold text-primary/70">{item.title.charAt(0)}</span>
                </div>
              )}
            </div>
            <p className="mt-3 line-clamp-2 text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.type ? item.type : "--"}{item.year ? ` · ${item.year}` : ""}
            </p>
          </Link>
        ))}
      </div>

      {rest.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border bg-card">
          {rest.map((item, idx) => (
            <Link
              key={item.malId}
              href={item.href ?? `/anime/${item.malId}`}
              className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/40"
            >
              <div className="w-10 text-center text-sm font-bold text-muted-foreground">#{item.rank ?? idx + 4}</div>
              <div className="h-12 w-10 overflow-hidden rounded border bg-muted/30">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.type ?? "--"}{item.year ? ` · ${item.year}` : ""}</p>
              </div>
              {typeof item.score === "number" ? (
                <div className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs font-semibold">
                  <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                  {item.score.toFixed(1)}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isSortKey(value: unknown): value is SortKey {
  return ["score", "title", "year", "popularity", "rank", "members", "favorites", "created_at", "updated_at"].includes(String(value));
}

function sortLabel(sort: string): string {
  return {
    score: "Nota",
    title: "Título",
    year: "Ano",
    popularity: "Popularidade",
    rank: "Classificação",
    members: "Membros",
    favorites: "Favoritos",
    created_at: "Adicionado",
    updated_at: "Atualizado",
  }[sort] ?? sort;
}
