/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Ayah, PlaybackSettings } from '../types';
import { workerTimer } from '../utils/workerTimer';
import { mediaSessionManager } from '../services/mediaSession';

interface PlaybackState {
  currentAyahIndex: number;
  currentRepeat: number;
  isArabicPlaying: boolean;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

export function useMemorizationPlayback(
  ayahs: Ayah[],
  repeatCount: number,
  playMeaning: boolean,
  settings: PlaybackSettings,
  surahName?: string
) {
  const [state, setState] = useState<PlaybackState>({
    currentAyahIndex: 0,
    currentRepeat: 1,
    isArabicPlaying: true,
    isPlaying: false,
    progress: 0,
    duration: 0
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutIdRef = useRef<number | null>(null);

  // Initialize Audio instance with background event listeners
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const p = (audio.currentTime / audio.duration) * 100;
        setState(prev => ({
          ...prev,
          progress: p || 0,
          duration: audio.duration
        }));
        mediaSessionManager.updatePositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime
        });
      }
    };

    const handlePlay = () => {
      mediaSessionManager.updatePlaybackState('playing');
    };

    const handlePause = () => {
      mediaSessionManager.updatePlaybackState('paused');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      if (timeoutIdRef.current) {
        workerTimer.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackSpeed;
    }
  }, [settings.playbackSpeed]);

  const handleAudioEnded = useCallback(() => {
    if (timeoutIdRef.current) {
      workerTimer.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (playMeaning && state.isArabicPlaying) {
      // Switch to Malayalam meaning after delay
      timeoutIdRef.current = workerTimer.setTimeout(() => {
        setState(prev => ({ ...prev, isArabicPlaying: false, progress: 0 }));
      }, settings.delayBetweenAyahs * 1000);
    } else {
      // Check repeat count for current Ayah
      if (repeatCount >= 999 || state.currentRepeat < repeatCount) {
        timeoutIdRef.current = workerTimer.setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentRepeat: prev.currentRepeat + 1,
            isArabicPlaying: true,
            progress: 0
          }));
        }, settings.delayBetweenAyahs * 1000);
      } else if (state.currentAyahIndex < ayahs.length - 1) {
        // Advance to next Ayah
        timeoutIdRef.current = workerTimer.setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentAyahIndex: prev.currentAyahIndex + 1,
            currentRepeat: 1,
            isArabicPlaying: true,
            progress: 0
          }));
        }, (settings.delayBetweenCycles || settings.delayBetweenAyahs) * 1000);
      } else {
        // Completed all Ayahs in range
        setState(prev => ({ ...prev, isPlaying: false, progress: 100 }));
        mediaSessionManager.updatePlaybackState('paused');
      }
    }
  }, [playMeaning, state.isArabicPlaying, state.currentRepeat, state.currentAyahIndex, repeatCount, ayahs.length, settings.delayBetweenAyahs, settings.delayBetweenCycles]);

  // Play audio track whenever state changes
  useEffect(() => {
    if (!audioRef.current || ayahs.length === 0 || !state.isPlaying) return;

    const currentAyah = ayahs[state.currentAyahIndex];
    if (!currentAyah) return;

    let url = '';
    const ayahNum = currentAyah.numberInSurah || currentAyah.number;
    const sName = surahName || (currentAyah.surahNumber ? `Surah ${currentAyah.surahNumber}` : 'Quran Memorization');

    if (state.isArabicPlaying) {
      url = `https://cdn.islamic.network/quran/audio/128/${settings.reciter}/${currentAyah.number}.mp3`;
      mediaSessionManager.updateMetadata({
        title: `${sName} • Ayah ${ayahNum}`,
        artist: `Mishary Rashid Alafasy (Cycle ${state.currentRepeat}/${repeatCount >= 999 ? '♾️' : repeatCount})`,
        album: 'Memorization Practice'
      });
    } else {
      const surahNum = String(currentAyah.surahNumber ?? 1).padStart(3, '0');
      const formattedAyahNum = String(ayahNum).padStart(3, '0');
      url = `https://lalithasaram.net/audio/qtaud/transl/${surahNum}_${formattedAyahNum}.ogg`;
      mediaSessionManager.updateMetadata({
        title: `${sName} • Ayah ${ayahNum} (Meaning)`,
        artist: 'Malayalam Translation • Lalithasaram',
        album: 'Memorization Practice'
      });
    }

    const audio = audioRef.current;
    audio.onerror = () => {
      console.warn('Audio failed to load:', url);
      handleAudioEnded();
    };
    audio.onended = handleAudioEnded;
    audio.src = url;
    audio.playbackRate = settings.playbackSpeed;

    audio.play().catch(err => {
      console.warn('Playback error or interrupted:', err);
    });
  }, [state.currentAyahIndex, state.isArabicPlaying, state.isPlaying, state.currentRepeat, ayahs, settings.reciter, settings.playbackSpeed, surahName, repeatCount, handleAudioEnded]);

  const start = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: true,
      currentAyahIndex: 0,
      currentRepeat: 1,
      isArabicPlaying: true
    }));
    mediaSessionManager.updatePlaybackState('playing');
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
    if (timeoutIdRef.current) {
      workerTimer.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    mediaSessionManager.updatePlaybackState('paused');
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setState(prev => ({ ...prev, isPlaying: true }));
    mediaSessionManager.updatePlaybackState('playing');
  }, []);

  const stop = useCallback(() => {
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
      duration: 0
    });
    if (timeoutIdRef.current) {
      workerTimer.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    mediaSessionManager.updatePlaybackState('none');
  }, []);

  const next = useCallback(() => {
    if (state.currentAyahIndex < ayahs.length - 1) {
      if (timeoutIdRef.current) {
        workerTimer.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setState(prev => ({
        ...prev,
        currentAyahIndex: prev.currentAyahIndex + 1,
        currentRepeat: 1,
        isArabicPlaying: true,
        progress: 0
      }));
    }
  }, [state.currentAyahIndex, ayahs.length]);

  const prev = useCallback(() => {
    if (state.currentAyahIndex > 0) {
      if (timeoutIdRef.current) {
        workerTimer.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setState(prev => ({
        ...prev,
        currentAyahIndex: prev.currentAyahIndex - 1,
        currentRepeat: 1,
        isArabicPlaying: true,
        progress: 0
      }));
    }
  }, [state.currentAyahIndex]);

  // Connect lock screen MediaSession controls when active
  useEffect(() => {
    if (state.isPlaying) {
      mediaSessionManager.setActionHandlers({
        onPlay: resume,
        onPause: pause,
        onPreviousTrack: prev,
        onNextTrack: next,
        onStop: stop
      });
    }
  }, [state.isPlaying, resume, pause, prev, next, stop]);

  return { ...state, start, pause, resume, stop, next, prev };
}
