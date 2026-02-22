import { router, usePage } from "@inertiajs/react";
import { Search, SlidersHorizontal, ArrowDown, ArrowUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AnimeCard from "@/components/anime/AnimeCard";
import FiltersBar from "@/components/common/FiltersBar";
import PaginationBar from "@/components/common/PaginationBar";
import SectionHeader from "@/components/common/SectionHeader";
import { EmptyState, SkeletonGrid, SyncBanner } from "@/components/common/States";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { AnimeItem } from "@/data/mock";
import { t } from "@/lib/i18n";
import { formatSeason } from "@/lib/season";

interface ListMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

interface AnimeListProps {
  items?: AnimeItem[];
  meta?: ListMeta;
  filters?: Record<string, string | number | null | undefined>;
  isSyncing?: boolean;
  filterOptions?: {
    years?: number[];
    statuses?: string[];
    seasons?: string[];
    types?: string[];
    sorts?: string[];
    genres?: { id: number; name: string }[];
  };
}

type SortKey = "score" | "title" | "year" | "rank" | "popularity" | "members" | "favorites" | "created_at" | "updated_at";

export default function AnimeList({
  items = [],
  meta = { currentPage: 1, lastPage: 1, perPage: 24, total: 0 },
  filters = {},
  isSyncing = false,
  filterOptions,
}: AnimeListProps) {
  const ALL_OPTION = "__all__";
  const page = usePage();
  const currentPath = useMemo(
    () => new URL(page.url, window.location.origin).pathname,
    [page.url],
  );
  const [search, setSearch] = useState<string>(
    typeof filters.search === "string" ? filters.search : "",
  );
  const [selectedGenre, setSelectedGenre] = useState<string>(
    typeof filters.genre !== "undefined" && filters.genre !== null ? String(filters.genre) : "",
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    typeof filters.status === "string" ? filters.status : "",
  );
  const [yearFilter, setYearFilter] = useState<string>(
    typeof filters.year !== "undefined" && filters.year !== null ? String(filters.year) : "",
  );
  const [seasonFilter, setSeasonFilter] = useState<string>(
    typeof filters.season === "string" ? filters.season : "",
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    typeof filters.type === "string" ? filters.type : "",
  );
  const [minScoreFilter, setMinScoreFilter] = useState<string>(
    typeof filters.min_score !== "undefined" && filters.min_score !== null ? String(filters.min_score) : "",
  );
  const [maxScoreFilter, setMaxScoreFilter] = useState<string>(
    typeof filters.max_score !== "undefined" && filters.max_score !== null ? String(filters.max_score) : "",
  );
  const [maxRankFilter, setMaxRankFilter] = useState<string>(
    typeof filters.max_rank !== "undefined" && filters.max_rank !== null ? String(filters.max_rank) : "",
  );
  const [minMembersFilter, setMinMembersFilter] = useState<string>(
    typeof filters.min_members !== "undefined" && filters.min_members !== null ? String(filters.min_members) : "",
  );
  const [yearFromFilter, setYearFromFilter] = useState<string>(
    typeof filters.year_from !== "undefined" && filters.year_from !== null ? String(filters.year_from) : "",
  );
  const [yearToFilter, setYearToFilter] = useState<string>(
    typeof filters.year_to !== "undefined" && filters.year_to !== null ? String(filters.year_to) : "",
  );
  const [hasImageFilter, setHasImageFilter] = useState<boolean>(
    filters.has_image === "1" || filters.has_image === 1 || String(filters.has_image).toLowerCase() === "true",
  );
  const [sortBy, setSortBy] = useState<SortKey>(
    isSortKey(filters.sort) ? filters.sort : "score",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    filters.sort_dir === "asc" ? "asc" : "desc",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const didMount = useRef(false);

  const submit = useCallback(
    (override: Record<string, string | number | null | undefined> = {}) => {
      const params = {
        search: search || undefined,
        genre: selectedGenre || undefined,
        status: statusFilter || undefined,
        year: yearFilter || undefined,
        season: seasonFilter || undefined,
        type: typeFilter || undefined,
        min_score: minScoreFilter || undefined,
        max_score: maxScoreFilter || undefined,
        max_rank: maxRankFilter || undefined,
        min_members: minMembersFilter || undefined,
        year_from: yearFromFilter || undefined,
        year_to: yearToFilter || undefined,
        has_image: hasImageFilter ? "1" : undefined,
        sort: sortBy || undefined,
        sort_dir: sortDirection,
        ...override,
      };

      router.get(currentPath, params, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onStart: () => setIsApplyingFilters(true),
        onFinish: () => setIsApplyingFilters(false),
      });
    },
    [currentPath, hasImageFilter, maxRankFilter, maxScoreFilter, minMembersFilter, minScoreFilter, search, seasonFilter, selectedGenre, sortBy, sortDirection, statusFilter, typeFilter, yearFilter, yearFromFilter, yearToFilter],
  );

  useEffect(() => {
    if (! didMount.current) {
      didMount.current = true;
      return;
    }

    const handle = window.setTimeout(() => submit({ page: 1 }), 400);
    return () => window.clearTimeout(handle);
  }, [search, submit]);

  const activeFilters = [
    selectedGenre
      ? {
        key: "genre",
        label: "Gênero",
        value: filterOptions?.genres?.find((g) => String(g.id) === selectedGenre)?.name ?? selectedGenre,
      }
      : null,
    statusFilter ? { key: "status", label: t("common.status"), value: statusFilter } : null,
    yearFilter ? { key: "year", label: t("common.year"), value: yearFilter } : null,
    seasonFilter ? { key: "season", label: t("common.season"), value: formatSeason(seasonFilter) } : null,
    typeFilter ? { key: "type", label: t("common.type"), value: typeFilter } : null,
    minScoreFilter ? { key: "min_score", label: "Nota mín.", value: minScoreFilter } : null,
    maxScoreFilter ? { key: "max_score", label: "Nota máx.", value: maxScoreFilter } : null,
    maxRankFilter ? { key: "max_rank", label: "Classificação máx.", value: `#${maxRankFilter}` } : null,
    minMembersFilter ? { key: "min_members", label: "Membros mín.", value: minMembersFilter } : null,
    yearFromFilter ? { key: "year_from", label: "Ano de", value: yearFromFilter } : null,
    yearToFilter ? { key: "year_to", label: "Ano até", value: yearToFilter } : null,
    hasImageFilter ? { key: "has_image", label: "Mídia", value: "Com imagem" } : null,
  ].filter(Boolean) as { key: string; label: string; value: string }[];

  const quickStatuses = (filterOptions?.statuses ?? []).slice(0, 2);
  const quickYears = (filterOptions?.years ?? []).slice(0, 2);
  const quickGenres = (filterOptions?.genres ?? []).slice(0, 6);

  const handleRemoveFilter = (key: string) => {
    if (key === "genre") {
      setSelectedGenre("");
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
    if (key === "min_score") {
      setMinScoreFilter("");
      submit({ min_score: undefined, page: 1 });
    }
    if (key === "max_rank") {
      setMaxRankFilter("");
      submit({ max_rank: undefined, page: 1 });
    }
    if (key === "max_score") {
      setMaxScoreFilter("");
      submit({ max_score: undefined, page: 1 });
    }
    if (key === "min_members") {
      setMinMembersFilter("");
      submit({ min_members: undefined, page: 1 });
    }
    if (key === "year_from") {
      setYearFromFilter("");
      submit({ year_from: undefined, page: 1 });
    }
    if (key === "year_to") {
      setYearToFilter("");
      submit({ year_to: undefined, page: 1 });
    }
    if (key === "has_image") {
      setHasImageFilter(false);
      submit({ has_image: undefined, page: 1 });
    }
  };

  const clearAll = () => {
    setSelectedGenre("");
    setStatusFilter("");
    setYearFilter("");
    setSeasonFilter("");
    setTypeFilter("");
    setMinScoreFilter("");
    setMaxScoreFilter("");
    setMaxRankFilter("");
    setMinMembersFilter("");
    setYearFromFilter("");
    setYearToFilter("");
    setHasImageFilter(false);
    setSearch("");
    submit({
      search: undefined,
      genre: undefined,
      status: undefined,
      year: undefined,
      season: undefined,
      type: undefined,
      min_score: undefined,
      max_score: undefined,
      max_rank: undefined,
      min_members: undefined,
      year_from: undefined,
      year_to: undefined,
      has_image: undefined,
      page: 1,
    });
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <SectionHeader title={t("catalog.anime_title")} />

        {isSyncing && <div className="mb-4"><SyncBanner /></div>}

        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search_anime")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1"
              disabled={isApplyingFilters}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("common.filters")}
            </Button>
            <div className="flex items-center gap-1 border rounded-lg px-2">
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
                  {(filterOptions?.sorts ?? ["score", "title", "year"]).map((sort) => (
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
                disabled={isApplyingFilters}
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
        </div>
        {isApplyingFilters && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <Spinner className="h-3.5 w-3.5" />
            Atualizando resultados...
          </div>
        )}

        {/* Filter chips */}
        {showFilters && (
          <div className="bg-card rounded-xl border p-4 mb-4 animate-[fade-in_0.2s_ease-out]">
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t("common.genre").toUpperCase()}</p>
              <div className="flex flex-wrap gap-1.5">
                {(filterOptions?.genres ?? []).slice(0, 12).map((g) => {
                  const value = String(g.id);
                  const isActive = selectedGenre === value;
                  return (
                    <Button
                      key={g.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const next = isActive ? "" : value;
                        setSelectedGenre(next);
                        submit({ genre: next || undefined, page: 1 });
                      }}
                    >
                      {g.name}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t("common.status").toUpperCase()}</p>
              <div className="flex flex-wrap gap-1.5">
                {(filterOptions?.statuses ?? []).map((status) => (
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
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-busy={isApplyingFilters}>
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
              <Input
                type="number"
                min={0}
                step="0.1"
                placeholder="Nota mínima"
                value={minScoreFilter}
                onChange={(event) => {
                  setMinScoreFilter(event.target.value);
                  submit({ min_score: event.target.value || undefined, page: 1 });
                }}
                className="text-xs"
              />
              <Input
                type="number"
                min={0}
                step="0.1"
                placeholder="Nota máxima"
                value={maxScoreFilter}
                onChange={(event) => {
                  setMaxScoreFilter(event.target.value);
                  submit({ max_score: event.target.value || undefined, page: 1 });
                }}
                className="text-xs"
              />
              <Input
                type="number"
                min={1}
                placeholder="Classificação máxima"
                value={maxRankFilter}
                onChange={(event) => {
                  setMaxRankFilter(event.target.value);
                  submit({ max_rank: event.target.value || undefined, page: 1 });
                }}
                className="text-xs"
              />
              <Input
                type="number"
                min={0}
                placeholder="Membros mínimos"
                value={minMembersFilter}
                onChange={(event) => {
                  setMinMembersFilter(event.target.value);
                  submit({ min_members: event.target.value || undefined, page: 1 });
                }}
                className="text-xs"
              />
              <Input
                type="number"
                min={1900}
                max={2099}
                placeholder="Ano de"
                value={yearFromFilter}
                onChange={(event) => {
                  setYearFromFilter(event.target.value);
                  submit({ year_from: event.target.value || undefined, page: 1 });
                }}
                className="text-xs"
              />
              <Input
                type="number"
                min={1900}
                max={2099}
                placeholder="Ano até"
                value={yearToFilter}
                onChange={(event) => {
                  setYearToFilter(event.target.value);
                  submit({ year_to: event.target.value || undefined, page: 1 });
                }}
                className="text-xs"
              />
              <Button
                variant={hasImageFilter ? "default" : "outline"}
                size="sm"
                className="h-9 justify-start text-xs"
                onClick={() => {
                  const next = !hasImageFilter;
                  setHasImageFilter(next);
                  submit({ has_image: next ? "1" : undefined, page: 1 });
                }}
              >
                Apenas com imagem
              </Button>
            </div>
          </div>
        )}

        <FiltersBar activeFilters={activeFilters} onRemove={handleRemoveFilter} onClear={clearAll}>
          <div className="flex flex-col gap-2">
            {quickGenres.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickGenres.map((genre) => (
                  <Button
                    key={genre.id}
                    variant={selectedGenre === String(genre.id) ? "default" : "outline"}
                    size="sm"
                    className="h-7 shrink-0 text-xs"
                    onClick={() => {
                      const next = selectedGenre === String(genre.id) ? "" : String(genre.id);
                      setSelectedGenre(next);
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

        {/* Results */}
        {isSyncing ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <EmptyState onClear={clearAll} />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{t("common.results", { count: meta.total })}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((anime) => (
                <AnimeCard key={anime.malId} anime={anime} />
              ))}
            </div>
          </>
        )}

        <PaginationBar
          currentPage={meta.currentPage}
          lastPage={meta.lastPage}
          onPageChange={(nextPage) => submit({ page: nextPage })}
        />
      </div>
    </AppShell>
  );
}

function isSortKey(value: unknown): value is SortKey {
  return ["score", "title", "year", "rank", "popularity", "members", "favorites", "created_at", "updated_at"].includes(String(value));
}

function sortLabel(sort: string): string {
  return {
    score: "Nota",
    title: "Título",
    year: "Ano",
    rank: "Classificação",
    popularity: "Popularidade",
    members: "Membros",
    favorites: "Favoritos",
    created_at: "Adicionado",
    updated_at: "Atualizado",
  }[sort] ?? sort;
}
