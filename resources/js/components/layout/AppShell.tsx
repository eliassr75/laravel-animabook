import { Link, router, usePage } from "@inertiajs/react";
import { Menu, X, Search, User, Heart, List, Vote, BarChart3, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppLogoIcon from "@/components/app-logo-icon";
import AppToast from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useAppearance } from "@/hooks/use-appearance";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Anime", href: "/anime" },
  { label: "Mangá", href: "/manga" },
  { label: "Notícias", href: "/news" },
  { label: "Temporadas", href: "/seasons" },
  { label: "Ranking", href: "/top" },
];

const authLinks = [
  { label: "Painel", href: "/app/dashboard", icon: BarChart3 },
  { label: "Lista", href: "/app/watchlist", icon: List },
  { label: "Favoritos", href: "/app/favoritos", icon: Heart },
  { label: "Votar", href: "/app/votar", icon: Vote },
  { label: "Perfil", href: "/app/perfil", icon: User },
];

interface AppShellProps {
  children: React.ReactNode;
  auth?: { user: { name: string; email: string } | null };
  hideSearchButton?: boolean;
}

export default function AppShell({ children, auth, hideSearchButton = false }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const page = usePage<{ auth?: { user: { name: string; email: string } | null } }>();
  const currentUrl = page.url;
  const user = auth?.user ?? page.props.auth?.user ?? null;
  const { resolvedAppearance, updateAppearance } = useAppearance();
  const isDark = resolvedAppearance === "dark";

  const isActive = (href: string) =>
    href === "/" ? currentUrl === "/" : currentUrl.startsWith(href);

  const commandLinks = useMemo(
    () => (user
      ? [
        { heading: "Explorar", items: navLinks },
        { heading: "Minha Conta", items: authLinks },
      ]
      : [
        { heading: "Explorar", items: navLinks },
      ]),
    [user],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCommand = event.metaKey || event.ctrlKey;
      if (isCommand && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCommandSelect = (href: string) => {
    setCommandOpen(false);
    router.visit(href);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppToast />
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold text-primary">
            <span className="flex h-8 w-8 overflow-hidden rounded-full border border-border/70 shadow-sm">
              <AppLogoIcon className="h-full w-full object-cover" />
            </span>
            Animabook
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!hideSearchButton && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Buscar"
                className="hidden sm:flex"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              onClick={() => updateAppearance(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <Link href="/app/dashboard">
                <Button variant="ghost" size="sm" className="gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm">Entrar</Button>
              </Link>
            )}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t bg-card p-4 space-y-1 animate-[fade-in_0.2s_ease-out]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="border-t pt-2 mt-2">
                {authLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-muted"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border-t pt-2 mt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:bg-muted"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:bg-muted"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} title="Buscar" description="Procure por páginas e ações">
        <CommandInput placeholder="Buscar no Animabook..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {commandLinks.map((group, index) => (
            <div key={group.heading}>
              <CommandGroup heading={group.heading}>
                {group.items.map((item) => (
                  <CommandItem key={item.href} onSelect={() => handleCommandSelect(item.href)}>
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {index < commandLinks.length - 1 && <CommandSeparator />}
            </div>
          ))}
        </CommandList>
      </CommandDialog>

      <footer className="border-t bg-card/50 py-10 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-heading font-semibold text-sm mb-3">Explorar</h4>
              <div className="space-y-2">
                {[
                  { label: "Anime", href: "/anime" },
                  { label: "Mangá", href: "/manga" },
                  { label: "Notícias", href: "/news" },
                  { label: "Temporadas", href: "/seasons" },
                  { label: "Ranking", href: "/top" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-sm mb-3">Descobrir</h4>
              <div className="space-y-2">
                {[
                  { label: "Gêneros", href: "/genres" },
                  { label: "Produtores", href: "/producers" },
                  { label: "Personagens", href: "/characters" },
                  { label: "Pessoas", href: "/people" },
                  { label: "Revistas", href: "/magazines" },
                  { label: "Clubes", href: "/clubs" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-sm mb-3">Minha Conta</h4>
              <div className="space-y-2">
                {user ? (
                  authLinks.map((l) => (
                    <Link key={l.href} href={l.href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                  ))
                ) : (
                  <>
                    <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
                    <Link href="/register" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Criar conta</Link>
                  </>
                )}
              </div>
            </div>
            <div>
              <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-primary mb-3">
                <span className="flex h-6 w-6 overflow-hidden rounded-full border border-border/70">
                  <AppLogoIcon className="h-full w-full object-cover" />
                </span>
                Animabook
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sua plataforma para descobrir, organizar e avaliar animes e mangás.
              </p>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-xs text-muted-foreground">
            © 2026 Animabook. Dados fornecidos por MyAnimeList via Jikan API.
          </div>
        </div>
      </footer>
    </div>
  );
}
