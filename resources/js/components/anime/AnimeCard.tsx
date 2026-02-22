import { Link } from "@inertiajs/react";
import { Star, Tv, Film } from "lucide-react";
import MediaActionButtons from "@/components/common/MediaActionButtons";
import { Badge } from "@/components/ui/badge";
import { CARD_GRADIENTS, type AnimeItem } from "@/data/mock";
import { translateMediaType } from "@/lib/labels";

interface AnimeCardProps {
  anime: AnimeItem;
  showRank?: boolean;
  hrefBase?: string;
}

export default function AnimeCard({ anime, showRank, hrefBase = "/anime" }: AnimeCardProps) {
  const gradient = CARD_GRADIENTS[anime.colorIndex % CARD_GRADIENTS.length];
  const mediaType = hrefBase.startsWith("/manga") ? "manga" : "anime";

  return (
    <div className="group rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <Link href={`${hrefBase}/${anime.malId}`} className="block">
        <div className={`relative aspect-[3/4] bg-gradient-to-br ${gradient} flex items-end p-3`}>
          {anime.imageUrl ? (
            <img src={anime.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          {!anime.imageUrl && (
            <span className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {translateMediaType(anime.type, "Mídia")}
            </span>
          )}
          {showRank && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
              #{anime.rank}
            </span>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded-md">
            <Star className="h-3 w-3 text-accent fill-accent" />
            {anime.score.toFixed(1)}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="relative text-white text-sm font-bold leading-tight drop-shadow-lg line-clamp-2">
            {anime.title}
          </span>
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <Link href={`${hrefBase}/${anime.malId}`} className="block">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {anime.type === "TV" ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
            <span>{translateMediaType(anime.type, "--")}</span>
            {anime.episodes && <span>· {anime.episodes} epis.</span>}
            <span>· {anime.year}</span>
          </div>
        </Link>
        <div className="flex flex-wrap gap-1">
          {(anime.genreItems?.length ? anime.genreItems : anime.genres.map((g) => ({ name: g, id: null })))
            .slice(0, 2)
            .map((g) =>
              g.id ? (
                <Link key={`${g.id}-${g.name}`} href={`/${mediaType}?genre=${encodeURIComponent(g.id)}`}>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {g.name}
                  </Badge>
                </Link>
              ) : (
                <Badge key={g.name} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {g.name}
                </Badge>
              ),
            )}
        </div>

        <MediaActionButtons
          mediaType={mediaType}
          malId={anime.malId}
          initialState={anime.userActions}
          className="pt-1"
        />
      </div>
    </div>
  );
}
