export function csrfToken(): string {
  if (typeof document === "undefined") {
    return "";
  }

  return document.querySelector<HTMLMetaElement>("meta[name='csrf-token']")?.content ?? "";
}

export function xsrfTokenFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith("XSRF-TOKEN="));

  if (!entry) {
    return "";
  }

  const [, value] = entry.split("=");
  return decodeURIComponent(value ?? "");
}

export function authJsonHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "X-CSRF-TOKEN": csrfToken(),
    "X-XSRF-TOKEN": xsrfTokenFromCookie(),
    ...(extra ?? {}),
  };
}
