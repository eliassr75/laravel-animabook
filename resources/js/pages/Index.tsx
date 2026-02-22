import { Link, usePage } from "@inertiajs/react";
import { Calendar, Sparkles, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import AnimeCard from "@/components/anime/AnimeCard";
import ScoreBadge from "@/components/common/ScoreBadge";
import SectionHeader from "@/components/common/SectionHeader";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { type AnimeItem, type ReviewItem } from "@/data/mock";

interface HomeProps {
  topAnime?: AnimeItem[];
  currentSeason?: AnimeItem[];
  recommendations?: AnimeItem[];
  recentReviews?: ReviewItem[];
  recentNews?: Array<{
    id: number;
    title: string;
    excerpt?: string;
    url?: string;
    author?: string;
    date?: string;
    mediaType?: "anime" | "manga";
    mediaMalId?: number;
    mediaTitle?: string;
  }>;
  baseStats?: {
    counts?: Record<string, number>;
    statusDistribution?: {
      anime?: Array<{ label: string; value: number }>;
      manga?: Array<{ label: string; value: number }>;
    };
    topGenres?: Array<{ label: string; value: number }>;
    ingestTrend?: Array<{ label: string; value: number }>;
    quality?: {
      withImage?: number;
      withSynopsis?: number;
      withScore?: number;
      catalogTotal?: number;
    };
  };
}

export default function Home({
  topAnime = [],
  currentSeason = [],
  recommendations = [],
  recentReviews = [],
  recentNews = [],
  baseStats,
}: HomeProps) {
  const page = usePage<{ auth?: { user?: { id: number; name?: string } | null } }>();
  const user = page.props.auth?.user ?? null;
  const isLoggedIn = Boolean(user?.id);
  const counts = baseStats?.counts ?? {};
  const topGenres = baseStats?.topGenres ?? [];
  const ingestTrend = baseStats?.ingestTrend ?? [];
  const quality = baseStats?.quality ?? {};
  const animeStatus = baseStats?.statusDistribution?.anime ?? [];
  const mangaStatus = baseStats?.statusDistribution?.manga ?? [];
  const maxGenre = Math.max(1, ...topGenres.map((item) => item.value));
  const maxIngest = Math.max(1, ...ingestTrend.map((item) => item.value));
  const maxAnimeStatus = Math.max(1, ...animeStatus.map((item) => item.value));
  const maxMangaStatus = Math.max(1, ...mangaStatus.map((item) => item.value));

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-xl animate-[slide-up_0.6s_ease-out]">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Descubra seu próximo anime favorito
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Explore milhares de animes e mangás, organize sua watchlist e compartilhe suas avaliações com a comunidade.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/anime">
                <Button variant="hero">
                  Explorar Animes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/app/watchlist">
                <Button variant="outline" size="lg">
                  Minha lista
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-16 py-12">
        <section>
          <SectionHeader title="Dados da base" />
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Animes" value={counts.anime ?? 0} />
            <StatCard label="Mangás" value={counts.manga ?? 0} />
            <StatCard label="Personagens" value={counts.character ?? 0} />
            <StatCard label="Pessoas" value={counts.person ?? 0} />
          </div>
          <div className="mb-4 grid gap-4 lg:grid-cols-3">
            <ChartCard title="Top gêneros da base">
              {topGenres.length > 0 ? topGenres.map((item) => (
                <BarLine key={item.label} label={item.label} value={item.value} max={maxGenre} />
              )) : <EmptyInline text="Sem dados de gênero ainda." />}
            </ChartCard>
            <ChartCard title="Cadastros (últimos 14 dias)">
              {ingestTrend.length > 0 ? (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total no período: {ingestTrend.reduce((sum, item) => sum + item.value, 0).toLocaleString("pt-BR")}</span>
                    <span>Pico diário: {maxIngest.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-2">
                    <div className="flex items-end gap-1">
                      {ingestTrend.map((item, index) => {
                        const showLabel =
                          index === 0 ||
                          index === ingestTrend.length - 1 ||
                          index === Math.floor((ingestTrend.length - 1) / 2);

                        return (
                          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center">
                            <div
                              className="w-full rounded-sm bg-primary/80 transition-[height] duration-300"
                              style={{ height: `${Math.max(4, Math.round((item.value / maxIngest) * 72))}px` }}
                              title={`${item.label}: ${item.value}`}
                            />
                            <p className="mt-1 h-3 text-[10px] text-muted-foreground">{showLabel ? item.label : ""}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : <EmptyInline text="Sem eventos de ingestão no período." />}
            </ChartCard>
            <ChartCard title="Qualidade da base">
              <BarLine label="Com imagem" value={Number(quality.withImage ?? 0)} max={100} suffix="%" />
              <BarLine label="Com sinopse" value={Number(quality.withSynopsis ?? 0)} max={100} suffix="%" />
              <BarLine label="Com nota" value={Number(quality.withScore ?? 0)} max={100} suffix="%" />
              <p className="mt-2 text-xs text-muted-foreground">Catálogo avaliado: {(quality.catalogTotal ?? 0).toLocaleString("pt-BR")} itens</p>
            </ChartCard>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Status de Anime">
              {animeStatus.length > 0 ? animeStatus.map((item) => (
                <BarLine key={item.label} label={item.label} value={item.value} max={maxAnimeStatus} />
              )) : <EmptyInline text="Sem dados de status para anime." />}
            </ChartCard>
            <ChartCard title="Status de Mangá">
              {mangaStatus.length > 0 ? mangaStatus.map((item) => (
                <BarLine key={item.label} label={item.label} value={item.value} max={maxMangaStatus} />
              )) : <EmptyInline text="Sem dados de status para mangá." />}
            </ChartCard>
          </div>
        </section>

        {/* Ranking de animes */}
        <section className="animate-[fade-in_0.5s_ease-out]">
          <SectionHeader title="Ranking de animes" href="/top" />
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {topAnime.slice(0, 3).map((anime) => (
                <div key={anime.malId} className={anime.rank === 1 ? "ring-2 ring-amber-400/60 rounded-xl" : ""}>
                  <AnimeCard anime={anime} showRank />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {topAnime.slice(3).map((anime) => (
                <AnimeCard key={anime.malId} anime={anime} showRank />
              ))}
            </div>
          </div>
        </section>

        {/* Current Season */}
        <section>
          <SectionHeader title="Temporada Atual" href="/seasons" />
          {currentSeason.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentSeason.map((anime) => (
                <AnimeCard key={anime.malId} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl border p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum anime da temporada atual encontrado.</p>
            </div>
          )}
        </section>

        {/* Recommendations */}
        <section>
          <SectionHeader title="Recomendações" href="/anime" linkText="Ver todos" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.map((anime) => (
              <AnimeCard key={anime.malId} anime={anime} />
            ))}
          </div>
        </section>

        {/* Recent Reviews */}
        <section>
          <SectionHeader title="Avaliações recentes" />
          {recentReviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`${review.mediaType === "manga" ? "/manga" : "/anime"}/${review.animeMalId}`}
                  className="block bg-card rounded-xl border p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-heading font-semibold hover:text-accent transition-colors">
                        {review.animeTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">por {review.user} · {review.date}</p>
                    </div>
                    <ScoreBadge score={review.score} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{review.content}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              Ainda não temos avaliações sincronizadas para mostrar.
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Notícias recentes" />
          {recentNews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recentNews.map((item) => (
                <article key={item.id} className="rounded-xl border bg-card p-4">
                  <Link
                    href={`${item.mediaType === "manga" ? "/manga" : "/anime"}/${item.mediaMalId ?? 0}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {item.mediaTitle ?? "—"}
                  </Link>
                  <h3 className="mt-1 text-sm font-semibold leading-snug">{item.title}</h3>
                  {item.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>{item.author || "Fonte externa"} · {item.date || "—"}</span>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                        Ler fonte
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              Sem notícias sincronizadas no momento.
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-80" />
          {isLoggedIn ? (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Continue sua jornada{user?.name ? `, ${user.name}` : ""}</h2>
              <p className="opacity-80 max-w-md mx-auto mb-6">
                Gerencie sua lista, atualize progresso e acompanhe seus títulos favoritos.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/app/watchlist">
                  <Button variant="secondary" size="lg">Ver minha lista</Button>
                </Link>
                <Link href="/app/perfil">
                  <Button variant="outline" size="lg" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                    Ver perfil
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Comece a organizar seus animes</h2>
              <p className="opacity-80 max-w-md mx-auto mb-6">
                Crie sua conta gratuita, monte sua watchlist e participe das votações da comunidade.
              </p>
              <Link href="/register">
                <Button variant="secondary" size="lg">Criar conta gratuita</Button>
              </Link>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BarLine({
  label,
  value,
  max,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const safeMax = max <= 0 ? 1 : max;
  const width = Math.max(2, Math.round((value / safeMax) * 100));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toLocaleString("pt-BR")}{suffix}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyInline({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground">{text}</p>;
}
