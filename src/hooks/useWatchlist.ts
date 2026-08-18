import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import { WatchlistItem } from '../types/models';

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/watchlist`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: WatchlistItem[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as WatchlistItem);
      });
      setWatchlist(data.sort((a, b) => b.addedAt - a.addedAt));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching watchlist:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addToWatchlist = async (item: Omit<WatchlistItem, 'addedAt'>) => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/watchlist`, item.movieId);
    await setDoc(ref, {
      ...item,
      addedAt: Date.now()
    }, { merge: true });
  };

  const removeFromWatchlist = async (movieId: string) => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/watchlist`, movieId);
    await deleteDoc(ref);
  };

  const isInWatchlist = (movieId: string) => {
    return watchlist.some(w => w.movieId === movieId);
  };

  return { watchlist, loading, addToWatchlist, removeFromWatchlist, isInWatchlist };
}
