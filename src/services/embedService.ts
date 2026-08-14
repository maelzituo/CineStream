/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * EmbedService - Serviço responsável por gerenciar e gerar as URLs de reprodução do EmbedMovies.
 */
export class EmbedService {
  private static readonly BASE_URL = 'https://cdn-embed.com';

  /**
   * Gera a URL do player para filmes no formato: https://cdn-embed.com/filme/{TMDB_ID}
   */
  public static getMovieEmbedUrl(tmdbId: string | number): string {
    const cleanId = String(tmdbId).trim();
    return `${this.BASE_URL}/filme/${cleanId}`;
  }

  /**
   * Gera a URL do player para séries no formato: https://cdn-embed.com/serie/{TMDB_ID}/{TEMPORADA}/{EPISODIO}
   */
  public static getSeriesEmbedUrl(
    tmdbId: string | number,
    season: number = 1,
    episode: number = 1
  ): string {
    const cleanId = String(tmdbId).trim();
    const cleanSeason = Math.max(1, Math.floor(season));
    const cleanEpisode = Math.max(1, Math.floor(episode));
    return `${this.BASE_URL}/serie/${cleanId}/${cleanSeason}/${cleanEpisode}`;
  }

  /**
   * Valida se um TMDb ID é válido e numérico ou string preenchida
   */
  public static isValidTmdbId(tmdbId?: string | number): boolean {
    if (tmdbId === undefined || tmdbId === null || tmdbId === '') return false;
    const str = String(tmdbId).trim();
    return str.length > 0 && !isNaN(Number(str));
  }

  /**
   * Obtém a URL correta do embed com base nas propriedades do item (filme ou série)
   */
  public static getEmbedUrl(
    item: { tmdbId?: string | number; type?: 'movie' | 'series' },
    season: number = 1,
    episode: number = 1
  ): string | null {
    if (!this.isValidTmdbId(item.tmdbId)) {
      return null;
    }

    if (item.type === 'series') {
      return this.getSeriesEmbedUrl(item.tmdbId!, season, episode);
    }

    return this.getMovieEmbedUrl(item.tmdbId!);
  }
}

export default EmbedService;
