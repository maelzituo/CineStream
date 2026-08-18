import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import { HistoryItem } from '../types/models';

export function useHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/history`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as HistoryItem);
      });
      setHistory(data.sort((a, b) => b.watchedAt - a.watchedAt));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateHistory = async (movieId: string, progress: number, seconds?: number) => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/history`, movieId);
    await setDoc(ref, {
      movieId,
      progress,
      seconds,
      watchedAt: Date.now()
    }, { merge: true });
  };

  const getProgress = (movieId: string): number => {
    const item = history.find(h => h.movieId === movieId);
    return item ? item.progress : 0;
  };

  return { history, loading, updateHistory, getProgress };
}
