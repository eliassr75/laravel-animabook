import { Link, usePage } from "@inertiajs/react";
import { Tv, Calendar, Users, Building2, BarChart3, MessageSquare, Clock3, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import AnimeCard from "@/components/anime/AnimeCard";
import MediaActionButtons from "@/components/common/MediaActionButtons";
import MediaReviewComposer from "@/components/common/MediaReviewComposer";
import MediaStatsPanel from "@/components/common/MediaStatsPanel";
import ScoreBadge from "@/components/common/ScoreBadge";
import { SyncBanner, SkeletonDetail } from "@/components/common/States";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CARD_GRADIENTS, type AnimeItem, type ReviewItem, type CharacterItem } from "@/data/mock";
import { listAnimeEpisodes, saveEpisodeProgress } from "@/lib/anime-episodes";
import { t } from "@/lib/i18n";
import { translateCharacterRole, translateMediaType, translateRelation, translateStaffPosition, translateStatus } from "@/lib/labels";
import { notify } from "@/lib/notify";
import { formatSeason } from "@/lib/season";
import { displayText } from "@/lib/text";

type GenreItem = { id?: number | null; name: string };

interface AnimeDetailProps {
  entity?: AnimeItem & {
    genreItems?: GenreItem[];
    imageUrl?: string | null;
    trailer?: { url?: string | null; embed_url?: string | null } | null;
    themes?: string[];
    explicitGenres?: string[];
    demographics?: string[];
    producers?: string[];
    licensors?: string[];
    broadcast?: { string?: string | null; time?: string | null; timezone?: string | null; day?: string | null };
    themeSongs?: { openings?: string[]; endings?: string[] };
    relations?: { relation?: string | null; entries?: { malId?: number | null; type?: string | null; name?: string | null; url?: string | null; href?: string | null; imageUrl?: string | null }[] }[];
    staff?: { malId?: number | null; name?: string | null; positions?: string[]; imageUrl?: string | null }[];
    stats?: {
      total?: number;
      watching?: number;
      completed?: number;
      on_hold?: number;
      dropped?: number;
      plan_to_watch?: number;
      scores?: Array<{ score: number; votes: number; percentage: number }>;
    };
    streaming?: { name?: string | null; url?: string | null }[];
    externalLinks?: { name?: string | null; url?: string | null }[];
    userActions?: { favorite: boolean; status: "assistindo" | "completo" | "dropado" | null } | null;
  };
  recommendations?: AnimeItem[];
  reviews?: ReviewItem[];
  watchedEpisodes?: number[];
  episodes?: Array<{
    number: number;
    title?: string | null;
    titleJapanese?: string | null;
    filler?: boolean;
    recap?: boolean;
    aired?: string | null;
    score?: number | null;
    videoUrl?: string | null;
    videoTitle?: string | null;
    videoImageUrl?: string | null;
  }>;
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

const TABS = ["overview", "episodes", "relations", "staff", "songs", "characters", "reviews", "news", "recommendations", "stats"] as const;

export default function AnimeDetail({
  entity,
  recommendations = [],
  reviews = [],
  watchedEpisodes = [],
  episodes = [],
  news = [],
  myReview = null,
  characters = [],
  isSyncing = false,
}: AnimeDetailProps) {
  const page = usePage<{ auth?: { user?: { id: number } | null } }>();
  const isLoggedIn = Boolean(page.props.auth?.user?.id);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("overview");
  const [relationSearch, setRelationSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [expandedReviews, setExpandedReviews] = useState<number[]>([]);
  const [episodeList, setEpisodeList] = useState(episodes);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodesLoaded, setEpisodesLoaded] = useState(episodes.length > 0);
  const [episodeChecked, setEpisodeChecked] = useState<Set<number>>(new Set(watchedEpisodes));
  const [savingEpisodes, setSavingEpisodes] = useState(false);
  const [reviewList, setReviewList] = useState<ReviewItem[]>(reviews);
  const [myReviewState, setMyReviewState] = useState(myReview);
  const anime = entity;
  const scoreRows = (anime?.stats?.scores ?? []).slice().sort((a, b) => b.score - a.score);
  const totalVotes = anime?.stats?.total ?? scoreRows.reduce((sum, row) => sum + (row.votes ?? 0), 0);

  useEffect(() => {
    setReviewList(reviews);
  }, [reviews]);

  useEffect(() => {
    setMyReviewState(myReview);
  }, [myReview]);

  useEffect(() => {
    setEpisodeChecked(new Set(watchedEpisodes));
  }, [watchedEpisodes]);

  useEffect(() => {
    if (!anime) {
      return;
    }

    if (activeTab !== "episodes" || episodesLoaded) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoadingEpisodes(true);
        const loaded = await listAnimeEpisodes(anime.malId);
        if (cancelled) {
          return;
        }
        setEpisodeList(loaded);
        setEpisodesLoaded(true);
      } catch {
        if (!cancelled) {
          notify("Não foi possível carregar os episódios.", "error");
        }
      } finally {
        if (!cancelled) {
          setLoadingEpisodes(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeTab, anime, episodesLoaded]);

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

  if (!anime) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{t("catalog.not_found_anime")}</h1>
          <p className="text-muted-foreground">{t("catalog.not_available")}</p>
        </div>
      </AppShell>
    );
  }

  const gradient = CARD_GRADIENTS[anime.colorIndex % CARD_GRADIENTS.length];
  const relationNeedle = relationSearch.trim().toLowerCase();
  const filteredRelations = (anime.relations ?? [])
    .map((group) => ({
      ...group,
      entries: (group.entries ?? []).filter((entry) => {
        if (!relationNeedle) return true;
        const hay = `${group.relation ?? ""} ${translateRelation(group.relation, "")} ${entry.name ?? ""} ${entry.type ?? ""} ${translateMediaType(entry.type, "")}`.toLowerCase();
        return hay.includes(relationNeedle);
      }),
    }))
    .filter((group) => (group.entries?.length ?? 0) > 0);
  const staffNeedle = staffSearch.trim().toLowerCase();
  const filteredStaff = (anime.staff ?? []).filter((member) => {
    if (!staffNeedle) return true;
    const translatedPositions = (member.positions ?? []).map((position) => translateStaffPosition(position, position ?? ""));
    const hay = `${member.name ?? ""} ${(member.positions ?? []).join(" ")} ${translatedPositions.join(" ")}`.toLowerCase();
    return hay.includes(staffNeedle);
  });
  const toggleReview = (id: number) => {
    setExpandedReviews((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };
  const relationCount = filteredRelations.reduce((sum, group) => sum + (group.entries?.length ?? 0), 0);
  const songsCount = (anime.themeSongs?.openings?.length ?? 0) + (anime.themeSongs?.endings?.length ?? 0);
  const tabCounts: Partial<Record<(typeof TABS)[number], number>> = {
    episodes: Number(anime.episodes ?? 0) > 0
      ? Number(anime.episodes ?? 0)
      : episodeList.length,
    relations: relationCount,
    staff: filteredStaff.length,
    songs: songsCount,
    characters: characters.length,
    reviews: reviewList.length,
    news: news.length,
    recommendations: recommendations.length,
    stats: scoreRows.length,
  };
  const statusRows = [
    { label: "Assistindo", value: Number(anime.stats?.watching ?? 0) },
    { label: "Completos", value: Number(anime.stats?.completed ?? 0) },
    { label: "Em pausa", value: Number(anime.stats?.on_hold ?? 0) },
    { label: "Dropados", value: Number(anime.stats?.dropped ?? 0) },
    { label: "Planejados", value: Number(anime.stats?.plan_to_watch ?? 0) },
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
          animeTitle: anime.title,
          animeMalId: anime.malId,
          mediaType: "anime",
          score: next.score,
          content: next.content,
          date: new Date().toISOString(),
          isMine: true,
        },
        ...withoutMine,
      ];
    });
  };

  const toggleEpisode = (number: number) => {
    setEpisodeChecked((current) => {
      const next = new Set(current);
      if (next.has(number)) {
        next.delete(number);
      } else {
        next.add(number);
      }
      return next;
    });
  };

  const saveEpisodes = async () => {
    if (!anime) {
      return;
    }

    if (!isLoggedIn) {
      notify("Faça login para salvar progresso de episódios.", "error");
      return;
    }

    try {
      setSavingEpisodes(true);
      const watched = Array.from(episodeChecked).sort((a, b) => a - b);
      const saved = await saveEpisodeProgress(anime.malId, watched);
      setEpisodeChecked(new Set(saved.watchedEpisodes));
      notify("Progresso de episódios atualizado.", "success");
    } catch {
      notify("Não foi possível salvar o progresso dos episódios.", "error");
    } finally {
      setSavingEpisodes(false);
    }
  };

  return (
    <AppShell>
      {/* Hero Banner */}
      <div className={`relative bg-gradient-to-br ${gradient} h-48 md:h-64`}>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Cover */}
          <div className={`mx-auto h-64 w-44 rounded-xl bg-gradient-to-br ${gradient} shadow-xl flex-shrink-0 flex items-center justify-center overflow-hidden md:mx-0 md:h-68 md:w-48`}>
            {anime.imageUrl ? (
              <img src={anime.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-heading font-bold text-white/80">{anime.title.charAt(0)}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 md:pt-8">
            {isSyncing && <div className="mb-3"><SyncBanner /></div>}
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{anime.title}</h1>
            {anime.titleJapanese && (
              <p className="text-sm text-muted-foreground mb-3">{anime.titleJapanese}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <ScoreBadge score={anime.score} size="lg" />
              <span className="text-sm text-muted-foreground">{t("common.ranking", { rank: anime.rank })}</span>
              <Badge variant="secondary">{translateStatus(anime.status, anime.status ?? "--")}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(anime.genreItems?.length ? anime.genreItems : anime.genres.map((g) => ({ name: g, id: null }))).map((g) =>
                g.id ? (
                  <Link key={`${g.id}-${g.name}`} href={`/anime?genre=${encodeURIComponent(g.id)}`}>
                    <Badge variant="outline">{g.name}</Badge>
                  </Link>
                ) : (
                  <Badge key={g.name} variant="outline">{g.name}</Badge>
                ),
              )}
            </div>
            <MediaActionButtons
              mediaType="anime"
              malId={anime.malId}
              initialState={anime.userActions}
              showLabels
              className="max-w-md"
            />
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab Content */}
        <div className="pb-12 animate-[fade-in_0.3s_ease-out]">
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-2">{t("common.synopsis")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{anime.synopsis}</p>
                </div>
                {anime.trailer?.embed_url && (
                  <div>
                    <h3 className="font-heading text-lg font-semibold mb-2">Trailer</h3>
                    <div className="aspect-video overflow-hidden rounded-xl border bg-black/10">
                      <iframe
                        src={anime.trailer.embed_url}
                        title={`Trailer ${anime.title}`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
                {(anime.streaming?.length ?? 0) + (anime.externalLinks?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="font-heading text-lg font-semibold mb-2">Links</h3>
                    <div className="space-y-2 text-sm">
                      {(anime.streaming ?? []).map((item) => (
                        item.url ? (
                          <a key={`${item.name}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="block text-muted-foreground hover:text-foreground">
                            {item.name}
                          </a>
                        ) : (
                          <span key={item.name} className="block text-muted-foreground">{item.name}</span>
                        )
                      ))}
                      {(anime.externalLinks ?? []).map((item) => (
                        item.url ? (
                          <a key={`${item.name}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="block text-muted-foreground hover:text-foreground">
                            {item.name}
                          </a>
                        ) : (
                          <span key={item.name} className="block text-muted-foreground">{item.name}</span>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-card rounded-xl border p-4 space-y-3">
                  <h4 className="font-heading text-sm font-semibold">{t("common.info")}</h4>
                  <InfoRow
                    icon={Tv}
                    label={t("common.type")}
                    value={translateMediaType(anime.type, anime.type ?? "--")}
                    href={anime.type ? `/anime?type=${encodeURIComponent(anime.type)}` : undefined}
                  />
                  <InfoRow icon={Calendar} label={t("common.episodes")} value={anime.episodes ? `${anime.episodes}` : "?"} />
                  {anime.broadcast?.string ? (
                    <InfoRow icon={Calendar} label="Exibição" value={anime.broadcast.string} />
                  ) : null}
                  <InfoRow
                    icon={Calendar}
                    label={t("common.year")}
                    value={anime.season ? `${anime.year} · ${formatSeason(anime.season)}` : `${anime.year}`}
                    href={anime.season ? `/anime?season=${encodeURIComponent(anime.season)}` : undefined}
                  />
                  <InfoRow icon={Building2} label={t("common.studio")} value={anime.studios.join(", ")} />
                  {anime.producers?.length ? (
                    <InfoRow icon={Building2} label="Produtores" value={anime.producers.join(", ")} />
                  ) : null}
                  {anime.licensors?.length ? (
                    <InfoRow icon={Building2} label="Licenciadores" value={anime.licensors.join(", ")} />
                  ) : null}
                  <InfoRow icon={Users} label={t("common.members")} value={anime.members.toLocaleString("pt-BR")} />
                  <InfoRow icon={BarChart3} label={t("common.rank")} value={`#${anime.rank}`} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "episodes" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEpisodeChecked(new Set(episodeList.map((item) => item.number)))}
                  disabled={episodeList.length === 0 || savingEpisodes || loadingEpisodes}
                >
                  Marcar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEpisodeChecked(new Set())}
                  disabled={episodeChecked.size === 0 || savingEpisodes}
                >
                  Limpar
                </Button>
                <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{episodeList.length} episódios carregados</span>
                  <span>{episodeChecked.size} marcados</span>
                  <Button type="button" size="sm" onClick={() => void saveEpisodes()} disabled={savingEpisodes || loadingEpisodes}>
                    {savingEpisodes ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Salvar progresso
                  </Button>
                </div>
              </div>
              {loadingEpisodes ? (
                <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Carregando episódios...
                  </div>
                </div>
              ) : episodeList.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {episodeList.map((episode) => (
                    <article key={episode.number} className="rounded-xl border bg-card p-3">
                      {episode.videoImageUrl ? (
                        <div className="mb-2 overflow-hidden rounded-md border bg-muted/30">
                          <img src={episode.videoImageUrl} alt="" className="h-28 w-full object-cover" />
                        </div>
                      ) : null}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={episodeChecked.has(episode.number)}
                          onCheckedChange={() => toggleEpisode(episode.number)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Episódio {episode.number}</p>
                          <h3 className="truncate text-sm font-semibold">{displayText(episode.title)}</h3>
                          {episode.titleJapanese ? (
                            <p className="truncate text-xs text-muted-foreground">{episode.titleJapanese}</p>
                          ) : null}
                        </div>
                        {typeof episode.score === "number" ? (
                          <Badge variant="secondary" className="shrink-0">{episode.score.toFixed(1)}</Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {episode.filler ? <Badge variant="outline">Filler</Badge> : null}
                        {episode.recap ? <Badge variant="outline">Recap</Badge> : null}
                        {episode.aired ? <span>{formatReviewDate(episode.aired)}</span> : null}
                      </div>
                      {episode.videoUrl ? (
                        <a
                          href={episode.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs font-medium underline underline-offset-4 hover:text-foreground"
                        >
                          {episode.videoTitle ? `Vídeo: ${episode.videoTitle}` : "Ver vídeo do episódio"}
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  Episódios ainda não disponíveis.
                </div>
              )}
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

          {activeTab === "staff" && (
            <div className="w-full space-y-3">
              <div className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={staffSearch}
                  onChange={(event) => setStaffSearch(event.target.value)}
                  placeholder="Buscar na equipe..."
                  className="w-full pl-9 pr-9"
                />
                {staffSearch ? (
                  <button
                    type="button"
                    onClick={() => setStaffSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                    aria-label="Limpar busca de equipe"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(filteredStaff.length ?? 0) > 0 ? (
                  filteredStaff.map((member) => (
                  member.malId ? (
                    <Link
                      key={member.malId}
                      href={`/people/${member.malId}`}
                      className="flex items-center gap-3 rounded-xl border bg-card/40 p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                        {member.imageUrl ? (
                          <img src={member.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {member.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{(member.positions ?? []).map((position) => translateStaffPosition(position, position ?? "")).join(", ")}</p>
                      </div>
                    </Link>
                  ) : (
                    <div key={member.name} className="flex items-center gap-3 rounded-xl border bg-card/40 p-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {member.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{(member.positions ?? []).map((position) => translateStaffPosition(position, position ?? "")).join(", ")}</p>
                      </div>
                    </div>
                  )
                  ))
                ) : (
                  <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                    Nenhum membro encontrado.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "songs" && (
            <div className="space-y-4 max-w-3xl">
              {(anime.themes?.length ?? 0) + (anime.demographics?.length ?? 0) + (anime.explicitGenres?.length ?? 0) > 0 && (
                <div className="rounded-xl border bg-card/40 p-4">
                  <h3 className="font-heading text-lg font-semibold mb-2">Temas</h3>
                  <div className="flex flex-wrap gap-2">
                    {(anime.themes ?? []).map((theme) => (
                      <Badge key={theme} variant="secondary">{theme}</Badge>
                    ))}
                    {(anime.demographics ?? []).map((demo) => (
                      <Badge key={demo} variant="outline">{demo}</Badge>
                    ))}
                    {(anime.explicitGenres ?? []).map((genre) => (
                      <Badge key={genre} variant="destructive">{genre}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(anime.themeSongs?.openings?.length ?? 0) + (anime.themeSongs?.endings?.length ?? 0) > 0 ? (
                <div className="rounded-xl border bg-card/40 p-4">
                  <h3 className="font-heading text-lg font-semibold mb-2">Músicas</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    {(anime.themeSongs?.openings?.length ?? 0) > 0 && (
                      <div>
                        <p className="font-semibold text-foreground">Aberturas</p>
                        <ul className="list-disc pl-5">
                          {anime.themeSongs?.openings?.map((song) => (
                            <li key={song}>{song}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(anime.themeSongs?.endings?.length ?? 0) > 0 && (
                      <div>
                        <p className="font-semibold text-foreground">Encerramentos</p>
                        <ul className="list-disc pl-5">
                          {anime.themeSongs?.endings?.map((song) => (
                            <li key={song}>{song}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  Sem músicas disponíveis.
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              <MediaReviewComposer
                mediaType="anime"
                malId={anime.malId}
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
                      {r.animeMalId ? (
                        <Link href={`/anime/${r.animeMalId}`} className="underline underline-offset-4 hover:text-foreground">
                          {displayText(r.animeTitle)}
                        </Link>
                      ) : (
                        <span>{displayText(r.animeTitle)}</span>
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
                  <AnimeCard key={a.malId} anime={a} />
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
              averageScore={Number(anime.score ?? 0)}
              members={Number(anime.members ?? 0)}
              rank={Number(anime.rank ?? 0)}
              statusTitle="Situação da audiência"
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
