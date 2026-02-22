import { Link } from "@inertiajs/react";
import { BookOpen, Star, Users } from "lucide-react";
import MediaActionButtons from "@/components/common/MediaActionButtons";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { translateEntityKind, translateMediaType, translateStatus } from "@/lib/labels";
import type { UserMediaActions } from "@/lib/media-actions";
import { formatSeason } from "@/lib/season";
import { displayText, hasText } from "@/lib/text";

interface CatalogDetailProps {
  entityType?: string;
  entity?: {
    malId: number;
    title: string;
    subtitle?: string | null;
    type?: string | null;
    season?: string | null;
    score?: number | null;
    status?: string | null;
    year?: number | null;
    imageUrl?: string | null;
    synopsis?: string | null;
    genres?: Array<string | { id?: number | null; name: string }>;
    studios?: string[];
    stats?: Array<{ label: string; value: string }>;
    externalLinks?: Array<{ name: string; url: string }>;
  } | null;
  related?: Array<{
    malId: number;
    title: string;
    subtitle?: string | null;
    type?: string | null;
    season?: string | null;
    genreItems?: Array<{ id?: number | null; name: string }>;
    score?: number | null;
    status?: string | null;
    year?: number | null;
    imageUrl?: string | null;
    listHref?: string | null;
    mediaType?: "anime" | "manga" | null;
    userActions?: UserMediaActions | null;
  }>;
}

export default function CatalogDetail({ entityType, entity, related = [] }: CatalogDetailProps) {
  if (!entity) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
            {t("catalog.not_found")}
          </h1>
          <p className="text-muted-foreground">
            {t("catalog.not_available")}
          </p>
          <Link href="/">
            <Button variant="outline" className="mt-4">{t("common.back_home")}</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const listBase = entityType
    ? {
      anime: "/anime",
      manga: "/manga",
      character: "/characters",
      person: "/people",
      producer: "/producers",
      magazine: "/magazines",
      genre: "/genres",
      club: "/clubs",
      watch: "/watch",
    }[entityType]
    : undefined;

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
              <p className="text-sm text-muted-foreground">
                {entity.subtitle
                  ? translateEntityKind(entity.subtitle, displayText(entity.subtitle))
                  : translateStatus(entity.status, displayText(entity.status))}
              </p>
            </div>
            {entityType === "genre" && (
              <div className="flex flex-wrap gap-2">
                <Link href={`/anime?genre=${entity.malId}`}>
                  <Button size="sm">Ver animes desse gênero</Button>
                </Link>
                <Link href={`/manga?genre=${entity.malId}`}>
                  <Button size="sm" variant="outline">Ver mangás desse gênero</Button>
                </Link>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {entity.score ? <Badge variant="secondary">★ {entity.score.toFixed(1)}</Badge> : null}
              {entity.year ? (
                listBase && (entityType === "anime" || entityType === "manga") ? (
                  <Link href={`${listBase}?year=${encodeURIComponent(entity.year)}`}>
                    <Badge variant="outline">{entity.year}</Badge>
                  </Link>
                ) : (
                  <Badge variant="outline">{entity.year}</Badge>
                )
              ) : null}
              {(() => {
                const rawStatus = displayText(entity.status, "");
                const statusText = translateStatus(rawStatus, "");
                if (!statusText) {
                  return null;
                }
                return listBase && (entityType === "anime" || entityType === "manga") ? (
                  <Link href={`${listBase}?status=${encodeURIComponent(rawStatus)}`}>
                    <Badge variant="outline">{statusText}</Badge>
                  </Link>
                ) : (
                  <Badge variant="outline">{statusText}</Badge>
                );
              })()}
              {entity.season ? (
                listBase && (entityType === "anime" || entityType === "manga") ? (
                  <Link href={`${listBase}?season=${encodeURIComponent(entity.season)}`}>
                    <Badge variant="outline">{formatSeason(entity.season)}</Badge>
                  </Link>
                ) : (
                  <Badge variant="outline">{formatSeason(entity.season)}</Badge>
                )
              ) : null}
              {(() => {
                const rawType = displayText(entity.type, "");
                const typeText = translateMediaType(rawType, "");
                if (!typeText) {
                  return null;
                }
                return listBase && (entityType === "anime" || entityType === "manga") ? (
                  <Link href={`${listBase}?type=${encodeURIComponent(rawType)}`}>
                    <Badge variant="outline">{typeText}</Badge>
                  </Link>
                ) : (
                  <Badge variant="outline">{typeText}</Badge>
                );
              })()}
            </div>
            {entity.genres && entity.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entity.genres.map((g) => {
                  const genre = typeof g === "string" ? { name: g } : g;
                  const linkBase = listBase && (entityType === "anime" || entityType === "manga") ? listBase : null;
                  return genre.id && linkBase ? (
                    <Link key={`${genre.id}-${genre.name}`} href={`${linkBase}?genre=${encodeURIComponent(genre.id)}`}>
                      <Badge variant="secondary" className="text-xs">{genre.name}</Badge>
                    </Link>
                  ) : (
                    <Badge key={genre.name} variant="secondary" className="text-xs">{genre.name}</Badge>
                  );
                })}
              </div>
            )}
            {hasText(entity.synopsis) && (
              <p className="text-sm text-muted-foreground leading-relaxed">{entity.synopsis}</p>
            )}
            {entity.stats && entity.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {entity.stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-4 w-4" /> {t("common.type")}
                </div>
                <p className="mt-1 font-semibold">{translateEntityKind(entity.subtitle, displayText(entity.subtitle, "—"))}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-4 w-4" /> {t("common.community")}
                </div>
                <p className="mt-1 font-semibold">{t("common.official_data")}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Star className="h-4 w-4" /> {t("common.score")}
                </div>
                <p className="mt-1 font-semibold">{entity.score ? entity.score.toFixed(1) : "—"}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-4 w-4" /> {t("common.status")}
                </div>
                <p className="mt-1 font-semibold">{translateStatus(entity.status, displayText(entity.status, "—"))}</p>
              </div>
            </div>
            {entity.externalLinks && entity.externalLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entity.externalLinks.slice(0, 5).map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent underline underline-offset-4"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            )}
            <Link href="/">
              <Button variant="outline">{t("common.back")}</Button>
            </Link>
          </div>
        </div>
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-heading text-xl font-bold mb-4">{t("common.related")}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {related.map((item) => (
                <div key={item.malId} className="rounded-2xl border bg-card overflow-hidden">
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
                        {translateMediaType(item.type, translateEntityKind(item.subtitle, "Registro"))}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold line-clamp-2">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.subtitle
                        ? translateEntityKind(item.subtitle, displayText(item.subtitle, "—"))
                        : translateStatus(item.status, displayText(item.status, "—"))}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.type && item.listHref ? (
                        <Link href={`${item.listHref}?type=${encodeURIComponent(item.type)}`}>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {translateMediaType(item.type)}
                          </Badge>
                        </Link>
                      ) : null}
                      {item.year && item.listHref ? (
                        <Link href={`${item.listHref}?year=${encodeURIComponent(item.year)}`}>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {item.year}
                          </Badge>
                        </Link>
                      ) : null}
                      {item.status && item.listHref ? (
                        <Link href={`${item.listHref}?status=${encodeURIComponent(item.status)}`}>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {translateStatus(item.status)}
                          </Badge>
                        </Link>
                      ) : null}
                      {item.genreItems?.slice(0, 1).map((genre) =>
                        genre.id && item.listHref ? (
                          <Link key={`${genre.id}-${genre.name}`} href={`${item.listHref}?genre=${encodeURIComponent(genre.id)}`}>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {genre.name}
                            </Badge>
                          </Link>
                        ) : null,
                      )}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
