export interface AnimeItem {
  malId: number;
  mediaType?: "anime" | "manga";
  title: string;
  titleJapanese?: string;
  score: number;
  synopsis: string;
  genres: string[];
  genreItems?: { id?: number | null; name: string }[];
  status: string;
  type: string;
  episodes: number | null;
  year: number;
  season: string;
  studios: string[];
  members: number;
  rank: number;
  colorIndex: number;
  imageUrl?: string | null;
  userActions?: {
    favorite: boolean;
    status: "assistindo" | "completo" | "dropado" | null;
  } | null;
}

export interface ReviewItem {
  id: number;
  user: string;
  animeTitle: string;
  animeMalId: number;
  mediaType?: "anime" | "manga";
  score: number;
  content: string;
  date: string;
  isMine?: boolean;
}

export interface CharacterItem {
  malId: number;
  name: string;
  nameKanji?: string;
  role: string;
  animeName: string;
  colorIndex: number;
  imageUrl?: string | null;
}

export interface WatchlistItem extends AnimeItem {
  mediaType?: "anime" | "manga";
  watchStatus: "assistindo" | "completo" | "planejado" | "pausado" | "dropado";
  progress: number;
  userScore: number | null;
  watchedEpisodes?: number[];
}

export const GENRE_LIST = [
  "Ação", "Aventura", "Comédia", "Drama", "Fantasia", "Terror",
  "Romance", "Sci-Fi", "Slice of Life", "Esportes", "Suspense", "Sobrenatural",
  "Mistério", "Mecha", "Musical", "Psicológico", "Ecchi", "Shounen", "Seinen",
];

export const SEASONS = ["Inverno", "Primavera", "Verão", "Outono"];

export const STATUS_OPTIONS = [
  { value: "assistindo", label: "Assistindo", color: "bg-accent" },
  { value: "completo", label: "Completo", color: "bg-primary" },
  { value: "planejado", label: "Planejado", color: "bg-muted" },
  { value: "pausado", label: "Pausado", color: "bg-secondary" },
  { value: "dropado", label: "Dropado", color: "bg-destructive" },
];

export const CARD_GRADIENTS = [
  "from-[hsl(2,35%,32%)] to-[hsl(1,33%,63%)]",
  "from-[hsl(0,43%,16%)] to-[hsl(2,35%,32%)]",
  "from-[hsl(1,33%,63%)] to-[hsl(16,67%,81%)]",
  "from-[hsl(350,30%,25%)] to-[hsl(1,40%,50%)]",
  "from-[hsl(15,40%,30%)] to-[hsl(16,50%,65%)]",
  "from-[hsl(330,25%,22%)] to-[hsl(350,35%,45%)]",
];

export const mockAnime: AnimeItem[] = [
  { malId: 1, title: "Fullmetal Alchemist: Brotherhood", titleJapanese: "鋼の錬金術師", score: 9.1, synopsis: "Dois irmãos usam alquimia para buscar a Pedra Filosofal e restaurar seus corpos após um experimento fracassado.", genres: ["Ação", "Aventura", "Fantasia"], status: "Finalizado", type: "TV", episodes: 64, year: 2009, season: "Primavera", studios: ["Bones"], members: 3200000, rank: 1, colorIndex: 0 },
  { malId: 2, title: "Steins;Gate", titleJapanese: "シュタインズ・ゲート", score: 9.08, synopsis: "Um cientista autodidata descobre acidentalmente uma forma de enviar mensagens ao passado, desencadeando consequências imprevisíveis.", genres: ["Sci-Fi", "Suspense", "Drama"], status: "Finalizado", type: "TV", episodes: 24, year: 2011, season: "Primavera", studios: ["White Fox"], members: 2500000, rank: 2, colorIndex: 1 },
  { malId: 3, title: "Attack on Titan: Final Season", titleJapanese: "進撃の巨人", score: 9.05, synopsis: "A humanidade luta pela sobrevivência contra titãs gigantes que ameaçam destruir tudo.", genres: ["Ação", "Drama", "Suspense"], status: "Finalizado", type: "TV", episodes: 16, year: 2021, season: "Inverno", studios: ["MAPPA"], members: 2800000, rank: 3, colorIndex: 2 },
  { malId: 4, title: "Hunter x Hunter (2011)", titleJapanese: "ハンターxハンター", score: 9.04, synopsis: "Gon parte em busca de seu pai, tornando-se um Hunter e enfrentando desafios mortais.", genres: ["Ação", "Aventura", "Fantasia"], status: "Finalizado", type: "TV", episodes: 148, year: 2011, season: "Outono", studios: ["Madhouse"], members: 2600000, rank: 4, colorIndex: 3 },
  { malId: 5, title: "Gintama°", titleJapanese: "銀魂°", score: 9.02, synopsis: "Gintoki e seus amigos enfrentam alienígenas e situações absurdas no Japão feudal alternativo.", genres: ["Comédia", "Ação", "Sci-Fi"], status: "Finalizado", type: "TV", episodes: 51, year: 2015, season: "Primavera", studios: ["Bandai Namco"], members: 500000, rank: 5, colorIndex: 4 },
  { malId: 6, title: "Frieren: Beyond Journey's End", titleJapanese: "葬送のフリーレン", score: 9.0, synopsis: "Uma elfa maga reflete sobre as memórias com seus companheiros após décadas de vida.", genres: ["Aventura", "Drama", "Fantasia"], status: "Em exibição", type: "TV", episodes: 28, year: 2023, season: "Outono", studios: ["Madhouse"], members: 1200000, rank: 6, colorIndex: 5 },
  { malId: 7, title: "Mob Psycho 100 II", titleJapanese: "モブサイコ100 II", score: 8.97, synopsis: "Mob continua sua jornada de crescimento pessoal enquanto lida com seus poderes psíquicos.", genres: ["Ação", "Comédia", "Sobrenatural"], status: "Finalizado", type: "TV", episodes: 13, year: 2019, season: "Inverno", studios: ["Bones"], members: 1100000, rank: 7, colorIndex: 0 },
  { malId: 8, title: "Vinland Saga", titleJapanese: "ヴィンランド・サガ", score: 8.73, synopsis: "Thorfinn busca vingança contra o assassino de seu pai em uma saga viking épica.", genres: ["Ação", "Aventura", "Drama"], status: "Finalizado", type: "TV", episodes: 24, year: 2019, season: "Verão", studios: ["Wit Studio"], members: 900000, rank: 8, colorIndex: 1 },
  { malId: 9, title: "Spy x Family", titleJapanese: "SPY×FAMILY", score: 8.56, synopsis: "Um espião, uma assassina e uma telepata formam uma família falsa sem saber dos segredos uns dos outros.", genres: ["Comédia", "Ação", "Slice of Life"], status: "Em exibição", type: "TV", episodes: 25, year: 2022, season: "Primavera", studios: ["Wit Studio", "CloverWorks"], members: 1500000, rank: 9, colorIndex: 2 },
  { malId: 10, title: "Jujutsu Kaisen", titleJapanese: "呪術廻戦", score: 8.67, synopsis: "Yuji Itadori engole uma relíquia amaldiçoada e entra no mundo dos feiticeiros para combater maldições.", genres: ["Ação", "Sobrenatural", "Shounen"], status: "Finalizado", type: "TV", episodes: 24, year: 2020, season: "Outono", studios: ["MAPPA"], members: 2000000, rank: 10, colorIndex: 3 },
  { malId: 11, title: "Chainsaw Man", titleJapanese: "チェンソーマン", score: 8.44, synopsis: "Denji se funde com seu demônio-motosserra e trabalha como caçador de demônios em troca de uma vida normal.", genres: ["Ação", "Terror", "Sobrenatural"], status: "Finalizado", type: "TV", episodes: 12, year: 2022, season: "Outono", studios: ["MAPPA"], members: 1800000, rank: 11, colorIndex: 4 },
  { malId: 12, title: "Oshi no Ko", titleJapanese: "推しの子", score: 8.42, synopsis: "Um médico renasce como filho de sua idol favorita e descobre o lado sombrio da indústria do entretenimento.", genres: ["Drama", "Suspense", "Sobrenatural"], status: "Em exibição", type: "TV", episodes: 11, year: 2023, season: "Primavera", studios: ["Doga Kobo"], members: 1300000, rank: 12, colorIndex: 5 },
];

export const mockReviews: ReviewItem[] = [
  { id: 1, user: "OtakuMaster99", animeTitle: "Frieren: Beyond Journey's End", animeMalId: 6, score: 10, content: "Uma obra-prima que redefine o gênero de fantasia. A narrativa sobre o tempo e as memórias é profundamente tocante.", date: "2026-02-10" },
  { id: 2, user: "AnimeCritic_BR", animeTitle: "Chainsaw Man", animeMalId: 11, score: 8, content: "Animação incrível e uma história que não tem medo de ser diferente. MAPPA entregou uma adaptação visceral e emocionante.", date: "2026-02-08" },
  { id: 3, user: "SakuraFan", animeTitle: "Spy x Family", animeMalId: 9, score: 9, content: "Anya carrega o show! Diversão garantida para toda a família com momentos de comédia e ação perfeitamente balanceados.", date: "2026-02-05" },
  { id: 4, user: "ShōnenLover", animeTitle: "Jujutsu Kaisen", animeMalId: 10, score: 9, content: "As cenas de luta são de outro nível. A animação fluida e o design de personagens tornam cada episódio um espetáculo visual.", date: "2026-01-28" },
];

export const mockCharacters: CharacterItem[] = [
  { malId: 101, name: "Edward Elric", nameKanji: "エドワード・エルリック", role: "Protagonista", animeName: "Fullmetal Alchemist: Brotherhood", colorIndex: 0 },
  { malId: 102, name: "Okabe Rintarou", nameKanji: "岡部 倫太郎", role: "Protagonista", animeName: "Steins;Gate", colorIndex: 1 },
  { malId: 103, name: "Eren Yeager", nameKanji: "エレン・イェーガー", role: "Protagonista", animeName: "Attack on Titan", colorIndex: 2 },
  { malId: 104, name: "Gon Freecss", nameKanji: "ゴン・フリークス", role: "Protagonista", animeName: "Hunter x Hunter", colorIndex: 3 },
  { malId: 105, name: "Frieren", nameKanji: "フリーレン", role: "Protagonista", animeName: "Frieren: Beyond Journey's End", colorIndex: 5 },
  { malId: 106, name: "Anya Forger", nameKanji: "アーニャ・フォージャー", role: "Protagonista", animeName: "Spy x Family", colorIndex: 2 },
];

export const mockWatchlist: WatchlistItem[] = [
  { ...mockAnime[5], watchStatus: "assistindo", progress: 18, userScore: null },
  { ...mockAnime[8], watchStatus: "assistindo", progress: 20, userScore: null },
  { ...mockAnime[0], watchStatus: "completo", progress: 64, userScore: 10 },
  { ...mockAnime[1], watchStatus: "completo", progress: 24, userScore: 9 },
  { ...mockAnime[3], watchStatus: "completo", progress: 148, userScore: 9 },
  { ...mockAnime[9], watchStatus: "completo", progress: 24, userScore: 8 },
  { ...mockAnime[7], watchStatus: "planejado", progress: 0, userScore: null },
  { ...mockAnime[4], watchStatus: "planejado", progress: 0, userScore: null },
  { ...mockAnime[10], watchStatus: "pausado", progress: 8, userScore: null },
  { ...mockAnime[11], watchStatus: "dropado", progress: 5, userScore: 6 },
];

export const mockUser = {
  name: "Takeshi",
  email: "takeshi@animabook.dev",
  avatar: null,
  stats: { watching: 2, completed: 4, planned: 2, paused: 1, dropped: 1, totalEpisodes: 313, meanScore: 8.4 },
};

export const mockMeta = {
  currentPage: 1,
  lastPage: 5,
  perPage: 12,
  total: 56,
};

export const mockFilters = {
  genres: GENRE_LIST,
  types: ["TV", "Filme", "OVA", "ONA", "Especial"],
  statuses: ["Em exibição", "Finalizado", "Ainda não exibido"],
  seasons: SEASONS,
  years: Array.from({ length: 30 }, (_, i) => 2026 - i),
};
