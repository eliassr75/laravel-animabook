import { authJsonHeaders } from "@/lib/http";

export type MediaType = "anime" | "manga";
export type MediaStatus = "assistindo" | "completo" | "dropado" | null;
export type MediaAction = "favorite" | "watching" | "completed" | "dropped";

export interface UserMediaActions {
  favorite: boolean;
  status: MediaStatus;
}

export async function applyMediaAction(payload: {
  mediaType: MediaType;
  malId: number;
  action: MediaAction;
}): Promise<UserMediaActions> {
  const response = await fetch("/app/media-actions", {
    method: "POST",
    headers: authJsonHeaders(),
    credentials: "same-origin",
    body: JSON.stringify({
      media_type: payload.mediaType,
      mal_id: payload.malId,
      action: payload.action,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao salvar ação (${response.status})`);
  }

  const json = await response.json() as { state?: UserMediaActions };
  return json.state ?? { favorite: false, status: null };
}
