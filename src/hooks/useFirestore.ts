/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Bookmark, LastRead, MemorizationPreset } from '../types';

export function useFirestore(userId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [presets, setPresets] = useState<MemorizationPreset[]>([]);

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      setLastRead(null);
      setPresets([]);
      return;
    }

    // Bookmarks listener
    const bq = query(collection(db, 'bookmarks'), where('uid', '==', userId));
    const unsubscribeBookmarks = onSnapshot(bq, (snapshot) => {
      const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
      setBookmarks(b);
    }, (error) => {
      console.error("Firestore Error (Bookmarks):", error);
    });

    // Last Read listener
    const lrq = doc(db, 'lastRead', userId);
    const unsubscribeLastRead = onSnapshot(lrq, (doc) => {
      if (doc.exists()) {
        setLastRead(doc.data() as LastRead);
      }
    }, (error) => {
      console.error("Firestore Error (LastRead):", error);
    });

    // Presets listener
    const pq = query(collection(db, 'memorizationPresets'), where('uid', '==', userId));
    const unsubscribePresets = onSnapshot(pq, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MemorizationPreset));
      setPresets(p);
    }, (error) => {
      console.error("Firestore Error (Presets):", error);
    });

    return () => {
      unsubscribeBookmarks();
      unsubscribeLastRead();
      unsubscribePresets();
    };
  }, [userId]);

  const addPreset = async (preset: Omit<MemorizationPreset, 'id'>) => {
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
    try {
      await deleteDoc(doc(db, 'memorizationPresets', id));
    } catch (error) {
      console.error("Error removing preset:", error);
    }
  };

  const addBookmark = async (bookmark: Omit<Bookmark, 'id'>) => {
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
    try {
      await deleteDoc(doc(db, 'bookmarks', id));
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  const updateLastRead = async (lr: Omit<LastRead, 'timestamp'>) => {
    if (!userId) return;
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'lastRead', userId), {
        ...lr,
        uid: userId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error updating last read:", error);
    }
  };

  return { bookmarks, lastRead, presets, addBookmark, removeBookmark, updateLastRead, addPreset, removePreset };
}
