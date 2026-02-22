import { Link, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { t } from "@/lib/i18n";

const NotFound = () => {
  const page = usePage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", page.url);
  }, [page.url]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("not_found.title")}</p>
        <Link href="/" className="text-primary underline hover:text-primary/90">
          {t("not_found.back")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
