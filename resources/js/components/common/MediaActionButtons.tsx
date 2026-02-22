import { usePage } from "@inertiajs/react";
import { CheckCircle2, Eye, Heart, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { applyMediaAction, type MediaAction, type MediaType, type UserMediaActions } from "@/lib/media-actions";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

interface MediaActionButtonsProps {
  mediaType: MediaType;
  malId: number;
  initialState?: UserMediaActions | null;
  className?: string;
  showLabels?: boolean;
}

const DEFAULT_STATE: UserMediaActions = {
  favorite: false,
  status: null,
};

export default function MediaActionButtons({ mediaType, malId, initialState, className, showLabels = false }: MediaActionButtonsProps) {
  const page = usePage<{ auth?: { user?: { id: number } | null } }>();
  const isLoggedIn = Boolean(page.props.auth?.user);
  const [state, setState] = useState<UserMediaActions>(initialState ?? DEFAULT_STATE);
  const [busyAction, setBusyAction] = useState<MediaAction | null>(null);

  const run = async (action: MediaAction) => {
    if (!isLoggedIn) {
      notify("Faça login para salvar suas ações.", "error");
      return;
    }

    try {
      setBusyAction(action);
      const updated = await applyMediaAction({ mediaType, malId, action });
      setState(updated);
      notify("Ação salva com sucesso.", "success");
    } catch {
      notify("Não foi possível salvar. Tente novamente.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className={cn("grid grid-cols-4 gap-1.5", className)}>
      <ActionButton
        label="Favoritar"
        active={state.favorite}
        busy={busyAction === "favorite"}
        disabled={busyAction !== null}
        onClick={() => run("favorite")}
        showLabel={showLabels}
        icon={<Heart className={cn("h-3.5 w-3.5", state.favorite ? "fill-current" : "")} />}
      />
      <ActionButton
        label="Completo"
        active={state.status === "completo"}
        busy={busyAction === "completed"}
        disabled={busyAction !== null}
        onClick={() => run("completed")}
        showLabel={showLabels}
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
      />
      <ActionButton
        label="Assistir"
        active={state.status === "assistindo"}
        busy={busyAction === "watching"}
        disabled={busyAction !== null}
        onClick={() => run("watching")}
        showLabel={showLabels}
        icon={<Eye className="h-3.5 w-3.5" />}
      />
      <ActionButton
        label="Dropei"
        active={state.status === "dropado"}
        busy={busyAction === "dropped"}
        disabled={busyAction !== null}
        onClick={() => run("dropped")}
        showLabel={showLabels}
        icon={<XCircle className="h-3.5 w-3.5" />}
      />
    </div>
  );
}

function ActionButton({
  label,
  icon,
  active,
  busy,
  disabled,
  onClick,
  showLabel,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  showLabel: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      className={cn(
        "flex h-7 items-center justify-center gap-1 rounded-md border text-[10px] font-medium transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-background/60 text-muted-foreground hover:text-foreground",
        busy ? "opacity-60" : "",
      )}
      title={label}
      aria-label={label}
    >
      {busy ? <Spinner className="h-3.5 w-3.5" /> : icon}
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}
