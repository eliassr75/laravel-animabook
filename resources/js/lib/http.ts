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
  const xsrf = xsrfTokenFromCookie();
  const csrf = csrfToken();

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(xsrf
      ? { "X-XSRF-TOKEN": xsrf }
      : (csrf ? { "X-CSRF-TOKEN": csrf } : {})),
    ...(extra ?? {}),
  };
}
