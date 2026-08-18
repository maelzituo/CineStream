export interface UserDocument {
  uid: string;
  name: string;
  email: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLogin: number;
  updatedAt: number;
  provider: string;
  premium: boolean;
  theme: string;
  language: string;
}

export interface MovieFavorite {
  movieId: string;
  title: string;
  poster: string;
  backdrop: string;
  type: string;
  addedAt: number;
}

export interface WatchlistItem {
  movieId: string;
  title: string;
  poster: string;
  addedAt: number;
}

export interface HistoryItem {
  movieId: string;
  progress: number;
  seconds?: number;
  watchedAt: number;
}

export interface Rating {
  movieId: string;
  rating: number;
  review: string;
  updatedAt: number;
}

export interface UserSettings {
  autoPlayNext: boolean;
  downloadOnlyOnWifi: boolean;
  notifications: boolean;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  movies: CustomListMovie[];
}

export interface CustomListMovie {
  movieId: string;
  title: string;
  poster: string;
  type: string;
  addedAt: number;
}
