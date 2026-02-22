import { authJsonHeaders } from "@/lib/http";

interface EpisodeListItem {
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
}

interface EpisodeDetailItem {
  number: number;
  title?: string | null;
  titleJapanese?: string | null;
  duration?: string | null;
  aired?: string | null;
  synopsis?: string | null;
  filler?: boolean;
  recap?: boolean;
}

export async function listAnimeEpisodes(malId: number, force = false): Promise<EpisodeListItem[]> {
  let page = 1;
  let hasNext = true;
  const all: EpisodeListItem[] = [];

  while (hasNext) {
    const response = await fetch(`/anime/${malId}/episodes?page=${page}${force ? "&force=1" : ""}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar episódios (${response.status})`);
    }

    const json = await response.json() as { items?: EpisodeListItem[]; pagination?: { has_next_page?: boolean } };
    all.push(...(json.items ?? []));
    hasNext = Boolean(json.pagination?.has_next_page);
    page += 1;
    if (page > 60) {
      break;
    }
  }

  if (all.length === 0 && !force) {
    return listAnimeEpisodes(malId, true);
  }

  return all
    .map((item) => ({
      ...item,
      number: Number(item.number),
      aired: typeof item.aired === "string" ? item.aired : null,
      title: item.title ?? null,
      titleJapanese: item.titleJapanese ?? null,
      videoUrl: item.videoUrl ?? null,
      videoTitle: item.videoTitle ?? null,
      videoImageUrl: item.videoImageUrl ?? null,
    }))
    .filter((item) => Number.isFinite(item.number) && item.number > 0);
}

export async function showAnimeEpisode(malId: number, episode: number): Promise<EpisodeDetailItem | null> {
  const response = await fetch(`/anime/${malId}/episodes/${episode}`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar episódio (${response.status})`);
  }

  const json = await response.json() as { item?: EpisodeDetailItem };
  return json.item ?? null;
}

export async function saveEpisodeProgress(malId: number, watchedEpisodes: number[]): Promise<{ progress: number; watchedEpisodes: number[] }> {
  const response = await fetch("/app/media-episode-progress", {
    method: "POST",
    headers: authJsonHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({
      media_type: "anime",
      mal_id: malId,
      watched_episodes: watchedEpisodes,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar progresso (${response.status})`);
  }

  const json = await response.json() as { progress?: number; watched_episodes?: number[] };
  return {
    progress: json.progress ?? watchedEpisodes.length,
    watchedEpisodes: (json.watched_episodes ?? watchedEpisodes).map((item) => Number(item)),
  };
}
