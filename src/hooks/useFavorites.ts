import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import { MovieFavorite } from '../types/models';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<MovieFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/favorites`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: MovieFavorite[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as MovieFavorite);
      });
      setFavorites(data.sort((a, b) => b.addedAt - a.addedAt));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching favorites:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addFavorite = async (movie: Omit<MovieFavorite, 'addedAt'>) => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/favorites`, movie.movieId);
    await setDoc(ref, {
      ...movie,
      addedAt: Date.now()
    }, { merge: true });
  };

  const removeFavorite = async (movieId: string) => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/favorites`, movieId);
    await deleteDoc(ref);
  };

  const isFavorite = (movieId: string) => {
    return favorites.some(f => f.movieId === movieId);
  };

  return { favorites, loading, addFavorite, removeFavorite, isFavorite };
}
