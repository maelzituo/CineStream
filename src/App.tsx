/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import MovieShelf from './components/MovieShelf';
import MovieDetails from './components/MovieDetails';
import MyList from './components/MyList';
import Profile from './components/Profile';
import Search from './components/Search';
import VideoPlayer from './components/VideoPlayer';
import AuthModal from './components/auth/AuthModal';
import PWAInstallBanner from './components/pwa/PWAInstallBanner';
import PWAUpdateToast from './components/pwa/PWAUpdateToast';
import OfflineIndicator from './components/pwa/OfflineIndicator';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Movie, Tab } from './types';
import { MOVIES_DATABASE, INITIAL_SAVED_IDS } from './data/movies';
import { Home, Search as SearchIcon, Bookmark, User, HardDrive, RefreshCw } from 'lucide-react';
import { db, WatchHistoryEntry } from './lib/database';
import { fetchGoogleDriveMovies } from './lib/drive';
import MovieRepository from './services/movieRepository';
import SeriesRepository from './services/seriesRepository';

function CineStreamApp() {
  // Navegação por Abas com suporte a PWA shortcuts da URL
  const [currentTab, setCurrentTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'busca' || tabParam === 'lista' || tabParam === 'perfil') {
        return tabParam as Tab;
      }
    }
    return 'inicio';
  });

  // Auth Context
  const { user, driveToken, loginWithGoogle, logout } = useAuth();

  // Estados do Google Drive
  const [gdriveMovies, setGdriveMovies] = useState<Movie[]>([]);
  const [loadingGdrive, setLoadingGdrive] = useState(false);
  const [gdriveError, setGdriveError] = useState<string | null>(null);

  // Estados do Catálogo TMDb
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [popularSeries, setPopularSeries] = useState<Movie[]>([]);
  const [onTheAirSeries, setOnTheAirSeries] = useState<Movie[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  // Busca catálogo completo via TMDb com repositórios e suporte a cache local
  const loadTmdbCatalog = useCallback(async () => {
    setIsCatalogLoading(true);
    try {
      const [
        trendingRes,
        popularMRes,
        topRatedMRes,
        nowPlayingMRes,
        upcomingMRes,
        popularSRes,
        onTheAirSRes,
      ] = await Promise.all([
        MovieRepository.getTrendingMovies(1),
        MovieRepository.getPopularMovies(1),
        MovieRepository.getTopRatedMovies(1),
        MovieRepository.getNowPlayingMovies(1),
        MovieRepository.getUpcomingMovies(1),
        SeriesRepository.getPopularSeries(1),
        SeriesRepository.getOnTheAirSeries(1),
      ]);

      setTrending(trendingRes.results);
      setPopularMovies(popularMRes.results);
      setTopRatedMovies(topRatedMRes.results);
      setNowPlayingMovies(nowPlayingMRes.results);
      setUpcomingMovies(upcomingMRes.results);
      setPopularSeries(popularSRes.results);
      setOnTheAirSeries(onTheAirSRes.results);
    } catch (e) {
      console.warn('Erro ao carregar catálogo TMDb, utilizando banco local:', e);
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTmdbCatalog();
  }, [loadTmdbCatalog]);

  // Carrega filmes do Google Drive se o token estiver ativo
  useEffect(() => {
    if (driveToken) {
      const loadDrive = async () => {
        try {
          setLoadingGdrive(true);
          setGdriveError(null);
          const movies = await fetchGoogleDriveMovies(driveToken);
          setGdriveMovies(movies);
        } catch (err: any) {
          console.error('Erro ao carregar do Drive:', err);
          setGdriveError('Falha ao carregar os filmes da pasta do Google Drive.');
        } finally {
          setLoadingGdrive(false);
        }
      };
      loadDrive();
    } else {
      setGdriveMovies([]);
    }
  }, [driveToken]);

  const handleGoogleSignIn = async () => {
    try {
      setLoadingGdrive(true);
      setGdriveError(null);
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.message?.includes('fechado')) {
        setGdriveError('Conexão cancelada pelo usuário.');
      } else {
        setGdriveError('Não foi possível autenticar com o Google.');
      }
    } finally {
      setLoadingGdrive(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setGdriveMovies([]);
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    }
  };

  // Histórico de navegação de detalhes do filme
  const [movieHistory, setMovieHistory] = useState<Movie[]>([]);
  const activeMovieDetail = movieHistory[movieHistory.length - 1] || null;

  // Filme em execução no Player
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);

  // Histórico de reprodução
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>([]);

  // Lista de favoritos sincronizada com localStorage
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('cinestream_saved_ids');
    return cached ? JSON.parse(cached) : INITIAL_SAVED_IDS;
  });

  useEffect(() => {
    localStorage.setItem('cinestream_saved_ids', JSON.stringify(savedIds));
  }, [savedIds]);

  // Carrega histórico de visualizações
  const loadWatchHistory = async () => {
    try {
      const history = await db.getWatchHistory();
      setWatchHistory(history);
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    }
  };

  useEffect(() => {
    loadWatchHistory();
  }, [playingMovie]);

  const handleSavedToggle = (movie: Movie) => {
    setSavedIds((prev) => {
      if (prev.includes(movie.id)) {
        return prev.filter((id) => id !== movie.id);
      } else {
        return [...prev, movie.id];
      }
    });
  };

  const handleRemoveFromList = (movie: Movie) => {
    setSavedIds((prev) => prev.filter((id) => id !== movie.id));
  };

  const handleMovieSelect = (movie: Movie) => {
    setMovieHistory((prev) => [...prev, movie]);
  };

  const handleBackFromDetails = () => {
    setMovieHistory((prev) => prev.slice(0, -1));
    loadWatchHistory();
  };

  const handleNavigateToMovieInDetails = (movie: Movie) => {
    setMovieHistory((prev) => [...prev, movie]);
  };

  const handleTabChange = (tab: Tab) => {
    setMovieHistory([]);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadWatchHistory();
  };

  // Combina todos os catálogos (TMDb + Banco Local + Google Drive)
  const allMovies = useMemo(() => {
    const baseList = trending.length > 0 ? trending : MOVIES_DATABASE;
    const combined = [...baseList, ...popularMovies, ...popularSeries, ...gdriveMovies];
    const uniqueMap = new Map<string, Movie>();
    combined.forEach((item) => uniqueMap.set(item.id, item));
    return Array.from(uniqueMap.values());
  }, [trending, popularMovies, popularSeries, gdriveMovies]);

  // Aplica o progresso do histórico
  const moviesWithProgress = useMemo(() => {
    return allMovies.map((movie) => {
      const historyEntry = watchHistory.find((h) => h.movieId === movie.id);
      return {
        ...movie,
        progress: historyEntry ? historyEntry.progress : undefined,
      };
    });
  }, [allMovies, watchHistory]);

  // Filme Destaque no Hero
  const heroMovie = trending[0] || MOVIES_DATABASE[0];

  // Filtro de Continuar Assistindo (Iniciados e não concluídos)
  const continueWatchingMovies = watchHistory
    .map((entry) => {
      const movie = allMovies.find((m) => m.id === entry.movieId);
      if (movie) {
        return {
          ...movie,
          progress: entry.progress,
        };
      }
      return null;
    })
    .filter((m): m is Movie => !!m && m.progress !== undefined && m.progress < 95);

  const savedMovies = moviesWithProgress.filter((m) => savedIds.includes(m.id));

  const showGlobalFrame = !activeMovieDetail && !playingMovie;

  return (
    <div className="min-h-screen bg-brand-bg text-gray-200 font-sans selection:bg-brand-red selection:text-white">
      {/* Header Principal */}
      {showGlobalFrame && (
        <Header
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          onSearchClick={() => handleTabChange('busca')}
          onProfileClick={() => handleTabChange('perfil')}
        />
      )}

      {/* Conteúdo Principal */}
      <main className="transition-all duration-300">
        {!activeMovieDetail && (
          <>
            {/* Aba Início - Estilo Netflix */}
            {currentTab === 'inicio' && (
              <div className="space-y-12 pb-32">
                {/* Hero Imersivo do Filme Principal */}
                <Hero
                  movie={heroMovie}
                  onPlayClick={(movie) => setPlayingMovie(movie)}
                  onInfoClick={handleMovieSelect}
                />

                {/* Fileiras do Catálogo */}
                <div className="space-y-12 -mt-16 relative z-30">
                  {/* Botão de Pull-to-Refresh do Catálogo */}
                  <div className="flex justify-end px-6 md:px-16">
                    <button
                      onClick={loadTmdbCatalog}
                      disabled={isCatalogLoading}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-sans text-gray-300 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isCatalogLoading ? 'animate-spin text-brand-red' : ''
                        }`}
                      />
                      {isCatalogLoading ? 'Atualizando TMDb...' : 'Atualizar Catálogo'}
                    </button>
                  </div>

                  {/* Continuar Assistindo */}
                  {continueWatchingMovies.length > 0 && (
                    <MovieShelf
                      title="Continuar Assistindo"
                      movies={continueWatchingMovies}
                      layout="landscape"
                      onMovieClick={handleMovieSelect}
                      onSavedToggle={handleSavedToggle}
                      savedIds={savedIds}
                    />
                  )}

                  {/* Tendências (Trending) */}
                  <MovieShelf
                    title="Tendências do TMDb"
                    movies={trending.length > 0 ? trending : MOVIES_DATABASE}
                    layout="poster"
                    onMovieClick={handleMovieSelect}
                    onSavedToggle={handleSavedToggle}
                    savedIds={savedIds}
                  />

                  {/* Filmes Populares */}
                  <MovieShelf
                    title="Filmes Populares"
                    movies={popularMovies.length > 0 ? popularMovies : MOVIES_DATABASE}
                    layout="poster"
                    onMovieClick={handleMovieSelect}
                    onSavedToggle={handleSavedToggle}
                    savedIds={savedIds}
                  />

                  {/* Séries Populares */}
                  <MovieShelf
                    title="Séries Populares"
                    movies={
                      popularSeries.length > 0
                        ? popularSeries
                        : MOVIES_DATABASE.filter((m) => m.type === 'series')
                    }
                    layout="poster"
                    onMovieClick={handleMovieSelect}
                    onSavedToggle={handleSavedToggle}
                    savedIds={savedIds}
                  />

                  {/* Lançamentos (Now Playing) */}
                  <MovieShelf
                    title="Lançamentos no Cinema"
                    movies={nowPlayingMovies.length > 0 ? nowPlayingMovies : MOVIES_DATABASE}
                    layout="landscape"
                    onMovieClick={handleMovieSelect}
                    onSavedToggle={handleSavedToggle}
                    savedIds={savedIds}
                  />

                  {/* Mais Bem Avaliados */}
                  <MovieShelf
                    title="Mais Bem Avaliados"
                    movies={topRatedMovies.length > 0 ? topRatedMovies : MOVIES_DATABASE}
                    layout="poster"
                    onMovieClick={handleMovieSelect}
                    onSavedToggle={handleSavedToggle}
                    savedIds={savedIds}
                  />

                  {/* Séries em Exibição */}
                  <MovieShelf
                    title="Séries em Exibição"
                    movies={
                      onTheAirSeries.length > 0
                        ? onTheAirSeries
                        : MOVIES_DATABASE.filter((m) => m.type === 'series')
                    }
                    layout="landscape"
                    onMovieClick={handleMovieSelect}
                    onSavedToggle={handleSavedToggle}
                    savedIds={savedIds}
                  />

                  {/* Próximos Lançamentos */}
                  <MovieShelf
                    title="Próximos Lançamentos"
                    movies={
                      upcomingMovies.length > 0 ? upcomingMovies : MOVIES_DATABASE.slice(0, 5)
                    }
                    layout="poster"
                    onMovieClick={handleMovieSelect}
                    onSavedToggle={handleSavedToggle}
                    savedIds={savedIds}
                  />

                  {/* Seção Google Drive */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-6 md:px-16">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          {user && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3 ${
                              user ? 'bg-emerald-500' : 'bg-gray-600'
                            }`}
                          ></span>
                        </span>
                        <h2 className="font-display font-extrabold text-sm md:text-base tracking-wider uppercase text-white flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-brand-red inline" />
                          Filmes do Google Drive
                        </h2>
                      </div>
                      {user && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                          CONECTADO: {user.email}
                        </span>
                      )}
                    </div>

                    {!driveToken && !user ? (
                      <div className="mx-6 md:mx-16 p-6 rounded-2xl bg-gradient-to-r from-red-950/20 to-surface-container/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                          <p className="text-white font-display font-black text-sm md:text-base">
                            Assista aos filmes salvos na sua nuvem Google Drive!
                          </p>
                          <p className="text-xs text-gray-400 max-w-xl">
                            Conecte sua conta do Google para carregar e reproduzir seus arquivos de mídia de forma segura e rápida.
                          </p>
                        </div>
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={loadingGdrive}
                          className="flex-none px-6 py-3 bg-brand-red hover:bg-brand-red-hover disabled:bg-gray-800 disabled:text-gray-500 text-white font-display font-black text-xs tracking-widest rounded-xl transition-all cursor-pointer active:scale-95 shadow-lg shadow-brand-red/30 flex items-center gap-2"
                        >
                          {loadingGdrive ? 'CONECTANDO...' : 'CONECTAR COM GOOGLE'}
                        </button>
                      </div>
                    ) : loadingGdrive ? (
                      <div className="mx-6 md:mx-16 py-12 flex flex-col items-center justify-center space-y-3 bg-surface-container/20 rounded-2xl border border-white/5">
                        <div className="w-8 h-8 rounded-full border-4 border-brand-red border-t-transparent animate-spin" />
                        <p className="text-xs font-mono text-gray-400">
                          Buscando arquivos do Google Drive...
                        </p>
                      </div>
                    ) : gdriveError ? (
                      <div className="mx-6 md:mx-16 p-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                        <p className="text-xs text-brand-red font-semibold">{gdriveError}</p>
                      </div>
                    ) : gdriveMovies.length === 0 ? (
                      <div className="mx-6 md:mx-16 p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-2">
                        <p className="text-xs text-gray-400">
                          Nenhum arquivo de vídeo encontrado na pasta do Drive.
                        </p>
                      </div>
                    ) : (
                      <MovieShelf
                        title="Seus Filmes na Nuvem"
                        movies={gdriveMovies}
                        layout="landscape"
                        onMovieClick={handleMovieSelect}
                        onSavedToggle={handleSavedToggle}
                        savedIds={savedIds}
                      />
                    )}
                  </div>

                  {/* Minha Lista / Favoritos */}
                  <MovieShelf
                    title="Minha Lista"
                    movies={savedMovies}
                    layout="poster"
                    onMovieClick={handleMovieSelect}
                    onSavedToggle={handleSavedToggle}
                    savedIds={savedIds}
                  />
                </div>
              </div>
            )}

            {/* Aba Busca */}
            {currentTab === 'busca' && (
              <Search movies={moviesWithProgress} onMovieClick={handleMovieSelect} />
            )}

            {/* Aba Minha Lista */}
            {currentTab === 'lista' && (
              <MyList
                savedMovies={savedMovies}
                onMovieClick={handleMovieSelect}
                onRemoveFromList={handleRemoveFromList}
                onNavigateHome={() => handleTabChange('inicio')}
              />
            )}

            {/* Aba Perfil */}
            {currentTab === 'perfil' && (
              <Profile
                onLogout={handleGoogleSignOut}
                gdriveUser={user}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
              />
            )}
          </>
        )}

        {/* Detalhes do Filme ou Série */}
        {activeMovieDetail && !playingMovie && (
          <MovieDetails
            movie={activeMovieDetail}
            onBack={handleBackFromDetails}
            onPlayClick={(movie) => setPlayingMovie(movie)}
            onSavedToggle={handleSavedToggle}
            savedIds={savedIds}
            onNavigateToMovie={handleNavigateToMovieInDetails}
          />
        )}
      </main>

      {/* Player de Vídeo em Tela Cheia */}
      {playingMovie && (
        <VideoPlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />
      )}

      {/* Modal Universal de Autenticação */}
      <AuthModal />

      {/* PWA Components */}
      <OfflineIndicator />
      <PWAInstallBanner />
      <PWAUpdateToast />

      {/* Navegação Inferior Mobile */}
      {showGlobalFrame && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-white/10 bg-surface-container/90 flex justify-around items-center h-[calc(4.25rem+var(--sab))] safe-bottom-nav px-2 shadow-2xl transition-transform duration-500"
          id="bottom-nav"
        >
          <button
            onClick={() => handleTabChange('inicio')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              currentTab === 'inicio' ? 'text-brand-red scale-105' : 'text-gray-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-display font-black text-[9px] mt-1 uppercase tracking-wider">
              Início
            </span>
          </button>

          <button
            onClick={() => handleTabChange('busca')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              currentTab === 'busca' ? 'text-brand-red scale-105' : 'text-gray-400'
            }`}
          >
            <SearchIcon className="w-5 h-5" />
            <span className="font-display font-black text-[9px] mt-1 uppercase tracking-wider">
              Busca
            </span>
          </button>

          <button
            onClick={() => handleTabChange('lista')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              currentTab === 'lista' ? 'text-brand-red scale-105' : 'text-gray-400'
            }`}
          >
            <Bookmark
              className={`w-5 h-5 ${currentTab === 'lista' ? 'fill-brand-red' : ''}`}
            />
            <span className="font-display font-black text-[9px] mt-1 uppercase tracking-wider">
              Minha Lista
            </span>
          </button>

          <button
            onClick={() => handleTabChange('perfil')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all ${
              currentTab === 'perfil' ? 'text-brand-red scale-105' : 'text-gray-400'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-display font-black text-[9px] mt-1 uppercase tracking-wider">
              Perfil
            </span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CineStreamApp />
    </AuthProvider>
  );
}
