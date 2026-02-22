import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  href?: string;
  linkText?: string;
}

export default function SectionHeader({ title, href, linkText = "Ver mais" }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-heading text-xl sm:text-2xl font-bold">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm text-accent hover:text-primary transition-colors font-medium">
          {linkText}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
