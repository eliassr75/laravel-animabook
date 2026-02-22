import { Link } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { home, register } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    canRegister = true,
}: AuthLayoutProps) {
    return (
        <div className="min-h-svh bg-[radial-gradient(120%_120%_at_10%_10%,hsl(15_90%_94%)_0%,hsl(18_70%_97%)_35%,hsl(16_45%_90%)_100%)] dark:bg-[radial-gradient(120%_120%_at_10%_10%,hsl(0_22%_7%)_0%,hsl(0_18%_11%)_50%,hsl(0_12%_15%)_100%)]">
            <div className="mx-auto flex min-h-svh max-w-5xl items-center justify-center px-6 py-10">
                <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="hidden flex-col justify-between rounded-3xl border bg-card/80 p-8 shadow-lg backdrop-blur lg:flex">
                        <div>
                            <Link href={home()} className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-primary/10 shadow-md">
                                    <AppLogoIcon className="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <p className="font-heading text-2xl font-bold">Animabook</p>
                                    <p className="text-xs text-muted-foreground">Descubra. Organize. Avalie.</p>
                                </div>
                            </Link>
                            <div className="mt-8 space-y-4">
                                <div className="rounded-2xl border bg-background/70 p-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <Sparkles className="h-4 w-4 text-accent" />
                                        Catálogo sempre atualizado
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Dados sincronizados pelo worker, resultados rápidos direto do MySQL.
                                    </p>
                                </div>
                                <div className="rounded-2xl border bg-background/70 p-5">
                                    <div className="text-sm font-semibold">Sua jornada otaku em um só lugar</div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Lista, votos e favoritos com identidade visual premium.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border bg-muted/40 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                    <AppLogoIcon className="size-full rounded-xl object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Comece agora</p>
                                    <p className="text-xs text-muted-foreground">Leva menos de 1 minuto</p>
                                </div>
                            </div>
                            {canRegister && (
                                <Button variant="hero" size="sm" asChild>
                                    <Link href={register()}>Criar conta</Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col justify-center rounded-3xl border bg-card p-8 shadow-xl">
                        <Link href={home()} className="mb-6 flex items-center gap-2 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-primary/10">
                                <AppLogoIcon className="h-full w-full object-cover" />
                            </div>
                            <span className="font-heading text-xl font-bold">Animabook</span>
                        </Link>
                        <div className="mb-6 space-y-2">
                            <h1 className="font-heading text-2xl font-bold">{title}</h1>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
