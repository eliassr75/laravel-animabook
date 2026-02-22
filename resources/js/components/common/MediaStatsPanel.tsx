import { t } from "@/lib/i18n";

interface ScoreRow {
  score: number;
  votes: number;
  percentage?: number;
}

interface StatusRow {
  label: string;
  value: number;
}

interface MediaStatsPanelProps {
  scoreRows: ScoreRow[];
  totalVotes: number;
  averageScore: number;
  members: number;
  rank: number;
  statusTitle: string;
  statusRows: StatusRow[];
}

const STATUS_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--secondary)",
  "var(--muted-foreground)",
  "var(--destructive)",
];

export default function MediaStatsPanel({
  scoreRows,
  totalVotes,
  averageScore,
  members,
  rank,
  statusTitle,
  statusRows,
}: MediaStatsPanelProps) {
  const normalizedScores = scoreRows
    .map((row) => ({
      score: Number(row.score ?? 0),
      votes: Number(row.votes ?? 0),
      percentage: typeof row.percentage === "number"
        ? row.percentage
        : (totalVotes > 0 ? (Number(row.votes ?? 0) / totalVotes) * 100 : 0),
    }))
    .filter((row) => row.votes > 0)
    .sort((a, b) => b.score - a.score);

  const maxVotes = Math.max(1, ...normalizedScores.map((row) => row.votes));
  const visibleStatus = statusRows.filter((row) => row.value > 0);
  const statusTotal = visibleStatus.reduce((sum, row) => sum + row.value, 0);
  const statusWithPct = visibleStatus.map((row) => ({
    ...row,
    pct: statusTotal > 0 ? (row.value / statusTotal) * 100 : 0,
  }));

  let cursor = 0;
  const gradient = statusWithPct.length > 0
    ? `conic-gradient(${statusWithPct.map((row, index) => {
      const start = cursor;
      cursor += row.pct;
      return `${STATUS_COLORS[index % STATUS_COLORS.length]} ${start}% ${cursor}%`;
    }).join(", ")})`
    : "conic-gradient(var(--muted) 0 100%)";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label={t("common.average_score")} value={averageScore.toFixed(2)} />
        <MetricCard label={t("common.members")} value={members.toLocaleString("pt-BR")} />
        <MetricCard label={t("common.rank")} value={`#${rank.toLocaleString("pt-BR")}`} />
        <MetricCard label="Total votos" value={totalVotes.toLocaleString("pt-BR")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <section className="rounded-xl border bg-card p-4">
          <h4 className="mb-4 font-heading font-semibold">{t("stats.distribution")}</h4>
          {normalizedScores.length > 0 ? (
            <div className="space-y-2">
              {normalizedScores.map((row) => (
                <div key={row.score} className="grid grid-cols-[32px_1fr_auto] items-center gap-2">
                  <span className="text-right text-sm font-semibold">{row.score}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.max(2, Math.round((row.votes / maxVotes) * 100))}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{row.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Estatísticas indisponíveis no momento.</p>
          )}
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h4 className="mb-4 font-heading font-semibold">{statusTitle}</h4>
          {statusWithPct.length > 0 ? (
            <div className="space-y-4">
              <div className="mx-auto relative h-36 w-36 rounded-full border" style={{ background: gradient }}>
                <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full border bg-card text-center">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">{statusTotal.toLocaleString("pt-BR")}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {statusWithPct.map((row, index) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}
                      />
                      {row.label}
                    </span>
                    <span className="font-medium">{row.value.toLocaleString("pt-BR")} · {row.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados de situação no momento.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
