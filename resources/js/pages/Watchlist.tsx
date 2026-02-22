import { Link } from "@inertiajs/react";
import { LayoutGrid, TableIcon, ChevronDown, Play, Check, Pause, Clock, Trash2, Minus, Plus, Search } from "lucide-react";
import { useState } from "react";
import AnimeCard from "@/components/anime/AnimeCard";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { STATUS_OPTIONS, CARD_GRADIENTS, type WatchlistItem } from "@/data/mock";
import { listAnimeEpisodes, saveEpisodeProgress, showAnimeEpisode } from "@/lib/anime-episodes";
import { saveMediaScore } from "@/lib/media-score";
import { notify } from "@/lib/notify";

interface WatchlistProps {
  items?: WatchlistItem[];
  auth?: { user: { name: string; email: string } };
}

const statusIcons: Record<string, React.ElementType> = {
  assistindo: Play,
  completo: Check,
  planejado: Clock,
  pausado: Pause,
  dropado: Trash2,
};

export default function Watchlist({ items = [] }: WatchlistProps) {
  const [watchItems, setWatchItems] = useState<WatchlistItem[]>(items);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [scoreMap, setScoreMap] = useState<Record<number, string>>(
    Object.fromEntries(items.map((item) => [item.malId, item.userScore !== null ? String(item.userScore) : ""])),
  );
  const [savingScore, setSavingScore] = useState<Record<number, boolean>>({});
  const [scoreDialogItem, setScoreDialogItem] = useState<WatchlistItem | null>(null);
  const [draftScore, setDraftScore] = useState<number>(0);
  const [progressDialogItem, setProgressDialogItem] = useState<WatchlistItem | null>(null);
  const [episodeList, setEpisodeList] = useState<Array<{ number: number; title?: string | null; filler?: boolean; recap?: boolean; videoUrl?: string | null; videoTitle?: string | null; videoImageUrl?: string | null }>>([]);
  const [episodeChecked, setEpisodeChecked] = useState<Set<number>>(new Set());
  const [episodeDetail, setEpisodeDetail] = useState<{ number: number; title?: string | null; synopsis?: string | null; duration?: string | null; aired?: string | null } | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [loadingEpisodeDetailNumber, setLoadingEpisodeDetailNumber] = useState<number | null>(null);
  const [savingEpisodes, setSavingEpisodes] = useState(false);
  const [episodeQuery, setEpisodeQuery] = useState("");

  const filtered = statusFilter ? watchItems.filter((i) => i.watchStatus === statusFilter) : watchItems;

  const statusCounts = STATUS_OPTIONS.map((s) => ({
    ...s,
    count: watchItems.filter((i) => i.watchStatus === s.value).length,
  }));

  const commitScore = async (item: WatchlistItem, rawValue?: string) => {
    const raw = (rawValue ?? scoreMap[item.malId] ?? "").trim().replace(",", ".");
    if (raw !== "") {
      const numeric = Number(raw);
      if (Number.isNaN(numeric) || numeric < 0 || numeric > 10) {
        notify("A nota deve estar entre 0 e 10.", "error");
        setScoreMap((current) => ({
          ...current,
          [item.malId]: item.userScore !== null ? String(item.userScore) : "",
        }));
        return;
      }
    }

    try {
      setSavingScore((current) => ({ ...current, [item.malId]: true }));
      const saved = await saveMediaScore({
        mediaType: item.mediaType ?? "anime",
        malId: item.malId,
        userScore: raw === "" ? null : Number(raw),
      });
      setScoreMap((current) => ({
        ...current,
        [item.malId]: saved !== null ? String(saved) : "",
      }));
      setWatchItems((current) => current.map((entry) => entry.malId === item.malId ? { ...entry, userScore: saved } : entry));
      notify("Sua nota foi salva.", "success");
    } catch {
      notify("Não foi possível salvar sua nota.", "error");
      setScoreMap((current) => ({
        ...current,
        [item.malId]: item.userScore !== null ? String(item.userScore) : "",
      }));
    } finally {
      setSavingScore((current) => ({ ...current, [item.malId]: false }));
    }
  };

  const openScoreDialog = (item: WatchlistItem) => {
    const current = scoreMap[item.malId] ?? "";
    const parsed = current === "" ? 0 : Number(current);
    setDraftScore(Number.isFinite(parsed) ? parsed : 0);
    setScoreDialogItem(item);
  };

  const saveDialogScore = async () => {
    const item = scoreDialogItem;
    if (!item) {
      return;
    }

    const raw = Number(draftScore.toFixed(1));
    setScoreMap((current) => ({ ...current, [item.malId]: String(raw) }));
    await commitScore(item, String(raw));
    setScoreDialogItem(null);
  };

  const clearDialogScore = async () => {
    const item = scoreDialogItem;
    if (!item) {
      return;
    }

    setScoreMap((current) => ({ ...current, [item.malId]: "" }));
    await commitScore(item, "");
    setScoreDialogItem(null);
  };

  const openProgressDialog = async (item: WatchlistItem) => {
    if ((item.mediaType ?? "anime") !== "anime") {
      notify("Progresso por episódios está disponível apenas para animes.", "info");
      return;
    }

    setProgressDialogItem(item);
    setEpisodeDetail(null);
    setEpisodeQuery("");
    setLoadingEpisodes(true);
    try {
      const episodes = await listAnimeEpisodes(item.malId);
      const sorted = episodes
        .filter((entry) => (entry.number ?? 0) > 0)
        .sort((a, b) => a.number - b.number);
      setEpisodeList(sorted);

      const initialChecked = item.watchedEpisodes && item.watchedEpisodes.length > 0
        ? item.watchedEpisodes
        : Array.from({ length: Math.max(0, item.progress) }, (_, index) => index + 1);
      setEpisodeChecked(new Set(initialChecked));
    } catch {
      notify("Não foi possível carregar os episódios.", "error");
      setProgressDialogItem(null);
    } finally {
      setLoadingEpisodes(false);
    }
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

  const loadEpisodeDetail = async (animeId: number, number: number) => {
    try {
      setLoadingEpisodeDetailNumber(number);
      const detail = await showAnimeEpisode(animeId, number);
      if (!detail) {
        return;
      }
      setEpisodeDetail({
        number: detail.number,
        title: detail.title,
        synopsis: detail.synopsis,
        duration: detail.duration,
        aired: detail.aired,
      });
    } catch {
      notify("Não foi possível carregar os detalhes do episódio.", "error");
    } finally {
      setLoadingEpisodeDetailNumber(null);
    }
  };

  const saveProgressDialog = async () => {
    const item = progressDialogItem;
    if (!item) {
      return;
    }

    const watchedEpisodes = Array.from(episodeChecked).sort((a, b) => a - b);
    setSavingEpisodes(true);
    try {
      const saved = await saveEpisodeProgress(item.malId, watchedEpisodes);
      setWatchItems((current) => current.map((entry) => {
        if (entry.malId !== item.malId) {
          return entry;
        }
        return {
          ...entry,
          progress: saved.progress,
          watchedEpisodes: saved.watchedEpisodes,
        };
      }));
      notify("Progresso atualizado com sucesso.", "success");
      setProgressDialogItem(null);
    } catch {
      notify("Não foi possível salvar o progresso.", "error");
    } finally {
      setSavingEpisodes(false);
    }
  };

  const filteredEpisodeList = episodeList.filter((episode) => {
    const query = episodeQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const byNumber = String(episode.number).includes(query);
    const byTitle = (episode.title ?? "").toLowerCase().includes(query);
    return byNumber || byTitle;
  });

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Minha lista</h1>
          <div className="flex gap-1 border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              aria-label="Visualização em tabela"
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-md transition-colors ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              aria-label="Visualização em cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            Todos ({watchItems.length})
          </Button>
          {statusCounts.map((s) => {
            const Icon = statusIcons[s.value];
            return (
              <Button
                key={s.value}
                variant={statusFilter === s.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === s.value ? null : s.value)}
                className="gap-1"
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label} ({s.count})
              </Button>
            );
          })}
        </div>

        {/* Visão em tabela */}
        {viewMode === "table" ? (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Anime</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Sua nota</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Progresso</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Situação</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const StatusIcon = statusIcons[item.watchStatus];
                    return (
                      <tr key={item.malId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-14 rounded overflow-hidden bg-gradient-to-br ${CARD_GRADIENTS[item.colorIndex % CARD_GRADIENTS.length]} flex-shrink-0 flex items-center justify-center`}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-white/80">{item.title.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <Link href={`/${item.mediaType ?? "anime"}/${item.malId}`} className="font-medium hover:text-accent transition-colors line-clamp-1">{item.title}</Link>
                              <p className="text-xs text-muted-foreground">{item.type} · {item.year}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3 hidden sm:table-cell">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={savingScore[item.malId]}
                            onClick={() => openScoreDialog(item)}
                            className="h-8 min-w-16"
                          >
                            {scoreMap[item.malId] ? Number(scoreMap[item.malId]).toFixed(1) : "Dar nota"}
                          </Button>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Diminuir progresso" disabled>
                              <Minus className="h-3 w-3 opacity-50" />
                            </Button>
                            <button
                              type="button"
                              onClick={() => void openProgressDialog(item)}
                              className="min-w-[56px] rounded-md border bg-background px-2 py-0.5 font-mono text-xs hover:bg-muted"
                            >
                              {item.progress}/{item.episodes ?? "?"}
                            </button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Aumentar progresso" disabled>
                              <Plus className="h-3 w-3 opacity-50" />
                            </Button>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3 hidden md:table-cell">
                          <Badge variant="secondary" className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {STATUS_OPTIONS.find((s) => s.value === item.watchStatus)?.label}
                          </Badge>
                        </td>
                        <td className="text-center px-4 py-3">
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <ChevronDown className="h-3 w-3" />
                            Mover
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((item) => (
              <AnimeCard key={item.malId} anime={item} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum anime nessa categoria.</p>
            <Button variant="outline" className="mt-3" onClick={() => setStatusFilter(null)}>Ver todos</Button>
          </div>
        )}
      </div>

      <Dialog open={Boolean(scoreDialogItem)} onOpenChange={(open) => !open && setScoreDialogItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sua nota</DialogTitle>
            <DialogDescription>
              {scoreDialogItem ? `Defina a nota para ${scoreDialogItem.title}.` : "Defina a nota do item."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
              <p className="text-3xl font-bold">{draftScore.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">de 0 a 10</p>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={draftScore}
              onChange={(event) => setDraftScore(Number(event.target.value))}
              className="w-full accent-primary"
            />

            <div className="grid grid-cols-5 gap-2">
              {[6, 7, 8, 9, 10].map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={Math.round(draftScore) === value ? "default" : "outline"}
                  onClick={() => setDraftScore(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => void clearDialogScore()}
              disabled={scoreDialogItem ? Boolean(savingScore[scoreDialogItem.malId]) : false}
            >
              Limpar nota
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScoreDialogItem(null)}
                disabled={scoreDialogItem ? Boolean(savingScore[scoreDialogItem.malId]) : false}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void saveDialogScore()}
                disabled={scoreDialogItem ? Boolean(savingScore[scoreDialogItem.malId]) : false}
              >
                {scoreDialogItem && savingScore[scoreDialogItem.malId] ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(progressDialogItem)} onOpenChange={(open) => !open && setProgressDialogItem(null)}>
        <DialogContent className="max-h-[85vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Marcar episódios assistidos</DialogTitle>
            <DialogDescription>
              {progressDialogItem ? progressDialogItem.title : "Anime"}
            </DialogDescription>
          </DialogHeader>

          {loadingEpisodes ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <p className="text-center text-xs text-muted-foreground">Carregando episódios...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]" aria-busy={savingEpisodes}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={episodeQuery}
                      onChange={(event) => setEpisodeQuery(event.target.value)}
                      placeholder="Buscar episódio por número ou título"
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEpisodeChecked(new Set(episodeList.map((item) => item.number)))}
                    disabled={episodeList.length === 0 || savingEpisodes}
                  >
                    Marcar todos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEpisodeChecked(new Set())}
                    disabled={episodeChecked.size === 0 || savingEpisodes}
                  >
                    Limpar
                  </Button>
                </div>

                {savingEpisodes && (
                  <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                    <Spinner className="h-3.5 w-3.5" />
                    Salvando progresso...
                  </div>
                )}

                <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
                  {filteredEpisodeList.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      {episodeList.length === 0 ? "Nenhum episódio encontrado." : "Nenhum episódio corresponde à busca."}
                    </p>
                  ) : (
                    <div className="divide-y">
                      {filteredEpisodeList.map((episode) => {
                        const checked = episodeChecked.has(episode.number);
                        const isLoadingDetail = loadingEpisodeDetailNumber === episode.number;
                        return (
                          <label
                            key={episode.number}
                            className={`flex cursor-pointer items-start gap-3 p-3 transition-colors ${
                              checked ? "bg-primary/10" : "hover:bg-muted/40"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleEpisode(episode.number)}
                              className="mt-0.5"
                              disabled={savingEpisodes}
                            />
                            <button
                              type="button"
                              onClick={() => progressDialogItem ? void loadEpisodeDetail(progressDialogItem.malId, episode.number) : undefined}
                              className="min-w-0 flex-1 text-left"
                            >
                              {episode.videoImageUrl ? (
                                <div className="mb-1 overflow-hidden rounded border bg-muted/30">
                                  <img src={episode.videoImageUrl} alt="" className="h-16 w-full object-cover" />
                                </div>
                              ) : null}
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">Episódio {episode.number}</p>
                                {isLoadingDetail ? <Spinner className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                              </div>
                              <p className="line-clamp-1 text-xs text-muted-foreground">{episode.title ?? "--"}</p>
                              {(episode.filler || episode.recap) && (
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {episode.filler ? "Filler" : ""}{episode.filler && episode.recap ? " · " : ""}{episode.recap ? "Recap" : ""}
                                </p>
                              )}
                              {episode.videoUrl ? (
                                <a
                                  href={episode.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                  className="mt-1 inline-block text-[11px] font-medium underline underline-offset-2 hover:text-foreground"
                                >
                                  {episode.videoTitle ? `Vídeo: ${episode.videoTitle}` : "Ver vídeo"}
                                </a>
                              ) : null}
                            </button>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="mb-2 font-medium">
                  {episodeDetail ? `Episódio ${episodeDetail.number}` : "Detalhes do episódio"}
                </p>
                {loadingEpisodeDetailNumber !== null ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : episodeDetail ? (
                  <div className="space-y-2">
                    <p className="font-semibold">{episodeDetail.title ?? "--"}</p>
                    <p className="text-xs text-muted-foreground">
                      {episodeDetail.duration ? `${episodeDetail.duration}` : ""}
                      {episodeDetail.duration && episodeDetail.aired ? " · " : ""}
                      {episodeDetail.aired ? `${episodeDetail.aired}` : ""}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{episodeDetail.synopsis ?? "Sem sinopse."}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Clique em um episódio para ver os detalhes.</p>
                )}
                <div className="mt-4 rounded-md border bg-background px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Assistidos</p>
                  <p className="text-lg font-semibold">{episodeChecked.size}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProgressDialogItem(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveProgressDialog()} disabled={savingEpisodes || loadingEpisodes}>
              {savingEpisodes ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Salvando...
                </>
              ) : (
                "Salvar progresso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
