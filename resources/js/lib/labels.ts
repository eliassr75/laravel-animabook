import { displayText } from "@/lib/text";

function toKey(value?: string | null): string {
  return displayText(value, "").trim().toLowerCase();
}

function translate(value: string | null | undefined, map: Record<string, string>, fallback = "--"): string {
  const safe = displayText(value, fallback);
  if (safe === fallback) {
    return fallback;
  }

  return map[toKey(safe)] ?? safe;
}

const MEDIA_TYPE_MAP: Record<string, string> = {
  tv: "TV",
  movie: "Filme",
  ova: "OVA",
  ona: "ONA",
  special: "Especial",
  music: "Música",
  cm: "Comercial",
  pv: "PV",
  "tv special": "Especial de TV",
  manga: "Mangá",
  novel: "Novel",
  "light novel": "Light novel",
  one_shot: "One-shot",
  "one-shot": "One-shot",
  doujinshi: "Doujinshi",
  manhwa: "Manhwa",
  manhua: "Manhua",
  unknown: "Desconhecido",
  anime: "Anime",
};

const STATUS_MAP: Record<string, string> = {
  "currently airing": "Em exibição",
  "finished airing": "Finalizado",
  "not yet aired": "Ainda não exibido",
  publishing: "Em publicação",
  "currently publishing": "Em publicação",
  finished: "Finalizado",
  completed: "Concluído",
  "not yet published": "Ainda não publicado",
  "on hiatus": "Em hiato",
  discontinued: "Descontinuado",
};

const RELATION_MAP: Record<string, string> = {
  adaptation: "Adaptação",
  prequel: "Prequela",
  sequel: "Sequência",
  "side story": "História paralela",
  "parent story": "História principal",
  "full story": "História completa",
  summary: "Resumo",
  spin_off: "Spin-off",
  "spin-off": "Spin-off",
  character: "Personagem",
  other: "Outro",
  "alternative version": "Versão alternativa",
  "alternative setting": "Cenário alternativo",
};

const CHARACTER_ROLE_MAP: Record<string, string> = {
  main: "Principal",
  supporting: "Coadjuvante",
};

const STAFF_POSITION_MAP: Record<string, string> = {
  director: "Diretor",
  assistant: "Assistente",
  producer: "Produtor",
  "executive producer": "Produtor executivo",
  "animation director": "Diretor de animação",
  "episode director": "Diretor de episódio",
  "chief director": "Diretor-chefe",
  "sound director": "Diretor de som",
  "music composer": "Compositor",
  composer: "Compositor",
  "series composition": "Composição da série",
  script: "Roteiro",
  screenplay: "Roteiro",
  author: "Autor",
  "original creator": "Criador original",
  "original character design": "Design original de personagens",
  "character design": "Design de personagens",
  "chief animation director": "Diretor-chefe de animação",
  storyboard: "Roteiro visual",
  editor: "Editor",
  "art director": "Diretor de arte",
  "color design": "Design de cores",
  "theme song performance": "Performance da música tema",
  "opening theme performance": "Performance de abertura",
  "ending theme performance": "Performance de encerramento",
  "voice actor": "Dublador",
};

const ENTITY_KIND_MAP: Record<string, string> = {
  anime: "Anime",
  manga: "Mangá",
  person: "Pessoa",
  people: "Pessoas",
  character: "Personagem",
  characters: "Personagens",
  producer: "Produtor",
  magazine: "Revista",
  genre: "Gênero",
  club: "Clube",
};

export function translateMediaType(value?: string | null, fallback = "--"): string {
  return translate(value, MEDIA_TYPE_MAP, fallback);
}

export function translateStatus(value?: string | null, fallback = "--"): string {
  return translate(value, STATUS_MAP, fallback);
}

export function translateRelation(value?: string | null, fallback = "--"): string {
  return translate(value, RELATION_MAP, fallback);
}

export function translateCharacterRole(value?: string | null, fallback = "--"): string {
  return translate(value, CHARACTER_ROLE_MAP, fallback);
}

export function translateStaffPosition(value?: string | null, fallback = "--"): string {
  return translate(value, STAFF_POSITION_MAP, fallback);
}

export function translateEntityKind(value?: string | null, fallback = "--"): string {
  return translate(value, ENTITY_KIND_MAP, fallback);
}
