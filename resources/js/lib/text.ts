export function displayText(value?: string | null, fallback = "--"): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const trimmed = String(value).trim();
  if (!trimmed || trimmed.toLowerCase() === "null") {
    return fallback;
  }

  return trimmed;
}

export function hasText(value?: string | null): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const trimmed = String(value).trim();
  return Boolean(trimmed && trimmed.toLowerCase() !== "null");
}
