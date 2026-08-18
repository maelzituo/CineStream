import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Film, Edit3, X, Check } from 'lucide-react';
import { useLists } from '../hooks/useLists';
import { Movie } from '../types';
import { DEFAULT_POSTER_FALLBACK, handleImageError } from '../lib/imageFallback';

interface CustomListsProps {
  onNavigateToMovie: (movie: Movie) => void;
}

export default function CustomLists({ onNavigateToMovie }: CustomListsProps) {
  const { lists, loading, createList, deleteList, removeMovieFromList } = useLists();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [activeListId, setActiveListId] = useState<string | null>(null);

  if (loading) {
    return <div className="text-white text-center py-10">Carregando listas...</div>;
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList(newListName, newListDesc);
    setNewListName('');
    setNewListDesc('');
    setIsCreating(false);
  };

  const activeList = lists.find(l => l.id === activeListId);

  if (activeList) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveListId(null)}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-xl font-display font-bold text-white">{activeList.name}</h3>
              <p className="text-xs text-gray-400">{activeList.description}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir esta lista?')) {
                deleteList(activeList.id);
                setActiveListId(null);
              }
            }}
            className="text-red-400 hover:text-red-300 flex items-center gap-2 text-sm bg-red-400/10 px-4 py-2 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Lista
          </button>
        </div>

        {activeList.movies.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            Esta lista está vazia. Adicione filmes pelo catálogo.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {activeList.movies.map((m, idx) => (
              <motion.div
                key={m.movieId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group cursor-pointer overflow-hidden rounded-xl bg-surface-container"
                onClick={() => {
                  // Reconstruct partial movie object for navigation
                  onNavigateToMovie({
                    id: m.movieId,
                    title: m.title,
                    imageUrl: m.poster,
                    type: m.type as any,
                    backdropUrl: '',
                    description: '',
                    genres: [],
                    year: new Date(m.addedAt).getFullYear(),
                    ageRating: 'L',
                    duration: '',
                    rating: 0,
                    isOriginal: false,
                    similarIds: []
                  });
                }}
              >
                <div className="aspect-[2/3] w-full relative overflow-hidden rounded-xl border border-white/10 shadow-md">
                  <img
                    referrerPolicy="no-referrer"
                    src={m.poster || DEFAULT_POSTER_FALLBACK}
                    alt={m.title}
                    onError={(e) => handleImageError(e, 'poster')}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMovieFromList(activeList.id, m.movieId);
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 hover:bg-brand-red text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2.5 px-1">
                  <h3 className="font-display font-bold text-xs md:text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                    {m.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-white">Minhas Listas Personalizadas</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Lista
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateList} className="bg-surface-container border border-white/10 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-4">
          <h3 className="font-display font-bold text-white">Criar Nova Lista</h3>
          <div className="space-y-3">
            <input
              type="text"
              required
              placeholder="Nome da lista"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-red hover:bg-brand-red-hover text-white text-sm font-bold rounded-lg"
            >
              Criar
            </button>
          </div>
        </form>
      )}

      {lists.length === 0 && !isCreating ? (
        <div className="text-center py-20 text-gray-500 border border-white/5 rounded-2xl bg-white/5">
          <Film className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Você ainda não criou nenhuma lista.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {lists.map(list => (
            <div
              key={list.id}
              onClick={() => setActiveListId(list.id)}
              className="bg-surface-container border border-white/10 hover:border-brand-red/50 rounded-xl p-5 cursor-pointer transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-display font-bold text-white text-lg truncate pr-2">{list.name}</h4>
                <div className="bg-brand-red/20 text-brand-red text-xs px-2 py-1 rounded font-bold">
                  {list.movies.length}
                </div>
              </div>
              <p className="text-gray-400 text-xs line-clamp-2">{list.description || 'Sem descrição'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
