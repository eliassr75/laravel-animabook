import { Link } from "@inertiajs/react";
import { Star } from "lucide-react";
import MediaActionButtons from "@/components/common/MediaActionButtons";
import { translateEntityKind, translateMediaType, translateStatus } from "@/lib/labels";
import type { UserMediaActions } from "@/lib/media-actions";
import { formatSeason } from "@/lib/season";
import { displayText, hasText } from "@/lib/text";
import { cn } from "@/lib/utils";

export interface EntityCardItem {
  malId: number;
  title: string;
  subtitle?: string | null;
  type?: string | null;
  season?: string | null;
  genreItems?: { id?: number | null; name: string }[];
  score?: number | null;
  rank?: number | null;
  status?: string | null;
  year?: number | null;
  imageUrl?: string | null;
  href?: string;
  listHref?: string | null;
  mediaType?: "anime" | "manga" | null;
  userActions?: UserMediaActions | null;
}

export default function EntityCard({ item }: { item: EntityCardItem }) {
  const href = item.href ?? `/anime/${item.malId}`;

  return (
    <div className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link href={href} className="block">
        <div className={cn("relative aspect-[3/4] bg-muted/60")}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
              <span className="text-3xl font-heading font-bold text-primary/80">
                {item.title.charAt(0)}
              </span>
            </div>
          )}
          {!item.imageUrl && (
            <span className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {translateMediaType(item.type, translateEntityKind(item.subtitle, "Registro"))}
            </span>
          )}
          {typeof item.score === "number" && Number.isFinite(item.score) ? (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold text-foreground shadow">
              <Star className="h-3 w-3 text-accent" />
              {item.score.toFixed(1)}
            </div>
          ) : null}
        </div>
      </Link>
      <div className="space-y-1 p-3">
        <Link href={href} className="block">
          <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {item.subtitle
              ? translateEntityKind(item.subtitle, displayText(item.subtitle, "—"))
              : item.type
                ? translateMediaType(item.type, displayText(item.type, "—"))
                : translateStatus(item.status, displayText(item.status, "—"))}
            {item.year ? ` · ${item.year}` : ""}
            {hasText(item.season) ? ` · ${formatSeason(item.season)}` : ""}
          </p>
        </Link>
        {item.genreItems && item.genreItems.length > 0 && item.listHref ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.genreItems.slice(0, 2).map((genre) =>
              genre.id ? (
                <Link
                  key={`${genre.id}-${genre.name}`}
                  href={`${item.listHref}?genre=${encodeURIComponent(genre.id)}`}
                >
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                    {genre.name}
                  </span>
                </Link>
              ) : (
                <span
                  key={genre.name}
                  className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                >
                  {genre.name}
                </span>
              ),
            )}
          </div>
        ) : null}
        {item.mediaType ? (
          <MediaActionButtons
            mediaType={item.mediaType}
            malId={item.malId}
            initialState={item.userActions}
            className="mt-2"
          />
        ) : null}
      </div>
    </div>
  );
}
