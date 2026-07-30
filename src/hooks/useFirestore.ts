/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Bookmark, LastRead, MemorizationPreset, MemorizationPlan } from '../types';

export function useFirestore(userId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [presets, setPresets] = useState<MemorizationPreset[]>([]);
  const [plans, setPlans] = useState<MemorizationPlan[]>([]);

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      setLastRead(null);
      setPresets([]);
      setPlans([]);
      return;
    }

    // Bookmarks listener
    const bq = query(collection(db, 'bookmarks'), where('uid', '==', userId));
    const unsubscribeBookmarks = onSnapshot(bq, (snapshot) => {
      const b = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bookmark));
      setBookmarks(b);
    }, (error) => {
      console.error("Firestore Error (Bookmarks):", error);
    });

    // Last Read listener
    const lrq = doc(db, 'lastRead', userId);
    const unsubscribeLastRead = onSnapshot(lrq, (d) => {
      if (d.exists()) {
        setLastRead(d.data() as LastRead);
      } else {
        setLastRead(null);
      }
    }, (error) => {
      console.error("Firestore Error (LastRead):", error);
    });

    // Presets listener
    const pq = query(collection(db, 'memorizationPresets'), where('uid', '==', userId));
    const unsubscribePresets = onSnapshot(pq, (snapshot) => {
      const p = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MemorizationPreset));
      setPresets(p);
    }, (error) => {
      console.error("Firestore Error (Presets):", error);
    });

    // Plans listener
    const plansq = query(collection(db, 'memorizationPlans'), where('uid', '==', userId));
    const unsubscribePlans = onSnapshot(plansq, (snapshot) => {
      const pl = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MemorizationPlan));
      setPlans(pl);
    }, (error) => {
      console.error("Firestore Error (Plans):", error);
    });

    return () => {
      unsubscribeBookmarks();
      unsubscribeLastRead();
      unsubscribePresets();
      unsubscribePlans();
    };
  }, [userId]);

  const addBookmark = async (bookmark: Omit<Bookmark, 'id' | 'uid'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'bookmarks'), {
        ...bookmark,
        uid: userId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error adding bookmark:", error);
    }
  };

  const removeBookmark = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'bookmarks', id));
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  const addPreset = async (preset: Omit<MemorizationPreset, 'id' | 'uid'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'memorizationPresets'), {
        ...preset,
        uid: userId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error adding preset:", error);
    }
  };

  const removePreset = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'memorizationPresets', id));
    } catch (error) {
      console.error("Error removing preset:", error);
    }
  };

  const addPlan = async (plan: Omit<MemorizationPlan, 'id' | 'uid' | 'createdAt'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'memorizationPlans'), {
        ...plan,
        uid: userId,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const updatePlan = async (id: string, updates: Partial<MemorizationPlan>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'memorizationPlans', id), updates);
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  };

  const removePlan = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'memorizationPlans', id));
    } catch (error) {
      console.error("Error removing plan:", error);
    }
  };

  const updateLastRead = async (lr: Omit<LastRead, 'timestamp' | 'uid'>) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'lastRead', userId), {
        ...lr,
        uid: userId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error updating last read:", error);
    }
  };

  return {
    bookmarks,
    lastRead,
    presets,
    plans,
    addBookmark,
    removeBookmark,
    updateLastRead,
    addPreset,
    removePreset,
    addPlan,
    updatePlan,
    removePlan
  };
}
