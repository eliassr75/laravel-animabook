import { authJsonHeaders } from "@/lib/http";
import type { MediaType } from "@/lib/media-actions";

export interface SavedReviewPayload {
  score: number;
  review: string;
  isSpoiler?: boolean;
}

export async function saveMediaReview(payload: {
  mediaType: MediaType;
  malId: number;
  score: number;
  review: string;
  isSpoiler?: boolean;
}): Promise<SavedReviewPayload> {
  const response = await fetch("/app/media-reviews", {
    method: "POST",
    headers: authJsonHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({
      media_type: payload.mediaType,
      mal_id: payload.malId,
      score: payload.score,
      review: payload.review,
      is_spoiler: payload.isSpoiler ?? false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar avaliação (${response.status})`);
  }

  const json = await response.json() as { review?: { score?: number; content?: string; isSpoiler?: boolean } };
  return {
    score: Number(json.review?.score ?? payload.score),
    review: String(json.review?.content ?? payload.review),
    isSpoiler: Boolean(json.review?.isSpoiler ?? payload.isSpoiler ?? false),
  };
}

export async function removeMediaReview(payload: {
  mediaType: MediaType;
  malId: number;
}): Promise<void> {
  const response = await fetch("/app/media-reviews", {
    method: "DELETE",
    headers: authJsonHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({
      media_type: payload.mediaType,
      mal_id: payload.malId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao remover avaliação (${response.status})`);
  }
}
