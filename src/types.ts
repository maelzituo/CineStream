/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CastMember {
  id: string;
  name: string;
  character: string;
  imageUrl: string;
}

export interface Movie {
  id: string;
  tmdbId?: string | number; // ID do TMDb para geração do embed
  type?: 'movie' | 'series'; // Tipo do conteúdo (filme ou série)
  title: string;
  description: string;
  imageUrl: string; // Poster 2:3 aspect ratio
  backdropUrl: string; // Wide 16:9 aspect ratio
  year: number;
  ageRating: string; // e.g., "14+", "L", "16+"
  duration: string; // e.g., "2h 49min" ou "3 Temporadas"
  genres: string[];
  rating: number; // e.g., 9.0 ou 98 (percent)
  isOriginal?: boolean;
  progress?: number; // e.g., 65 para 65% assistido
  cast?: CastMember[];
  director?: string;
  similarIds?: string[];
  recommendations?: Movie[];
  videoUrl?: string; // Vídeo ou trailer secundário
  seasonsCount?: number; // Quantidade de temporadas para séries
  episodesPerSeason?: number; // Média de episódios por temporada
}

export type Tab = 'inicio' | 'busca' | 'lista' | 'perfil';

export type AuthProviderType = 'password' | 'google.com' | 'anonymous';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerId: AuthProviderType;
  createdAt?: string;
  lastLoginAt?: string;
  isPro?: boolean;
}

export interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failed' | 'register' | 'password_reset_request' | 'password_changed' | 'profile_updated' | 'logout' | 'rate_limit_lock';
  timestamp: number;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  strengthLabel: 'Muito Fraca' | 'Fraca' | 'Razoável' | 'Forte' | 'Excelente';
  errors: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export interface UserProfile {
  name: string;
  email: string;
  membershipDate: string;
  isPro: boolean;
  avatarUrl: string;
  provider?: AuthProviderType;
  stats: {
    moviesCount: number;
    listsCount: number;
    reviewsCount: number;
  };
  downloadUsage: string; // e.g. "4.2 GB"
  planType: string; // e.g. "Plano Anual"
}
