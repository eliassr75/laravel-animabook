import { toast } from "react-toastify";

type ToastType = "info" | "success" | "error";

export function notify(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") {
    return;
  }

  if (type === "success") {
    toast.success(message);
    return;
  }

  if (type === "error") {
    toast.error(message);
    return;
  }

  toast.info(message);
}
