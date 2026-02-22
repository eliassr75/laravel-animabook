type Messages = Record<string, string | Record<string, string>>;

type Locale = "pt-BR" | "en";

const MESSAGES: Record<Locale, Messages> = {
  "pt-BR": {
    common: {
      filters: "Filtros",
      search: "Buscar...",
      search_anime: "Buscar anime...",
      search_manga: "Buscar mangá...",
      sort_by: "Ordenar por",
      score: "Nota",
      title: "Título",
      year: "Ano",
      rank: "Classificação",
      status: "Situação",
      genre: "Gênero",
      type: "Tipo",
      season: "Temporada",
      episodes: "Episódios",
      studio: "Estúdio",
      summary: "Resumo",
      average_score: "Nota média",
      popularity: "Popularidade",
      chapters: "Capítulos",
      volumes: "Volumes",
      publishers: "Editoras",
      results: "{count} resultados",
      no_items: "Nenhum item encontrado.",
      clear_all: "Limpar tudo",
      clear_filters: "Limpar filtros",
      back_home: "Voltar ao início",
      back: "Voltar",
      related: "Relacionados",
      pagination: "Paginação",
      prev_page: "Página anterior",
      next_page: "Próxima página",
      info: "Informações",
      synopsis: "Sinopse",
      members: "Membros",
      community: "Comunidade",
      official_data: "Dados oficiais",
      ranking: "#{rank} no ranking",
    },
    actions: {
      favorite: "Favoritar",
      watchlist: "Lista",
      share: "Compartilhar",
    },
    tabs: {
      overview: "Visão Geral",
      characters: "Personagens",
      reviews: "Avaliações",
      recommendations: "Recomendações",
      stats: "Estatísticas",
      relations: "Relações",
      staff: "Equipe",
      songs: "Músicas",
      news: "Notícias",
      episodes: "Episódios",
    },
    stats: {
      distribution: "Distribuição de Notas",
      top10: "Top 10",
    },
    states: {
      empty_title: "Nenhum resultado encontrado",
      empty_desc: "Tente ajustar seus filtros ou termos de busca para encontrar o que procura.",
      error_title: "Algo deu errado",
      error_desc: "Não foi possível carregar os dados. Tente novamente em instantes.",
      retry: "Tentar novamente",
      syncing_title: "Estamos buscando os dados mais recentes…",
      syncing_desc: "Os resultados serão atualizados automaticamente.",
    },
    catalog: {
      anime_title: "Anime",
      manga_title: "Mangá",
      not_found: "Item não encontrado",
      not_available: "Este item ainda não está disponível no catálogo.",
      not_found_anime: "Anime não encontrado",
      not_found_manga: "Mangá não encontrado",
    },
    not_found: {
      title: "Oops! Página não encontrada",
      back: "Voltar para o início",
    },
  },
  en: {
    common: {
      filters: "Filters",
      search: "Search...",
      search_anime: "Search anime...",
      search_manga: "Search manga...",
      sort_by: "Sort by",
      score: "Score",
      title: "Title",
      year: "Year",
      rank: "Rank",
      status: "Status",
      genre: "Genre",
      type: "Type",
      season: "Season",
      episodes: "Episodes",
      studio: "Studio",
      summary: "Summary",
      average_score: "Average score",
      popularity: "Popularity",
      chapters: "Chapters",
      volumes: "Volumes",
      publishers: "Publishers",
      results: "{count} results",
      no_items: "No items found.",
      clear_all: "Clear all",
      clear_filters: "Clear filters",
      back_home: "Back to home",
      back: "Back",
      related: "Related",
      pagination: "Pagination",
      prev_page: "Previous page",
      next_page: "Next page",
      info: "Information",
      synopsis: "Synopsis",
      members: "Members",
      community: "Community",
      official_data: "Official data",
      ranking: "#{rank} in ranking",
    },
    actions: {
      favorite: "Favorite",
      watchlist: "List",
      share: "Share",
    },
    tabs: {
      overview: "Overview",
      characters: "Characters",
      reviews: "Reviews",
      recommendations: "Recommendations",
      stats: "Stats",
      relations: "Relations",
      staff: "Staff",
      songs: "Songs",
      news: "News",
      episodes: "Episodes",
    },
    stats: {
      distribution: "Score distribution",
      top10: "Top 10",
    },
    states: {
      empty_title: "No results found",
      empty_desc: "Try adjusting your filters or search terms to find what you're looking for.",
      error_title: "Something went wrong",
      error_desc: "We couldn't load the data. Please try again soon.",
      retry: "Try again",
      syncing_title: "Fetching the latest data…",
      syncing_desc: "Results will update automatically.",
    },
    catalog: {
      anime_title: "Anime",
      manga_title: "Manga",
      not_found: "Item not found",
      not_available: "This item is not yet available in the catalog.",
      not_found_anime: "Anime not found",
      not_found_manga: "Manga not found",
    },
    not_found: {
      title: "Oops! Page not found",
      back: "Return to Home",
    },
  },
};

function resolveLocale(): Locale {
  if (typeof document !== "undefined") {
    const docLocale = document.documentElement.lang as Locale | undefined;
    if (docLocale && MESSAGES[docLocale]) {
      return docLocale;
    }
  }

  if (typeof navigator !== "undefined") {
    const nav = navigator.language as Locale | undefined;
    if (nav && MESSAGES[nav]) {
      return nav;
    }
  }

  return "pt-BR";
}

let currentLocale: Locale = resolveLocale();

export function setLocale(locale: Locale) {
  if (MESSAGES[locale]) {
    currentLocale = locale;
  }
}

function getMessage(messages: Messages, path: string[]): string | undefined {
  let node: Messages | string | undefined = messages;
  for (const key of path) {
    if (typeof node === "string" || !node || !(key in node)) {
      return undefined;
    }
    node = node[key] as Messages | string;
  }
  return typeof node === "string" ? node : undefined;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const path = key.split(".");
  const template = getMessage(MESSAGES[currentLocale], path)
    ?? getMessage(MESSAGES["pt-BR"], path)
    ?? key;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((acc, [param, value]) => {
    return acc.replaceAll(`{${param}}`, String(value));
  }, template);
}
