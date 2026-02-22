import { Head, Link } from "@inertiajs/react";
import { Clock3, RefreshCw } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

interface CatalogSyncPendingProps {
  mediaType: "anime" | "manga";
  malId: number;
  queuedNow?: boolean;
}

export default function CatalogSyncPending({ mediaType, malId, queuedNow = false }: CatalogSyncPendingProps) {
  const label = mediaType === "anime" ? "anime" : "mangá";
  const listHref = mediaType === "anime" ? "/anime" : "/manga";
  const detailHref = `/${mediaType}/${malId}`;

  return (
    <AppShell>
      <Head title={`${label.toUpperCase()} #${malId} em sincronização`} />

      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-6 sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Este {label} ainda não foi sincronizado</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                ID MAL: <span className="font-medium text-foreground">#{malId}</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {queuedNow
              ? "Colocamos este item na fila de sincronização agora. Em alguns instantes ele deve estar disponível."
              : "Este item já está na fila de sincronização ou foi solicitado recentemente. Tente novamente em alguns instantes."}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={detailHref}>
              <Button className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </Link>
            <Link href={listHref}>
              <Button variant="outline">Ir para lista de {mediaType === "anime" ? "animes" : "mangás"}</Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
