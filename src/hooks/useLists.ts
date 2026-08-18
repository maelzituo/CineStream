import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import { CustomList, CustomListMovie } from '../types/models';

export function useLists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/lists`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: CustomList[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as CustomList);
      });
      setLists(data.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching lists:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createList = async (name: string, description: string = '') => {
    if (!user) return;
    const newListId = Date.now().toString();
    const ref = doc(db, `users/${user.uid}/lists`, newListId);
    await setDoc(ref, {
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      movies: []
    });
  };

  const deleteList = async (listId: string) => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/lists`, listId);
    await deleteDoc(ref);
  };

  const addMovieToList = async (listId: string, movie: CustomListMovie) => {
    if (!user) return;
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    if (list.movies.some(m => m.movieId === movie.movieId)) return; // Already in list

    const updatedMovies = [...list.movies, movie];
    const ref = doc(db, `users/${user.uid}/lists`, listId);
    await setDoc(ref, { movies: updatedMovies, updatedAt: Date.now() }, { merge: true });
  };

  const removeMovieFromList = async (listId: string, movieId: string) => {
    if (!user) return;
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const updatedMovies = list.movies.filter(m => m.movieId !== movieId);
    const ref = doc(db, `users/${user.uid}/lists`, listId);
    await setDoc(ref, { movies: updatedMovies, updatedAt: Date.now() }, { merge: true });
  };

  return { lists, loading, createList, deleteList, addMovieToList, removeMovieFromList };
}
