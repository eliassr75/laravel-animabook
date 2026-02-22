import { Search, Check, Vote as VoteIcon, Trophy, AlertCircle } from "lucide-react";
import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CARD_GRADIENTS, type AnimeItem } from "@/data/mock";

interface VoteProps {
  searchIndex?: AnimeItem[];
}

export default function Vote({ searchIndex = [] }: VoteProps) {
  const [scope, setScope] = useState<"temporada" | "ano" | "all-time">("temporada");
  const [selected, setSelected] = useState<AnimeItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [voted, setVoted] = useState(false);

  const results = search
    ? searchIndex.filter((a) => a.title.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

  const handleVote = () => {
    if (selected) setVoted(true);
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <VoteIcon className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">Votar</h1>
          <p className="text-muted-foreground">Escolha seu anime favorito e contribua para o ranking da comunidade.</p>
        </div>

        {voted ? (
          <div className="bg-card rounded-xl border p-8 text-center animate-[fade-in_0.3s_ease-out]">
            <Check className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold mb-2">Voto registrado!</h2>
            <p className="text-muted-foreground mb-4">Você votou em <strong>{selected?.title}</strong> no escopo <strong>{scope}</strong>.</p>
            <Button variant="outline" onClick={() => { setVoted(false); setSelected(null); }}>Votar novamente</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Scope */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-heading font-semibold mb-3">1. Escolha o escopo</h3>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: "temporada", label: "Temporada Atual" },
                  { value: "ano", label: "Ano 2026" },
                  { value: "all-time", label: "Todos os tempos" },
                ] as const).map((s) => (
                  <Button
                    key={s.value}
                    variant={scope === s.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScope(s.value)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Select Anime */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-heading font-semibold mb-3">2. Selecione um anime</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar anime..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  className="pl-10"
                />
                {searchOpen && results.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
                    {results.map((a) => (
                      <button
                        key={a.malId}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                        onClick={() => { setSelected(a); setSearch(a.title); setSearchOpen(false); }}
                      >
                        <div className={`w-8 h-10 rounded overflow-hidden bg-gradient-to-br ${CARD_GRADIENTS[a.colorIndex % CARD_GRADIENTS.length]} flex-shrink-0`}>
                          {a.imageUrl ? (
                            <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.type} · {a.year} · ★ {a.score}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selected && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className={`w-10 h-14 rounded overflow-hidden bg-gradient-to-br ${CARD_GRADIENTS[selected.colorIndex % CARD_GRADIENTS.length]} flex-shrink-0`}>
                    {selected.imageUrl ? (
                      <img src={selected.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{selected.title}</p>
                    <p className="text-xs text-muted-foreground">{selected.genres.join(", ")}</p>
                  </div>
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-heading font-semibold mb-3">3. Confirmar</h3>
              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Você pode votar apenas uma vez por escopo. Tem certeza?</p>
              </div>
              <Button variant="hero" onClick={handleVote} disabled={!selected} className="w-full sm:w-auto">
                <Trophy className="h-4 w-4" />
                Confirmar Voto
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
