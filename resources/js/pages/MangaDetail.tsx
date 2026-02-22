import { Link } from "@inertiajs/react";
import { BookOpen, Calendar, Users, Building2, BarChart3, MessageSquare, Clock3, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import AnimeCard from "@/components/anime/AnimeCard";
import MediaActionButtons from "@/components/common/MediaActionButtons";
import MediaReviewComposer from "@/components/common/MediaReviewComposer";
import MediaStatsPanel from "@/components/common/MediaStatsPanel";
import ScoreBadge from "@/components/common/ScoreBadge";
import { SyncBanner, SkeletonDetail } from "@/components/common/States";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CARD_GRADIENTS, type AnimeItem, type CharacterItem } from "@/data/mock";
import { t } from "@/lib/i18n";
import { translateCharacterRole, translateMediaType, translateRelation, translateStatus } from "@/lib/labels";
import { formatSeason } from "@/lib/season";
import { displayText } from "@/lib/text";

type GenreItem = { id?: number | null; name: string };
type MangaReviewItem = {
  id: number;
  user: string;
  mangaTitle: string;
  mangaMalId: number;
  score: number;
  content: string;
  date: string;
  isMine?: boolean;
  mediaType?: "manga";
};

interface MangaDetailProps {
  entity?: AnimeItem & {
    chapters?: number | null;
    volumes?: number | null;
    genreItems?: GenreItem[];
    imageUrl?: string | null;
    stats?: {
      total?: number;
      reading?: number;
      completed?: number;
      on_hold?: number;
      dropped?: number;
      plan_to_read?: number;
      scores?: Array<{ score: number; votes: number; percentage: number }>;
    };
    relations?: { relation?: string | null; entries?: { malId?: number | null; type?: string | null; name?: string | null; url?: string | null; href?: string | null; imageUrl?: string | null }[] }[];
    userActions?: { favorite: boolean; status: "assistindo" | "completo" | "dropado" | null } | null;
  };
  recommendations?: AnimeItem[];
  reviews?: MangaReviewItem[];
  news?: Array<{
    id: number;
    title: string;
    excerpt?: string;
    url?: string;
    author?: string;
    source?: string;
    date?: string;
  }>;
  myReview?: {
    score: number;
    content: string;
    isSpoiler?: boolean;
  } | null;
  characters?: CharacterItem[];
  isSyncing?: boolean;
}

const TABS = ["overview", "relations", "characters", "reviews", "news", "recommendations", "stats"] as const;

export default function MangaDetail({
  entity,
  recommendations = [],
  reviews = [],
  news = [],
  myReview = null,
  characters = [],
  isSyncing = false,
}: MangaDetailProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("overview");
  const [relationSearch, setRelationSearch] = useState("");
  const [expandedReviews, setExpandedReviews] = useState<number[]>([]);
  const [reviewList, setReviewList] = useState<MangaReviewItem[]>(reviews);
  const [myReviewState, setMyReviewState] = useState(myReview);
  const manga = entity;
  const scoreRows = (manga?.stats?.scores ?? []).slice().sort((a, b) => b.score - a.score);
  const totalVotes = manga?.stats?.total ?? scoreRows.reduce((sum, row) => sum + (row.votes ?? 0), 0);

  useEffect(() => {
    setReviewList(reviews);
  }, [reviews]);

  useEffect(() => {
    setMyReviewState(myReview);
  }, [myReview]);

  if (isSyncing && !entity) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <SyncBanner />
          <div className="mt-6"><SkeletonDetail /></div>
        </div>
      </AppShell>
    );
  }

  if (!manga) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{t("catalog.not_found_manga")}</h1>
          <p className="text-muted-foreground">{t("catalog.not_available")}</p>
        </div>
      </AppShell>
    );
  }

  const gradient = CARD_GRADIENTS[manga.colorIndex % CARD_GRADIENTS.length];
  const relationNeedle = relationSearch.trim().toLowerCase();
  const filteredRelations = (manga.relations ?? [])
    .map((group) => ({
      ...group,
      entries: (group.entries ?? []).filter((entry) => {
        if (!relationNeedle) return true;
        const hay = `${group.relation ?? ""} ${translateRelation(group.relation, "")} ${entry.name ?? ""} ${entry.type ?? ""} ${translateMediaType(entry.type, "")}`.toLowerCase();
        return hay.includes(relationNeedle);
      }),
    }))
    .filter((group) => (group.entries?.length ?? 0) > 0);
  const toggleReview = (id: number) => {
    setExpandedReviews((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };
  const relationCount = filteredRelations.reduce((sum, group) => sum + (group.entries?.length ?? 0), 0);
  const tabCounts: Partial<Record<(typeof TABS)[number], number>> = {
    relations: relationCount,
    characters: characters.length,
    reviews: reviewList.length,
    news: news.length,
    recommendations: recommendations.length,
    stats: scoreRows.length,
  };
  const statusRows = [
    { label: "Lendo", value: Number(manga.stats?.reading ?? 0) },
    { label: "Completos", value: Number(manga.stats?.completed ?? 0) },
    { label: "Em pausa", value: Number(manga.stats?.on_hold ?? 0) },
    { label: "Dropados", value: Number(manga.stats?.dropped ?? 0) },
    { label: "Planejados", value: Number(manga.stats?.plan_to_read ?? 0) },
  ];

  const upsertMyReview = (next: { score: number; content: string; isSpoiler?: boolean } | null) => {
    setMyReviewState(next);
    setReviewList((current) => {
      const withoutMine = current.filter((item) => !item.isMine);
      if (!next) {
        return withoutMine;
      }

      return [
        {
          id: Date.now(),
          user: "Você",
          mangaTitle: manga.title,
          mangaMalId: manga.malId,
          mediaType: "manga",
          score: next.score,
          content: next.content,
          date: new Date().toISOString(),
          isMine: true,
        },
        ...withoutMine,
      ];
    });
  };

  return (
    <AppShell>
      <div className={`relative bg-gradient-to-br ${gradient} h-48 md:h-64`}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className={`mx-auto h-64 w-44 rounded-xl bg-gradient-to-br ${gradient} shadow-xl flex-shrink-0 flex items-center justify-center overflow-hidden md:mx-0 md:h-68 md:w-48`}>
            {manga.imageUrl ? (
              <img src={manga.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-heading font-bold text-white/80">{manga.title.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 pt-2 md:pt-8">
            {isSyncing && <div className="mb-3"><SyncBanner /></div>}
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{manga.title}</h1>
            {manga.titleJapanese && (
              <p className="text-sm text-muted-foreground mb-3">{manga.titleJapanese}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <ScoreBadge score={manga.score} size="lg" />
              <span className="text-sm text-muted-foreground">{t("common.ranking", { rank: manga.rank })}</span>
              <Badge variant="secondary">{translateStatus(manga.status, manga.status ?? "--")}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(manga.genreItems?.length ? manga.genreItems : manga.genres.map((g) => ({ name: g, id: null }))).map((g) =>
                g.id ? (
                  <Link key={`${g.id}-${g.name}`} href={`/manga?genre=${encodeURIComponent(g.id)}`}>
                    <Badge variant="outline">{g.name}</Badge>
                  </Link>
                ) : (
                  <Badge key={g.name} variant="outline">{g.name}</Badge>
                ),
              )}
            </div>
            <MediaActionButtons
              mediaType="manga"
              malId={manga.malId}
              initialState={manga.userActions}
              showLabels
              className="max-w-md"
            />
          </div>
        </div>

        <div className="sticky top-16 z-20 mb-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`tabs.${tab}`)}
                {typeof tabCounts[tab] === "number" ? (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                    {tabCounts[tab]}
                  </Badge>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-12 animate-[fade-in_0.3s_ease-out]">
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-2">{t("common.synopsis")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{manga.synopsis}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-card rounded-xl border p-4 space-y-3">
                  <h4 className="font-heading text-sm font-semibold">{t("common.info")}</h4>
                  <InfoRow
                    icon={BookOpen}
                    label={t("common.type")}
                    value={translateMediaType(manga.type, manga.type ?? "--")}
                    href={manga.type ? `/manga?type=${encodeURIComponent(manga.type)}` : undefined}
                  />
                  <InfoRow icon={Calendar} label={t("common.chapters")} value={manga.chapters ? `${manga.chapters}` : "?"} />
                  <InfoRow icon={Calendar} label={t("common.volumes")} value={manga.volumes ? `${manga.volumes}` : "?"} />
                  {manga.year ? (
                    <InfoRow
                      icon={Calendar}
                      label={t("common.year")}
                      value={manga.season ? `${manga.year} · ${formatSeason(manga.season)}` : `${manga.year}`}
                      href={manga.season ? `/manga?season=${encodeURIComponent(manga.season)}` : undefined}
                    />
                  ) : null}
                  <InfoRow icon={Building2} label={t("common.publishers")} value={manga.studios.join(", ")} />
                  <InfoRow icon={Users} label={t("common.members")} value={manga.members.toLocaleString("pt-BR")} />
                  <InfoRow icon={BarChart3} label={t("common.rank")} value={`#${manga.rank}`} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "characters" && (
            characters.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {characters.map((c) => (
                  <div key={c.malId} className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`aspect-square bg-gradient-to-br ${CARD_GRADIENTS[c.colorIndex % CARD_GRADIENTS.length]} flex items-center justify-center overflow-hidden`}>
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-heading font-bold text-white/80">{c.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{translateCharacterRole(c.role, c.role ?? "--")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">Nenhum personagem disponível.</div>
            )
          )}

          {activeTab === "relations" && (
            <div className="w-full space-y-3">
              <div className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={relationSearch}
                  onChange={(event) => setRelationSearch(event.target.value)}
                  placeholder="Buscar em relações..."
                  className="w-full pl-9 pr-9"
                />
                {relationSearch ? (
                  <button
                    type="button"
                    onClick={() => setRelationSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                    aria-label="Limpar busca de relações"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              {(filteredRelations.length ?? 0) > 0 ? (
                filteredRelations.map((group) => (
                  <div key={`${group.relation}-${group.entries?.length}`} className="rounded-xl border bg-card/40 p-4">
                    <p className="mb-2 text-sm font-semibold text-foreground">{translateRelation(group.relation, group.relation ?? "--")}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {(group.entries ?? []).map((entry) =>
                        entry.href ? (
                          <Link
                            key={`${entry.name}-${entry.href}`}
                            href={entry.href}
                            className="rounded-lg border bg-card overflow-hidden hover:shadow-sm transition-shadow"
                          >
                            <div className={`aspect-[4/5] bg-gradient-to-br ${CARD_GRADIENTS[(entry.malId ?? 0) % CARD_GRADIENTS.length]} flex items-center justify-center overflow-hidden`}>
                              {entry.imageUrl ? (
                                <img src={entry.imageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xl font-heading font-bold text-white/80">{(entry.name ?? "?").charAt(0)}</span>
                              )}
                            </div>
                            <div className="p-2">
                              <p className="truncate text-xs font-medium text-foreground">{entry.name}</p>
                              {entry.type ? (
                                <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wide">
                                  {translateMediaType(entry.type, entry.type)}
                                </Badge>
                              ) : null}
                            </div>
                          </Link>
                        ) : entry.url ? (
                          <a
                            key={`${entry.name}-${entry.url}`}
                            href={entry.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border bg-card overflow-hidden hover:shadow-sm transition-shadow"
                          >
                            <div className={`aspect-[4/5] bg-gradient-to-br ${CARD_GRADIENTS[(entry.malId ?? 0) % CARD_GRADIENTS.length]} flex items-center justify-center`}>
                              <span className="text-xl font-heading font-bold text-white/80">{(entry.name ?? "?").charAt(0)}</span>
                            </div>
                            <div className="p-2">
                              <p className="truncate text-xs font-medium text-foreground">{entry.name}</p>
                              {entry.type ? (
                                <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wide">
                                  {translateMediaType(entry.type, entry.type)}
                                </Badge>
                              ) : null}
                            </div>
                          </a>
                        ) : (
                          <div key={entry.name} className="rounded-lg border bg-card overflow-hidden">
                            <div className={`aspect-[4/5] bg-gradient-to-br ${CARD_GRADIENTS[(entry.malId ?? 0) % CARD_GRADIENTS.length]} flex items-center justify-center`}>
                              <span className="text-xl font-heading font-bold text-white/80">{(entry.name ?? "?").charAt(0)}</span>
                            </div>
                            <div className="p-2">
                              <p className="truncate text-xs font-medium text-foreground">{entry.name}</p>
                              {entry.type ? (
                                <Badge variant="outline" className="mt-1 text-[10px] uppercase tracking-wide">
                                  {translateMediaType(entry.type, entry.type)}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  Nenhuma relação encontrada.
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              <MediaReviewComposer
                mediaType="manga"
                malId={manga.malId}
                initialReview={myReviewState}
                onChanged={upsertMyReview}
              />
              {reviewList.length > 0 ? (
                reviewList.map((r) => (
                  <article key={r.id} className="rounded-2xl border bg-card p-4 md:p-5 shadow-sm">
                    <header className="mb-3 flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                      <div className="min-w-0 flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {reviewInitials(r.user)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{r.user}</p>
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{formatReviewDate(r.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <ScoreBadge score={r.score} size="sm" />
                      </div>
                    </header>
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {r.mangaMalId ? (
                        <Link href={`/manga/${r.mangaMalId}`} className="underline underline-offset-4 hover:text-foreground">
                          {displayText(r.mangaTitle)}
                        </Link>
                      ) : (
                        <span>{displayText(r.mangaTitle)}</span>
                      )}
                    </div>
                    <p className="rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {renderReviewText(r.content, expandedReviews.includes(r.id))}
                    </p>
                    {needsReviewToggle(r.content) && (
                      <button
                        type="button"
                        onClick={() => toggleReview(r.id)}
                        className="mt-2 text-xs font-medium text-accent underline underline-offset-4"
                      >
                        {expandedReviews.includes(r.id) ? "Ler menos" : "Ler mais"}
                      </button>
                    )}
                  </article>
                ))
              ) : (
                <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  Nenhuma review disponível.
                </div>
              )}
            </div>
          )}

          {activeTab === "news" && (
            <div className="space-y-3">
              {news.length > 0 ? (
                news.map((item) => (
                  <article key={item.id} className="rounded-xl border bg-card p-4">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    {item.excerpt ? (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.excerpt}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{item.author || "Fonte externa"}</span>
                      <span>{formatReviewDate(item.date || "")}</span>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
                          Ler matéria
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  Sem notícias disponíveis.
                </div>
              )}
            </div>
          )}

          {activeTab === "recommendations" && (
            recommendations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recommendations.map((a) => (
                  <AnimeCard key={a.malId} anime={a} hrefBase="/manga" />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">Sem recomendações disponíveis.</div>
            )
          )}

          {activeTab === "stats" && (
            <MediaStatsPanel
              scoreRows={scoreRows.map((row) => ({
                score: Number(row.score ?? 0),
                votes: Number(row.votes ?? 0),
                percentage: typeof row.percentage === "number" ? row.percentage : undefined,
              }))}
              totalVotes={Number(totalVotes ?? 0)}
              averageScore={Number(manga.score ?? 0)}
              members={Number(manga.members ?? 0)}
              rank={Number(manga.rank ?? 0)}
              statusTitle="Situação de leitura"
              statusRows={statusRows}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  href?: string;
}) {
  const displayValue = displayText(value);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      {href ? (
        <Link href={href} className="font-medium text-accent underline underline-offset-4">
          {displayValue}
        </Link>
      ) : (
        <span className="font-medium">{displayValue}</span>
      )}
    </div>
  );
}

function formatReviewDate(value?: string | null): string {
  if (!value) return "Data indisponível";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("pt-BR");
}

function reviewInitials(name?: string | null): string {
  const safe = displayText(name, "U");
  const parts = safe.split(" ").filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "U";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function needsReviewToggle(value?: string | null): boolean {
  return (value ?? "").length > 320;
}

function renderReviewText(value?: string | null, expanded = false): string {
  const safe = displayText(value);
  if (expanded || safe.length <= 320) return safe;
  return `${safe.slice(0, 320)}...`;
}
