/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Ayah, PlaybackSettings } from '../types';

interface PlaybackState {
  currentAyahIndex: number;
  currentRepeat: number;
  isArabicPlaying: boolean;
  isPlaying: boolean;
  progress: number;
}

export function useMemorizationPlayback(
  ayahs: Ayah[],
  repeatCount: number,
  playMeaning: boolean,
  settings: PlaybackSettings
) {
  const [state, setState] = useState<PlaybackState>({
    currentAyahIndex: 0,
    currentRepeat: 1,
    isArabicPlaying: true,
    isPlaying: false,
    progress: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = handleAudioEnded;
    audioRef.current.ontimeupdate = handleTimeUpdate;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackSpeed;
    }
  }, [settings.playbackSpeed]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setState(prev => ({ ...prev, progress: p || 0 }));
    }
  };

  // Play audio whenever state changes (currentAyahIndex, isArabicPlaying, isPlaying)
  useEffect(() => {
    if (!audioRef.current || ayahs.length === 0 || !state.isPlaying) return;

    const currentAyah = ayahs[state.currentAyahIndex];
    if (!currentAyah) {
      console.warn('No currentAyah for playback:', state.currentAyahIndex, ayahs);
      return;
    }
    let url = '';

    // Remove any previous error handler
    audioRef.current.onerror = null;

    // Always set onended handler
    audioRef.current.onended = handleAudioEnded;

    if (state.isArabicPlaying) {
      url = `https://cdn.islamic.network/quran/audio/128/${settings.reciter}/${currentAyah.number}.mp3`;
    } else {
      // Malayalam audio from lalithasaram.net, pad numbers to 3 digits
      const surahNum = String(currentAyah.surahNumber ?? 1).padStart(3, '0');
      const ayahNum = String(currentAyah.numberInSurah || currentAyah.number).padStart(3, '0');
      url = `https://lalithasaram.net/audio/qtaud/transl/${surahNum}_${ayahNum}.ogg`;
      // If audio fails to load, skip to next
      audioRef.current.onerror = () => {
        handleAudioEnded();
      };
    }
    audioRef.current.src = url;
    console.log('Playing audio:', url, 'Ayah:', currentAyah, 'isArabic:', state.isArabicPlaying);
    audioRef.current.play().catch(err => {
      console.error("Playback error:", err);
      handleAudioEnded();
    });
    // progress will be updated by ontimeupdate
    // isPlaying is already true
    // UI will always reflect the current state
  }, [state.currentAyahIndex, state.isArabicPlaying, state.isPlaying, ayahs, settings.reciter]);

  const handleAudioEnded = () => {
    console.log('Audio ended. State:', state);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (playMeaning && state.isArabicPlaying) {
      // Switch to meaning (Malayalam)
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isArabicPlaying: false, progress: 0 }));
      }, settings.delayBetweenAyahs * 1000);
    } else {
      // Repeat each ayah for repeatCount times (or endlessly if repeatCount >= 999) before moving to next ayah
      if (repeatCount >= 999 || state.currentRepeat < repeatCount) {
        // Repeat current ayah
        timeoutRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentRepeat: prev.currentRepeat + 1,
            isArabicPlaying: true,
            progress: 0
          }));
        }, settings.delayBetweenAyahs * 1000);
      } else if (state.currentAyahIndex < ayahs.length - 1) {
        // Move to next ayah and reset repeat
        timeoutRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentAyahIndex: prev.currentAyahIndex + 1,
            currentRepeat: 1,
            isArabicPlaying: true,
            progress: 0
          }));
        }, settings.delayBetweenAyahs * 1000);
      } else {
        // Finished all ayahs
        setState(prev => ({ ...prev, isPlaying: false, progress: 100 }));
      }
    }
  };

  const start = () => {
    setState(prev => ({ ...prev, isPlaying: true, currentAyahIndex: 0, currentRepeat: 1, isArabicPlaying: true }));
    // Directly play audio after user action for autoplay reliability
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }, 0);
  };

  const pause = () => {
    if (audioRef.current) audioRef.current.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const resume = () => {
    if (audioRef.current) audioRef.current.play();
    setState(prev => ({ ...prev, isPlaying: true }));
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState({
      currentAyahIndex: 0,
      currentRepeat: 1,
      isArabicPlaying: true,
      isPlaying: false,
      progress: 0,
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const next = () => {
    if (state.currentAyahIndex < ayahs.length - 1) {
      setState(prev => ({ ...prev, currentAyahIndex: prev.currentAyahIndex + 1, isArabicPlaying: true, progress: 0 }));
      // playCurrent will be triggered by useEffect
    }
  };

  const prev = () => {
    if (state.currentAyahIndex > 0) {
      setState(prev => ({ ...prev, currentAyahIndex: prev.currentAyahIndex - 1, isArabicPlaying: true, progress: 0 }));
      // playCurrent will be triggered by useEffect
    }
  };

  return { ...state, start, pause, resume, stop, next, prev };
}
