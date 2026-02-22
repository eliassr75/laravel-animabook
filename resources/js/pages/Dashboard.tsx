import { Link } from "@inertiajs/react";
import { Eye, CheckCircle, Clock, Pause, XCircle, Star, TrendingUp, Heart, Vote } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  auth?: { user: { name: string; email: string; stats: { watching: number; completed: number; planned: number; paused: number; dropped: number; totalEpisodes: number; meanScore: number } } };
  watchlistCount?: number;
}

const statCards = [
  { label: "Assistindo", key: "watching" as const, icon: Eye, color: "text-accent" },
  { label: "Completos", key: "completed" as const, icon: CheckCircle, color: "text-primary" },
  { label: "Planejados", key: "planned" as const, icon: Clock, color: "text-muted-foreground" },
  { label: "Pausados", key: "paused" as const, icon: Pause, color: "text-secondary-foreground" },
  { label: "Dropados", key: "dropped" as const, icon: XCircle, color: "text-destructive" },
];

export default function Dashboard({ auth, watchlistCount = 0 }: DashboardProps) {
  const user = auth?.user ?? { name: "Usuário", email: "", stats: { watching: 0, completed: 0, planned: 0, paused: 0, dropped: 0, totalEpisodes: 0, meanScore: 0 } };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Olá, {user.name}! 👋</h1>
          <p className="text-muted-foreground">Aqui está um resumo da sua atividade no Animabook.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.key} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold">{user.stats[s.key]}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-accent" />
              <h3 className="font-heading font-semibold">Nota Média</h3>
            </div>
            <p className="text-3xl font-bold">{user.stats.meanScore}</p>
            <p className="text-xs text-muted-foreground mt-1">baseado em {user.stats.completed} animes avaliados</p>
          </div>
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold">Episódios Assistidos</h3>
            </div>
            <p className="text-3xl font-bold">{user.stats.totalEpisodes}</p>
            <p className="text-xs text-muted-foreground mt-1">~{Math.round(user.stats.totalEpisodes * 24 / 60)} horas de anime</p>
          </div>
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-destructive" />
              <h3 className="font-heading font-semibold">Total na Lista</h3>
            </div>
            <p className="text-3xl font-bold">{watchlistCount}</p>
            <p className="text-xs text-muted-foreground mt-1">animes na sua watchlist</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-heading font-semibold mb-4">Ações Rápidas</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/watchlist"><Button variant="default" className="gap-2"><Eye className="h-4 w-4" />Minha lista</Button></Link>
            <Link href="/app/favoritos"><Button variant="outline" className="gap-2"><Heart className="h-4 w-4" />Favoritos</Button></Link>
            <Link href="/app/votar"><Button variant="outline" className="gap-2"><Vote className="h-4 w-4" />Votar</Button></Link>
            <Link href="/anime"><Button variant="ghost" className="gap-2"><TrendingUp className="h-4 w-4" />Explorar</Button></Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
