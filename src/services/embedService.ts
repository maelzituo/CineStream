/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProviderId = 'vidsrcto' | 'cdnembed' | 'vidsrcme';

export interface EmbedProvider {
  id: ProviderId;
  name: string;
  getMovieUrl: (tmdbId: string | number) => string;
  getSeriesUrl: (tmdbId: string | number, season: number, episode: number) => string;
}

/**
 * EmbedService - Serviço responsável por gerenciar e gerar as URLs de reprodução de múltiplos provedores.
 */
export class EmbedService {
  public static readonly PROVIDERS: EmbedProvider[] = [
    {
      id: 'vidsrcto',
      name: 'VidSrc.to (Servidor Principal)',
      getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
      getSeriesUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
    },
    {
      id: 'cdnembed',
      name: 'CDN Embed (Servidor Secundário)',
      getMovieUrl: (id) => `https://cdn-embed.com/filme/${id}`,
      getSeriesUrl: (id, s, e) => `https://cdn-embed.com/serie/${id}/${s}/${e}`
    },
    {
      id: 'vidsrcme',
      name: 'VidSrc ME (Servidor Alternativo)',
      getMovieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
      getSeriesUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
    }
  ];

  /**
   * Valida se um TMDb ID é válido e numérico ou string preenchida
   */
  public static isValidTmdbId(tmdbId?: string | number): boolean {
    if (tmdbId === undefined || tmdbId === null || tmdbId === '') return false;
    const str = String(tmdbId).trim();
    return str.length > 0 && !isNaN(Number(str));
  }
}

export default EmbedService;
