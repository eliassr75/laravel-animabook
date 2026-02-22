import { Link } from "@inertiajs/react";
import MediaActionButtons from "@/components/common/MediaActionButtons";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { translateCharacterRole, translateEntityKind } from "@/lib/labels";
import type { UserMediaActions } from "@/lib/media-actions";
import { displayText, hasText } from "@/lib/text";

interface CharacterDetailProps {
  entity: {
    malId: number;
    title: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    synopsis?: string | null;
  };
  related?: Array<{
    malId: number;
    title: string;
    subtitle?: string | null;
    role?: string | null;
    score?: number | null;
    status?: string | null;
    year?: number | null;
    imageUrl?: string | null;
    href?: string;
    mediaType?: "anime" | "manga" | null;
    userActions?: UserMediaActions | null;
  }>;
  relatedAnime?: Array<{
    malId: number;
    title: string;
    subtitle?: string | null;
    role?: string | null;
    score?: number | null;
    status?: string | null;
    year?: number | null;
    imageUrl?: string | null;
    href?: string;
    mediaType?: "anime" | "manga" | null;
    userActions?: UserMediaActions | null;
  }>;
  relatedManga?: Array<{
    malId: number;
    title: string;
    subtitle?: string | null;
    role?: string | null;
    score?: number | null;
    status?: string | null;
    year?: number | null;
    imageUrl?: string | null;
    href?: string;
    mediaType?: "anime" | "manga" | null;
    userActions?: UserMediaActions | null;
  }>;
}

export default function CharacterDetail({ entity, related = [], relatedAnime = [], relatedManga = [] }: CharacterDetailProps) {
  const animeItems = relatedAnime.length > 0 ? relatedAnime : related.filter((item) => item.subtitle === "anime");
  const mangaItems = relatedManga.length > 0 ? relatedManga : related.filter((item) => item.subtitle === "manga");

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="aspect-[3/4] overflow-hidden rounded-2xl border bg-muted/50">
            {entity.imageUrl ? (
              <img src={entity.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
                <span className="text-4xl font-heading font-bold text-primary/80">
                  {entity.title.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{entity.title}</h1>
              <p className="text-sm text-muted-foreground">{translateEntityKind(entity.subtitle, displayText(entity.subtitle))}</p>
            </div>
            {hasText(entity.synopsis) && (
              <p className="text-sm text-muted-foreground leading-relaxed">{entity.synopsis}</p>
            )}
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>

        {(animeItems.length > 0 || mangaItems.length > 0) && (
          <div className="mt-10">
            <h2 className="font-heading text-xl font-bold mb-4">Aparições</h2>
            {animeItems.length > 0 && (
              <section className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Animes</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {animeItems.map((item) => (
                    <RelatedCard key={item.malId} item={item} />
                  ))}
                </div>
              </section>
            )}
            {mangaItems.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mangá</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {mangaItems.map((item) => (
                    <RelatedCard key={item.malId} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function RelatedCard({
  item,
}: {
  item: {
    malId: number;
    title: string;
    subtitle?: string | null;
    role?: string | null;
    year?: number | null;
    imageUrl?: string | null;
    href?: string;
    mediaType?: "anime" | "manga" | null;
    userActions?: UserMediaActions | null;
  };
}) {
  const href = item.href ?? `/anime/${item.malId}`;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <Link href={href} className="block">
        <div className="relative aspect-[3/4] bg-muted/50">
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
              {translateEntityKind(item.subtitle, translateCharacterRole(item.role, "Registro"))}
            </span>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={href} className="block">
          <p className="text-sm font-semibold line-clamp-2">{item.title}</p>
        </Link>
        <div className="flex flex-wrap gap-1">
          {displayText(item.subtitle, "") && (
            <Badge variant="secondary" className="text-[10px]">{translateEntityKind(item.subtitle, displayText(item.subtitle))}</Badge>
          )}
          {hasText(item.role) && <Badge variant="outline" className="text-[10px]">{translateCharacterRole(item.role)}</Badge>}
          {item.year && <Badge variant="outline" className="text-[10px]">{item.year}</Badge>}
        </div>
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
