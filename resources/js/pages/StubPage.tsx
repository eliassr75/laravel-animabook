import { Link } from "@inertiajs/react";
import { Construction } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

interface StubPageProps {
  title: string;
  description?: string;
}

export default function StubPage({ title, description }: StubPageProps) {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-20 text-center">
        <Construction className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          {description ?? "Esta página está em construção. Volte em breve!"}
        </p>
        <Link href="/">
          <Button variant="outline">Voltar ao Início</Button>
        </Link>
      </div>
    </AppShell>
  );
}
