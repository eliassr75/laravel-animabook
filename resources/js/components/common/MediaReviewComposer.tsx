import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { MediaType } from "@/lib/media-actions";
import { removeMediaReview, saveMediaReview } from "@/lib/media-reviews";
import { notify } from "@/lib/notify";

interface MediaReviewComposerProps {
  mediaType: MediaType;
  malId: number;
  initialReview?: {
    score: number;
    content: string;
    isSpoiler?: boolean;
  } | null;
  onChanged?: (review: { score: number; content: string; isSpoiler?: boolean } | null) => void;
}

export default function MediaReviewComposer({
  mediaType,
  malId,
  initialReview = null,
  onChanged,
}: MediaReviewComposerProps) {
  const page = usePage<{ auth?: { user?: { id: number } | null } }>();
  const isLoggedIn = Boolean(page.props.auth?.user?.id);
  const [score, setScore] = useState<number>(Number(initialReview?.score ?? 8));
  const [review, setReview] = useState<string>(initialReview?.content ?? "");
  const [isSpoiler, setIsSpoiler] = useState<boolean>(Boolean(initialReview?.isSpoiler));
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  useEffect(() => {
    setScore(Number(initialReview?.score ?? 8));
    setReview(initialReview?.content ?? "");
    setIsSpoiler(Boolean(initialReview?.isSpoiler));
  }, [initialReview]);

  const save = async () => {
    if (!isLoggedIn) {
      notify("Faça login para publicar uma avaliação.", "error");
      return;
    }

    if (review.trim().length < 20) {
      notify("Escreva pelo menos 20 caracteres na avaliação.", "error");
      return;
    }

    try {
      setBusy("save");
      const saved = await saveMediaReview({
        mediaType,
        malId,
        score,
        review,
        isSpoiler,
      });
      setScore(saved.score);
      setReview(saved.review);
      setIsSpoiler(Boolean(saved.isSpoiler));
      onChanged?.({
        score: saved.score,
        content: saved.review,
        isSpoiler: Boolean(saved.isSpoiler),
      });
      notify("Avaliação salva com sucesso.", "success");
    } catch {
      notify("Não foi possível salvar sua avaliação.", "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!isLoggedIn) {
      notify("Faça login para remover sua avaliação.", "error");
      return;
    }

    try {
      setBusy("delete");
      await removeMediaReview({ mediaType, malId });
      setReview("");
      setIsSpoiler(false);
      onChanged?.(null);
      notify("Avaliação removida.", "success");
    } catch {
      notify("Não foi possível remover sua avaliação.", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5">
      <h3 className="text-sm font-semibold">{initialReview ? "Sua avaliação" : "Publicar avaliação"}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Formato compatível com o padrão de reviews importadas do Jikan.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr] md:items-start">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Nota (0-10)</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={Number.isFinite(score) ? score : 0}
            onChange={(event) => setScore(Number(event.target.value))}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Texto da avaliação</span>
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="Conte sua experiência com a obra..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed"
          />
          <span className="text-[11px] text-muted-foreground">{review.trim().length}/4000</span>
        </label>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={isSpoiler}
          onChange={(event) => setIsSpoiler(event.target.checked)}
          className="h-4 w-4 rounded border"
        />
        Contém spoiler
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={busy !== null}>
          {busy === "save" ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {initialReview ? "Atualizar avaliação" : "Publicar avaliação"}
        </Button>
        {initialReview ? (
          <Button type="button" variant="outline" onClick={remove} disabled={busy !== null}>
            {busy === "delete" ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Remover
          </Button>
        ) : null}
      </div>
    </section>
  );
}
