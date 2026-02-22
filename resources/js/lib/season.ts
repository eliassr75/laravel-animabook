const PT_TO_EN: Record<string, string> = {
  inverno: "winter",
  primavera: "spring",
  verao: "summer",
  "verão": "summer",
  outono: "fall",
};

const EN_TO_PT: Record<string, string> = {
  winter: "Inverno",
  spring: "Primavera",
  summer: "Verão",
  fall: "Outono",
  autumn: "Outono",
};

export function normalizeSeason(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const ascii = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return PT_TO_EN[ascii] ?? ascii;
}

export function formatSeason(value?: string | null): string {
  if (!value) return "";
  const normalized = normalizeSeason(value);
  return EN_TO_PT[normalized] ?? value;
}
