import { Search, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import AnimeCard from "@/components/anime/AnimeCard";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type AnimeItem } from "@/data/mock";

interface FavoritesProps {
  favorites?: AnimeItem[];
}

export default function Favorites({ favorites = [] }: FavoritesProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "anime" | "manga">("all");

  const filteredFavorites = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return favorites.filter((item) => {
      const type = item.mediaType ?? "anime";
      if (typeFilter !== "all" && type !== typeFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }

      return item.title.toLowerCase().includes(normalized)
        || (item.titleJapanese ?? "").toLowerCase().includes(normalized)
        || item.genres.some((genre) => genre.toLowerCase().includes(normalized));
    });
  }, [favorites, query, typeFilter]);

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="h-6 w-6 text-destructive" />
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Meus Favoritos</h1>
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nos favoritos"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={typeFilter === "all" ? "default" : "outline"} onClick={() => setTypeFilter("all")}>
              Todos ({favorites.length})
            </Button>
            <Button type="button" size="sm" variant={typeFilter === "anime" ? "default" : "outline"} onClick={() => setTypeFilter("anime")}>
              Anime ({favorites.filter((item) => (item.mediaType ?? "anime") === "anime").length})
            </Button>
            <Button type="button" size="sm" variant={typeFilter === "manga" ? "default" : "outline"} onClick={() => setTypeFilter("manga")}>
              Mangá ({favorites.filter((item) => item.mediaType === "manga").length})
            </Button>
          </div>
        </div>

        {filteredFavorites.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <p className="font-medium">Nenhum favorito encontrado.</p>
            <p className="mt-1 text-sm text-muted-foreground">Ajuste sua busca/filtro ou adicione novos favoritos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredFavorites.map((anime) => (
              <AnimeCard
                key={`${anime.mediaType ?? "anime"}-${anime.malId}`}
                anime={anime}
                hrefBase={anime.mediaType === "manga" ? "/manga" : "/anime"}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
