import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Check } from 'lucide-react';
import { useLists } from '../hooks/useLists';
import { Movie } from '../types';

interface AddToListModalProps {
  movie: Movie;
  onClose: () => void;
}

export default function AddToListModal({ movie, onClose }: AddToListModalProps) {
  const { lists, createList, addMovieToList, removeMovieFromList } = useLists();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList(newListName);
    setNewListName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-surface-container border border-white/10 rounded-2xl p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display font-bold text-xl text-white mb-6">Adicionar à Lista</h2>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {lists.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma lista criada.</p>
          ) : (
            lists.map(list => {
              const isInList = list.movies.some(m => m.movieId === String(movie.id));
              return (
                <button
                  key={list.id}
                  onClick={() => {
                    if (isInList) {
                      removeMovieFromList(list.id, String(movie.id));
                    } else {
                      addMovieToList(list.id, {
                        movieId: String(movie.id),
                        title: movie.title,
                        poster: movie.imageUrl || '',
                        type: movie.type || 'movie',
                        addedAt: Date.now()
                      });
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                >
                  <span className="font-display font-bold text-sm text-white">{list.name}</span>
                  {isInList ? (
                    <Check className="w-5 h-5 text-brand-red" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {isCreating ? (
          <form onSubmit={handleCreateList} className="space-y-3">
            <input
              type="text"
              autoFocus
              placeholder="Nome da nova lista"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-brand-red hover:bg-brand-red-hover text-white text-sm font-bold rounded-lg"
              >
                Criar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-3 border border-dashed border-white/20 hover:border-brand-red rounded-xl text-gray-300 hover:text-brand-red transition-colors flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Criar Nova Lista
          </button>
        )}
      </motion.div>
    </div>
  );
}
