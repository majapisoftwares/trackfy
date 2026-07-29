import type { ContentDetails } from "@/types/media";

const seasonOneEpisodes = [
  { id: 1, number: 1, title: "Salt and Sea, Fire and Blood", imageUrl: "/assets/episode-1.png", rating: 7.1, watched: true },
  { id: 2, number: 2, title: "Salt and Sea, Fire and Blood", imageUrl: "/assets/episode-1.png", rating: 7.1, watched: true },
  { id: 3, number: 3, title: "Rhaenyra Triumphant", imageUrl: "/assets/episode-3.png", rating: 7.1 },
  { id: 4, number: 4, title: "Tumbleton", imageUrl: "/assets/episode-4.png", rating: 7.1 },
  { id: 5, number: 5, title: "Unbowed and Unbent", imageUrl: "/assets/episode-5.png", rating: 7.1 },
  { id: 6, number: 6, title: "Faceless Men", imageUrl: "/assets/episode-6.png", rating: 7.1 },
  { id: 7, number: 7, title: "Episódio 7", imageUrl: "/assets/episode-upcoming.png", releaseLabel: "Estreia em 2 dias" },
  { id: 8, number: 8, title: "Episódio 8", imageUrl: "/assets/episode-upcoming.png", releaseLabel: "Estreia em 2 dias" },
  { id: 9, number: 9, title: "TBA", imageUrl: "/assets/episode-upcoming.png", releaseLabel: "Estreia em 2 dias" },
];

export const mockContent: ContentDetails = {
  id: 11,
  mediaType: "tv",
  title: "A Casa Do Dragão",
  year: 2022,
  status: "Em andamento",
  audienceScore: 83,
  imdbRating: 8.1,
  posterUrl: "/assets/content-poster.png",
  backdropUrl: "/assets/content-backdrop.png",
  genres: ["Drama", "Fantasia", "Ação"],
  tagline:
    "Fogo e Sangue. Conheça a história da ascensão e queda da Casa Targaryen duzentos anos antes dos eventos de Game of Thrones. Uma disputa de poder fratricida pelo Trono de Ferro coloca dragões contra dragões.",
  trailer: null,
  watchAvailability: null,
  synopsis: [
    "A dinastia Targaryen encontra-se no auge de seu poder absoluto, com mais de dez dragões sob seu controle direto. O Rei Viserys I Targaryen desafia séculos de tradição política ao nomear sua filha primogênita, Rhaenyra, como sua herdeira legítima ao Trono de Ferro. No entanto, quando o rei posteriormente gera um filho varão com sua segunda esposa, a corte racha em facções beligerantes conhecidas como os Verdes e os Negros.",
    "O conflito escala rapidamente para uma guerra civil de proporções continentais, forçando cada grande casa de Westeros a escolher um lado na iminente Dança dos Dragões.",
  ],
  metadata: {
    seasons: "3 Temporadas",
    releaseDate: "12 de Outubro de 2022",
    certification: "16",
    network: "HBO",
  },
  cast: [
    { id: 1, name: "Emma D'Arcy", character: "Princess Rhaenyra Targaryen", photoUrl: "/assets/cast-emma.png" },
    { id: 2, name: "Matt Smith", character: "Prince Daemon Targaryen", photoUrl: "/assets/cast-matt.png" },
    { id: 3, name: "Olivia Cooke", character: "Queen Alicent Hightower", photoUrl: "/assets/cast-olivia.png" },
    { id: 4, name: "Rhys Ifans", character: "Ser Otto Hightower", photoUrl: "/assets/cast-rhys.png" },
    { id: 5, name: "Steve Toussaint", character: "Lord Corlys Velaryon", photoUrl: "/assets/cast-steve.png" },
    { id: 6, name: "Eve Best", character: "Princess Rhaenys Targaryen", photoUrl: "/assets/cast-eve.png" },
  ],
  seasons: [
    { number: 1, episodes: seasonOneEpisodes },
    { number: 2, episodes: seasonOneEpisodes.slice(0, 6).map((episode) => ({ ...episode, id: episode.id + 20, watched: false })) },
    { number: 3, episodes: seasonOneEpisodes.slice(6).map((episode) => ({ ...episode, id: episode.id + 40 })) },
  ],
};

export async function getContentDetails(id: string): Promise<ContentDetails> {
  // Ponto único de troca: depois, substitua este mock pelo fetch ao TMDB.
  return { ...mockContent, id: Number(id) || mockContent.id };
}
