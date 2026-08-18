import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../context/AuthContext';
import { Rating } from '../types/models';

export function useRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRatings([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/ratings`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Rating[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Rating);
      });
      setRatings(data.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching ratings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addRating = async (movieId: string, rating: number, review: string = '') => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/ratings`, movieId);
    await setDoc(ref, {
      movieId,
      rating,
      review,
      updatedAt: Date.now()
    }, { merge: true });
  };

  const removeRating = async (movieId: string) => {
    if (!user) return;
    const ref = doc(db, `users/${user.uid}/ratings`, movieId);
    await deleteDoc(ref);
  };

  const getRating = (movieId: string): Rating | undefined => {
    return ratings.find(r => r.movieId === movieId);
  };

  return { ratings, loading, addRating, removeRating, getRating };
}
