import { Link } from "@inertiajs/react";
import {
  BarChart3,
  CheckCircle,
  Clock3,
  Database,
  Eye,
  Globe,
  Heart,
  ListChecks,
  Mail,
  PauseCircle,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { authJsonHeaders } from "@/lib/http";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { logout } from "@/routes";
import { edit as editProfile } from "@/routes/profile";
import { edit as editPassword } from "@/routes/user-password";

type TabId = "resumo" | "conta" | "admin-dashboard" | "admin-users" | "admin-top" | "admin-seo" | "admin-sitemap";

type TrendPoint = {
  label: string;
  value: number;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string | null;
  statusesCount: number;
  favoritesCount: number;
  reviewsCount: number;
  votesCount: number;
  activityScore: number;
  isMaster?: boolean;
};

type AdminUsersMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

type SeoGlobalConfig = {
  site_name?: string;
  title_suffix?: string;
  default_title?: string;
  default_description?: string;
  default_image?: string;
  robots_default?: string;
  twitter_site?: string;
  noindex_query_pages?: boolean;
};

type SeoConfig = {
  global?: SeoGlobalConfig;
  static?: Record<string, unknown>;
  dynamic?: Record<string, unknown>;
  sitemap?: Record<string, unknown>;
};

type AdminPayload = {
  overview: {
    usersTotal: number;
    usersVerified: number;
    usersNew7d: number;
    catalogTotal: number;
    animeTotal: number;
    mangaTotal: number;
    charactersTotal: number;
    peopleTotal: number;
    favoritesTotal: number;
    statusesTotal: number;
    reviewsTotal: number;
    votesTotal: number;
  };
  trends: {
    registrations: TrendPoint[];
    catalogIngest: TrendPoint[];
    interactions: TrendPoint[];
  };
  topUsers: AdminUser[];
  users: AdminUser[];
  usersMeta: AdminUsersMeta;
  seoConfig: SeoConfig;
};

interface ProfileProps {
  profile?: { name: string; email: string };
  stats?: {
    watching: number;
    completed: number;
    dropped: number;
    paused: number;
    planned: number;
    favorites: number;
    trackedTotal: number;
    meanScore: number;
  };
  isMaster?: boolean;
  admin?: AdminPayload | null;
}

export default function Profile({ profile, stats, isMaster = false, admin }: ProfileProps) {
  const user = profile ?? { name: "Usuário", email: "" };
  const resolvedStats = stats ?? {
    watching: 0,
    completed: 0,
    dropped: 0,
    paused: 0,
    planned: 0,
    favorites: 0,
    trackedTotal: 0,
    meanScore: 0,
  };

  const tabs = useMemo(
    () => [
      { id: "resumo" as TabId, label: "Resumo", icon: BarChart3 },
      { id: "conta" as TabId, label: "Conta", icon: Settings },
      ...(isMaster
        ? [
          { id: "admin-dashboard" as TabId, label: "Dashboard Admin", icon: Shield },
          { id: "admin-users" as TabId, label: "Gestão de Usuários", icon: Users },
          { id: "admin-top" as TabId, label: "Top Usuários", icon: Trophy },
          { id: "admin-seo" as TabId, label: "SEO", icon: Globe },
          { id: "admin-sitemap" as TabId, label: "Sitemap", icon: Database },
        ]
        : []),
    ],
    [isMaster],
  );

  const [activeTab, setActiveTab] = useState<TabId>(isMaster ? "admin-dashboard" : "resumo");
  const [users, setUsers] = useState<AdminUser[]>(admin?.users ?? []);
  const [usersMeta, setUsersMeta] = useState<AdminUsersMeta>(
    admin?.usersMeta ?? {
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      total: 0,
    },
  );
  const [usersSearch, setUsersSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  const initialSeo = normalizeSeoConfig(admin?.seoConfig);
  const [seoGlobal, setSeoGlobal] = useState<SeoGlobalConfig>(initialSeo.global);
  const [seoStaticText, setSeoStaticText] = useState(prettyJson(initialSeo.static));
  const [seoDynamicText, setSeoDynamicText] = useState(prettyJson(initialSeo.dynamic));
  const [seoSitemapText, setSeoSitemapText] = useState(prettyJson(initialSeo.sitemap));
  const [seoSaving, setSeoSaving] = useState(false);

  const [sitemapWriteFile, setSitemapWriteFile] = useState(false);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [sitemapResult, setSitemapResult] = useState<{ urlCount: number; written: boolean } | null>(null);

  const totalTracked = Math.max(0, resolvedStats.trackedTotal);
  const completionRate = totalTracked > 0 ? Math.round((resolvedStats.completed / totalTracked) * 100) : 0;
  const statusCards = [
    { label: "Assistindo", value: resolvedStats.watching, icon: Eye, color: "text-accent" },
    { label: "Completos", value: resolvedStats.completed, icon: CheckCircle, color: "text-primary" },
    { label: "Pausados", value: resolvedStats.paused, icon: PauseCircle, color: "text-secondary-foreground" },
    { label: "Dropados", value: resolvedStats.dropped, icon: XCircle, color: "text-destructive" },
    { label: "Planejados", value: resolvedStats.planned, icon: Clock3, color: "text-muted-foreground" },
  ];
  const distribution = statusCards.map((item) => ({
    ...item,
    percent: totalTracked > 0 ? Math.round((item.value / totalTracked) * 100) : 0,
  }));

  const adminOverview = admin?.overview;
  const adminTrends = admin?.trends;
  const adminTopUsers = admin?.topUsers ?? [];

  const loadUsers = useCallback(
    async (page = 1, search = usersSearch) => {
      if (!isMaster) {
        return;
      }

      const perPage = usersMeta.perPage || 15;
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      if (search.trim() !== "") {
        params.set("search", search.trim());
      }

      setUsersLoading(true);

      try {
        const response = await fetch(`/app/admin/users?${params.toString()}`, {
          method: "GET",
          headers: authJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar os usuários.");
        }

        const json = await response.json() as { items?: AdminUser[]; meta?: AdminUsersMeta };
        setUsers(Array.isArray(json.items) ? json.items : []);
        setUsersMeta(
          json.meta ?? {
            currentPage: page,
            lastPage: 1,
            perPage,
            total: 0,
          },
        );
      } catch (error) {
        notify(error instanceof Error ? error.message : "Falha ao carregar usuários.", "error");
      } finally {
        setUsersLoading(false);
      }
    },
    [isMaster, usersMeta.perPage, usersSearch],
  );

  useEffect(() => {
    if (!isMaster || activeTab !== "admin-users" || users.length > 0) {
      return;
    }

    void loadUsers(1, "");
  }, [activeTab, isMaster, users.length, loadUsers]);

  async function handleSeoSave() {
    if (!isMaster) {
      return;
    }

    setSeoSaving(true);

    try {
      const staticConfig = parseJsonObject(seoStaticText, "rotas estáticas");
      const dynamicConfig = parseJsonObject(seoDynamicText, "rotas dinâmicas");
      const sitemapConfig = parseJsonObject(seoSitemapText, "sitemap");

      const payload = {
        global: seoGlobal,
        static: staticConfig,
        dynamic: dynamicConfig,
        sitemap: sitemapConfig,
      };

      const response = await fetch("/app/admin/seo", {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Não foi possível salvar as configurações de SEO.");
      }

      const json = await response.json() as { config?: SeoConfig };
      const savedConfig = normalizeSeoConfig(json.config);

      setSeoGlobal(savedConfig.global);
      setSeoStaticText(prettyJson(savedConfig.static));
      setSeoDynamicText(prettyJson(savedConfig.dynamic));
      setSeoSitemapText(prettyJson(savedConfig.sitemap));

      notify("Configurações de SEO atualizadas.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Falha ao salvar SEO.", "error");
    } finally {
      setSeoSaving(false);
    }
  }

  async function handleSitemapRefresh() {
    if (!isMaster) {
      return;
    }

    setSitemapLoading(true);

    try {
      const response = await fetch("/app/admin/sitemap/refresh", {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({
          write_file: sitemapWriteFile,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar o sitemap.");
      }

      const json = await response.json() as {
        result?: { url_count?: number; written?: boolean };
      };

      const result = {
        urlCount: Number(json.result?.url_count ?? 0),
        written: Boolean(json.result?.written ?? false),
      };

      setSitemapResult(result);
      notify("Sitemap atualizado com sucesso.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Falha ao atualizar sitemap.", "error");
    } finally {
      setSitemapLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <section className="mb-6 rounded-2xl border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-2xl font-bold">{user.name}</h1>
                  {isMaster ? <Badge className="bg-primary/90">Master</Badge> : null}
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button variant="outline" asChild>
                <Link href="/app/watchlist">Minha Lista</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app/favoritos">Favoritos</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={editProfile()}>Editar perfil</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={editPassword()}>Senha</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border bg-card p-2">
          <div className="flex gap-2 overflow-x-auto p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "resumo" ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <KpiCard icon={ListChecks} label="Na Lista" value={totalTracked} />
              <KpiCard icon={Heart} label="Favoritos" value={resolvedStats.favorites} />
              <KpiCard icon={Star} label="Nota Média" value={resolvedStats.meanScore.toFixed(1)} />
              <KpiCard icon={TrendingUp} label="Conclusão" value={`${completionRate}%`} />
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              {statusCards.map((item) => (
                <div key={item.label} className="rounded-xl border bg-card p-4 text-center">
                  <item.icon className={`mx-auto mb-2 h-5 w-5 ${item.color}`} />
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-heading text-base font-semibold">Distribuição da Lista</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Visão rápida por categoria para identificar onde focar.
              </p>
              <div className="mt-4 space-y-3">
                {distribution.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">
                        {item.value} ({item.percent}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/80 transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, item.percent))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "conta" ? (
          <section className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-heading text-lg font-semibold">Segurança e Conta</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste seus dados, senha e preferências da conta.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href={editProfile()}>Editar perfil</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={editPassword()}>Alterar senha</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={logout()} as="button">
                    <XCircle className="h-4 w-4" />
                    Sair
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "admin-dashboard" && isMaster ? (
          <section className="space-y-6">
            {adminOverview ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <AdminKpiCard label="Usuários" value={adminOverview.usersTotal} note={`${adminOverview.usersVerified} verificados`} />
                <AdminKpiCard label="Novos (7 dias)" value={adminOverview.usersNew7d} note="cadastros recentes" />
                <AdminKpiCard label="Catálogo" value={adminOverview.catalogTotal} note={`${adminOverview.animeTotal} anime • ${adminOverview.mangaTotal} mangá`} />
                <AdminKpiCard label="Interações" value={adminOverview.statusesTotal + adminOverview.favoritesTotal + adminOverview.reviewsTotal + adminOverview.votesTotal} note="status, favoritos, reviews e votos" />
                <AdminKpiCard label="Personagens" value={adminOverview.charactersTotal} note="entidades catalogadas" />
                <AdminKpiCard label="Pessoas" value={adminOverview.peopleTotal} note="entidades catalogadas" />
                <AdminKpiCard label="Reviews" value={adminOverview.reviewsTotal} note="reviews internas" />
                <AdminKpiCard label="Votos" value={adminOverview.votesTotal} note="votos internos" />
              </div>
            ) : (
              <EmptyState message="Dados do dashboard admin ainda não disponíveis." />
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <TrendCard
                title="Cadastros (14 dias)"
                subtitle="Evolução de novos usuários."
                points={adminTrends?.registrations ?? []}
              />
              <TrendCard
                title="Ingestão de Catálogo"
                subtitle="Novas entidades registradas."
                points={adminTrends?.catalogIngest ?? []}
              />
              <TrendCard
                title="Interações da Comunidade"
                subtitle="Soma de status, favoritos, reviews e votos."
                points={adminTrends?.interactions ?? []}
              />
            </div>
          </section>
        ) : null}

        {activeTab === "admin-users" && isMaster ? (
          <section className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-heading text-lg font-semibold">Gestão de Usuários</h3>
                  <p className="text-sm text-muted-foreground">
                    Consulte atividade, busca por nome/email e veja usuários mais engajados.
                  </p>
                </div>
                <form
                  className="flex w-full max-w-lg items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void loadUsers(1, usersSearch);
                  }}
                >
                  <Input
                    value={usersSearch}
                    onChange={(event) => setUsersSearch(event.target.value)}
                    placeholder="Buscar por nome ou email"
                  />
                  <Button type="submit" variant="outline" disabled={usersLoading}>
                    <Search className="h-4 w-4" />
                    Buscar
                  </Button>
                </form>
              </div>

              <div className="mt-5 overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Usuário</th>
                      <th className="px-3 py-2 text-left">Criado</th>
                      <th className="px-3 py-2 text-right">Atividade</th>
                      <th className="px-3 py-2 text-right">Status</th>
                      <th className="px-3 py-2 text-right">Favoritos</th>
                      <th className="px-3 py-2 text-right">Reviews</th>
                      <th className="px-3 py-2 text-right">Votos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((entry) => (
                      <tr key={entry.id} className="border-t">
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium">{entry.name}</div>
                          <div className="text-xs text-muted-foreground">{entry.email}</div>
                          <div className="mt-1 flex gap-1">
                            <Badge variant={entry.emailVerified ? "default" : "secondary"}>
                              {entry.emailVerified ? "Verificado" : "Pendente"}
                            </Badge>
                            {entry.isMaster ? <Badge variant="outline">Master</Badge> : null}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{entry.createdAt ?? "--"}</td>
                        <td className="px-3 py-2 text-right font-semibold">{entry.activityScore}</td>
                        <td className="px-3 py-2 text-right">{entry.statusesCount}</td>
                        <td className="px-3 py-2 text-right">{entry.favoritesCount}</td>
                        <td className="px-3 py-2 text-right">{entry.reviewsCount}</td>
                        <td className="px-3 py-2 text-right">{entry.votesCount}</td>
                      </tr>
                    ))}
                    {users.length === 0 ? (
                      <tr>
                        <td className="px-3 py-8 text-center text-sm text-muted-foreground" colSpan={7}>
                          {usersLoading ? "Carregando usuários..." : "Nenhum usuário encontrado."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Página {usersMeta.currentPage} de {usersMeta.lastPage} • Total: {usersMeta.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersLoading || usersMeta.currentPage <= 1}
                    onClick={() => void loadUsers(usersMeta.currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersLoading || usersMeta.currentPage >= usersMeta.lastPage}
                    onClick={() => void loadUsers(usersMeta.currentPage + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "admin-top" && isMaster ? (
          <section className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-heading text-lg font-semibold">Top Usuários</h3>
              <p className="text-sm text-muted-foreground">
                Ranking por pontuação de atividade (status, favoritos, reviews e votos).
              </p>

              <div className="mt-4 space-y-3">
                {adminTopUsers.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        #{index + 1} {entry.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{entry.email}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <MetricBadge label="Atividade" value={entry.activityScore} />
                      <MetricBadge label="Status" value={entry.statusesCount} />
                      <MetricBadge label="Favs" value={entry.favoritesCount} />
                      <MetricBadge label="Reviews" value={entry.reviewsCount} />
                    </div>
                  </div>
                ))}
                {adminTopUsers.length === 0 ? <EmptyState message="Sem dados para ranking de usuários." /> : null}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "admin-seo" && isMaster ? (
          <section className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-heading text-lg font-semibold">Configuração de SEO</h3>
              <p className="text-sm text-muted-foreground">
                Controle metadados globais e templates das páginas estáticas e dinâmicas.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <LabeledInput
                  label="Nome do site"
                  value={seoGlobal.site_name ?? ""}
                  onChange={(value) => setSeoGlobal((old) => ({ ...old, site_name: value }))}
                />
                <LabeledInput
                  label="Sufixo de título"
                  value={seoGlobal.title_suffix ?? ""}
                  onChange={(value) => setSeoGlobal((old) => ({ ...old, title_suffix: value }))}
                />
                <LabeledInput
                  label="Título padrão"
                  value={seoGlobal.default_title ?? ""}
                  onChange={(value) => setSeoGlobal((old) => ({ ...old, default_title: value }))}
                />
                <LabeledInput
                  label="Imagem padrão"
                  value={seoGlobal.default_image ?? ""}
                  onChange={(value) => setSeoGlobal((old) => ({ ...old, default_image: value }))}
                />
                <LabeledInput
                  label="Robots padrão"
                  value={seoGlobal.robots_default ?? ""}
                  onChange={(value) => setSeoGlobal((old) => ({ ...old, robots_default: value }))}
                />
                <LabeledInput
                  label="Twitter @"
                  value={seoGlobal.twitter_site ?? ""}
                  onChange={(value) => setSeoGlobal((old) => ({ ...old, twitter_site: value }))}
                />
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Descrição padrão</span>
                  <textarea
                    className="h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring/40 focus:ring-2"
                    value={seoGlobal.default_description ?? ""}
                    onChange={(event) => setSeoGlobal((old) => ({ ...old, default_description: event.target.value }))}
                  />
                </label>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Checkbox
                  checked={Boolean(seoGlobal.noindex_query_pages)}
                  onCheckedChange={(value) =>
                    setSeoGlobal((old) => ({ ...old, noindex_query_pages: value === true }))
                  }
                  id="noindex-query-pages"
                />
                <label htmlFor="noindex-query-pages" className="text-sm text-muted-foreground">
                  Aplicar <code>noindex,follow</code> em páginas com query string.
                </label>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <JsonEditor
                  title="Rotas Estáticas"
                  value={seoStaticText}
                  onChange={setSeoStaticText}
                  description="Mapeie páginas como /anime, /manga, /news com title/description."
                />
                <JsonEditor
                  title="Rotas Dinâmicas"
                  value={seoDynamicText}
                  onChange={setSeoDynamicText}
                  description="Templates por tipo: anime, manga, character, person, etc."
                />
                <JsonEditor
                  title="Sitemap"
                  value={seoSitemapText}
                  onChange={setSeoSitemapText}
                  description="Controle tipos incluídos, cache e rotas estáticas."
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => void handleSeoSave()} disabled={seoSaving}>
                  {seoSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar SEO
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSeoGlobal(initialSeo.global);
                    setSeoStaticText(prettyJson(initialSeo.static));
                    setSeoDynamicText(prettyJson(initialSeo.dynamic));
                    setSeoSitemapText(prettyJson(initialSeo.sitemap));
                  }}
                >
                  Restaurar valores iniciais
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "admin-sitemap" && isMaster ? (
          <section className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-heading text-lg font-semibold">Gerador de Sitemap</h3>
              <p className="text-sm text-muted-foreground">
                Atualiza cache do sitemap e opcionalmente grava <code>public/sitemap.xml</code>.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <Checkbox
                  checked={sitemapWriteFile}
                  onCheckedChange={(value) => setSitemapWriteFile(value === true)}
                  id="write-sitemap-file"
                />
                <label htmlFor="write-sitemap-file" className="text-sm text-muted-foreground">
                  Também escrever arquivo físico em <code>public/sitemap.xml</code>.
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button onClick={() => void handleSitemapRefresh()} disabled={sitemapLoading}>
                  {sitemapLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Atualizar sitemap
                </Button>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
                >
                  Abrir /sitemap.xml
                </a>
              </div>

              {sitemapResult ? (
                <div className="mt-4 rounded-lg border bg-muted/40 p-3 text-sm">
                  <p>
                    URLs no sitemap: <strong>{sitemapResult.urlCount}</strong>
                  </p>
                  <p>
                    Arquivo escrito: <strong>{sitemapResult.written ? "sim" : "não"}</strong>
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ListChecks;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function AdminKpiCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function MetricBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card px-2 py-1">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function TrendCard({ title, subtitle, points }: { title: string; subtitle: string; points: TrendPoint[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h4 className="font-heading text-base font-semibold">{title}</h4>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <TrendBars points={points} />
    </div>
  );
}

function TrendBars({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed bg-muted/40 p-4 text-center text-xs text-muted-foreground">
        Sem dados no período.
      </div>
    );
  }

  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="mt-4">
      <div className="grid h-28 grid-cols-14 items-end gap-1">
        {points.slice(-14).map((point) => (
          <div key={point.label} className="group flex h-full items-end">
            <div
              className="w-full rounded-t bg-primary/70 transition-all duration-300 group-hover:bg-primary"
              style={{ height: `${Math.max(8, Math.round((point.value / max) * 100))}%` }}
              title={`${point.label}: ${point.value}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{points[0]?.label ?? "--"}</span>
        <span>Máx: {max}</span>
        <span>{points[points.length - 1]?.label ?? "--"}</span>
      </div>
    </div>
  );
}

function JsonEditor({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="flex min-h-0 flex-col gap-2">
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
      <textarea
        className="min-h-[260px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none ring-ring/40 focus:ring-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (next: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function normalizeSeoConfig(config: SeoConfig | null | undefined): Required<SeoConfig> {
  return {
    global: {
      site_name: config?.global?.site_name ?? "Animabook",
      title_suffix: config?.global?.title_suffix ?? " | Animabook",
      default_title: config?.global?.default_title ?? "Animabook",
      default_description: config?.global?.default_description ?? "",
      default_image: config?.global?.default_image ?? "/img/ico.png",
      robots_default: config?.global?.robots_default ?? "index,follow",
      twitter_site: config?.global?.twitter_site ?? "",
      noindex_query_pages: Boolean(config?.global?.noindex_query_pages ?? true),
    },
    static: isRecord(config?.static) ? config.static : {},
    dynamic: isRecord(config?.dynamic) ? config.dynamic : {},
    sitemap: isRecord(config?.sitemap) ? config.sitemap : {},
  };
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function parseJsonObject(raw: string, label: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      throw new Error();
    }

    return parsed;
  } catch {
    throw new Error(`JSON inválido em ${label}.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
