import { authJsonHeaders } from "@/lib/http";
import type { MediaType } from "@/lib/media-actions";

export async function saveMediaScore(payload: {
  mediaType: MediaType;
  malId: number;
  userScore: number | null;
}): Promise<number | null> {
  const response = await fetch("/app/media-score", {
    method: "POST",
    headers: authJsonHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({
      media_type: payload.mediaType,
      mal_id: payload.malId,
      user_score: payload.userScore,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar nota (${response.status})`);
  }

  const json = await response.json() as { user_score?: number | null };
  return typeof json.user_score === "number" ? json.user_score : null;
}
