/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { mediaSessionManager } from '../services/mediaSession';
import { workerTimer } from '../utils/workerTimer';
import { quranAudioService } from '../services/quranAudioService';
import { Ayah } from '../types';
import { QURAN_RECITERS, DEFAULT_RECITER_ID, getReciterById, Reciter } from '../constants/reciters';

export type RepeatMode = 'none' | 'one' | 'surah';

export interface AudioTrack {
  id: string;
  src: string;
  fallbackSrc?: string;
  title: string;
  subtitle: string;
  surahNumber?: number;
  ayahNumber?: number;
  globalAyahNumber?: number;
  reciterId?: string;
  reciterName?: string;
  arabicText?: string;
  translation?: string;
}

export interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  playlist: AudioTrack[];
  currentIndex: number;
  isPlayerVisible: boolean;
  activeSurahNumber: number | null;
  activeAyahNumber: number | null;
  selectedReciter: string;
  reciters: Reciter[];

  // Actions
  setSelectedReciter: (reciterId: string) => void;
  playSingleTrack: (track: {
    src: string;
    fallbackSrc?: string;
    title: string;
    subtitle: string;
    surahNumber?: number;
    ayahNumber?: number;
    repeat?: boolean;
    reciterId?: string;
    reciterName?: string;
  }) => void;

  playSurahAyahs: (params: {
    surahNumber: number;
    surahName: string;
    ayahs: Ayah[];
    startIndex?: number;
    reciter?: string;
    repeatAyahOnly?: boolean;
  }) => void;

  playFullSurahStream: (surahNumber: number, surahName: string, reciterId?: string) => void;

  playAudio: (src: string, title: string, subtitle: string) => void;
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleRepeatMode: () => void;
  closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedReciter, setSelectedReciterState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('quran_selected_reciter') || DEFAULT_RECITER_ID;
    }
    return DEFAULT_RECITER_ID;
  });

  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>('none');
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlayerVisible, setIsPlayerVisible] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<AudioTrack | null>(null);
  const playlistRef = useRef<AudioTrack[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const repeatModeRef = useRef<RepeatMode>('none');
  const playbackSpeedRef = useRef<number>(1);
  const fallbackTriedRef = useRef<boolean>(false);

  // Sync refs
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const playTrackDirectly = useCallback((track: AudioTrack) => {
    if (!audioRef.current) return;

    fallbackTriedRef.current = false;
    currentTrackRef.current = track;
    setCurrentTrack(track);
    setIsPlayerVisible(true);
    setProgress(0);

    const audio = audioRef.current;
    audio.src = track.src;
    audio.playbackRate = playbackSpeedRef.current;
    audio.load();

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        mediaSessionManager.updatePlaybackState('playing');
      })
      .catch((err) => {
        console.warn('Audio play request:', err);
      });

    // Update Media Session Lock Screen Metadata
    mediaSessionManager.updateMetadata({
      title: track.title,
      artist: track.reciterName || track.subtitle,
      album: 'Al-Quran Al-Kareem'
    });

    // Broadcast event for UI synchronization
    window.dispatchEvent(
      new CustomEvent('quran-audio-track-change', {
        detail: {
          surahNumber: track.surahNumber,
          ayahNumber: track.ayahNumber,
          track
        }
      })
    );
  }, []);

  const nextTrack = useCallback(() => {
    const list = playlistRef.current;
    const idx = currentIndexRef.current;
    const mode = repeatModeRef.current;

    if (list.length > 0 && idx >= 0) {
      if (idx < list.length - 1) {
        const nextIdx = idx + 1;
        setCurrentIndex(nextIdx);
        playTrackDirectly(list[nextIdx]);
      } else if (mode === 'surah') {
        setCurrentIndex(0);
        playTrackDirectly(list[0]);
      } else {
        setIsPlaying(false);
        mediaSessionManager.updatePlaybackState('paused');
      }
    }
  }, [playTrackDirectly]);

  const prevTrack = useCallback(() => {
    const list = playlistRef.current;
    const idx = currentIndexRef.current;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    if (list.length > 0 && idx > 0) {
      const prevIdx = idx - 1;
      setCurrentIndex(prevIdx);
      playTrackDirectly(list[prevIdx]);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    }
  }, [playTrackDirectly]);

  // Single mount-only effect to initialize HTML5 Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handlePlay = () => {
      setIsPlaying(true);
      mediaSessionManager.updatePlaybackState('playing');
    };

    const handlePause = () => {
      setIsPlaying(false);
      mediaSessionManager.updatePlaybackState('paused');
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setProgress(audio.currentTime);
        if (audio.duration && !isNaN(audio.duration)) {
          mediaSessionManager.updatePositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
          });
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        mediaSessionManager.updatePositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime || 0
        });
      }
    };

    const handleEnded = () => {
      window.dispatchEvent(new Event('quran-audio-ended'));

      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      const list = playlistRef.current;
      const idx = currentIndexRef.current;

      if (list.length > 0 && idx >= 0) {
        if (idx < list.length - 1) {
          const nextIdx = idx + 1;
          setCurrentIndex(nextIdx);
          playTrackDirectly(list[nextIdx]);
        } else if (repeatModeRef.current === 'surah') {
          setCurrentIndex(0);
          playTrackDirectly(list[0]);
        } else {
          setIsPlaying(false);
          mediaSessionManager.updatePlaybackState('paused');
        }
      } else {
        setIsPlaying(false);
        mediaSessionManager.updatePlaybackState('paused');
      }
    };

    const handleError = () => {
      const active = currentTrackRef.current;
      if (!fallbackTriedRef.current && active?.fallbackSrc && audio.src !== active.fallbackSrc) {
        console.warn('Primary audio stream failed, switching to backup CDN mirror:', active.fallbackSrc);
        fallbackTriedRef.current = true;
        audio.src = active.fallbackSrc;
        audio.load();
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      mediaSessionManager.clear();
    };
  }, [playTrackDirectly]);

  // Preload next upcoming audio tracks in background
  useEffect(() => {
    if (playlist.length > 0 && currentIndex >= 0) {
      const upcomingUrls = playlist
        .slice(currentIndex + 1, currentIndex + 4)
        .map(t => t.src);
      quranAudioService.preloadAudio(upcomingUrls);
    }
  }, [playlist, currentIndex]);

  const setSelectedReciter = useCallback((reciterId: string) => {
    setSelectedReciterState(reciterId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quran_selected_reciter', reciterId);
    }

    const reciterInfo = getReciterById(reciterId);
    const list = playlistRef.current;
    const idx = currentIndexRef.current;

    if (list.length > 0 && idx >= 0) {
      const updatedPlaylist = list.map((track) => {
        if (track.globalAyahNumber && track.surahNumber && track.ayahNumber) {
          const sources = quranAudioService.getAyahAudioSources(
            track.surahNumber,
            track.ayahNumber,
            track.globalAyahNumber,
            reciterId
          );
          return {
            ...track,
            src: sources.primary,
            fallbackSrc: sources.fallback,
            reciterId,
            reciterName: reciterInfo.name,
            subtitle: `Recitation: ${reciterInfo.name}`
          };
        }
        return track;
      });

      setPlaylist(updatedPlaylist);

      const active = updatedPlaylist[idx];
      if (active && audioRef.current) {
        const wasPlaying = isPlaying;
        const currentPos = audioRef.current.currentTime || 0;

        setCurrentTrack(active);
        audioRef.current.src = active.src;
        audioRef.current.currentTime = currentPos;

        if (wasPlaying) {
          audioRef.current.play().catch(() => {});
        }

        mediaSessionManager.updateMetadata({
          title: active.title,
          artist: active.reciterName || reciterInfo.name,
          album: 'Al-Quran Al-Kareem'
        });
      }
    }
  }, [isPlaying]);

  const seekTo = useCallback((seconds: number) => {
    if (audioRef.current && !isNaN(seconds)) {
      audioRef.current.currentTime = seconds;
      setProgress(seconds);
      if (duration > 0) {
        mediaSessionManager.updatePositionState({
          duration,
          playbackRate: audioRef.current.playbackRate,
          position: seconds
        });
      }
    }
  }, [duration]);

  const seekBy = useCallback((deltaSeconds: number) => {
    if (audioRef.current) {
      const targetTime = Math.max(0, Math.min(audioRef.current.currentTime + deltaSeconds, duration || 1000));
      seekTo(targetTime);
    }
  }, [seekTo, duration]);

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        mediaSessionManager.updatePlaybackState('playing');
      } catch (err) {
        console.warn('Play error:', err);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      mediaSessionManager.updatePlaybackState('paused');
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    mediaSessionManager.updatePlaybackState('none');
  }, []);

  const closePlayer = useCallback(() => {
    stop();
    setIsPlayerVisible(false);
    setCurrentTrack(null);
    setPlaylist([]);
    setCurrentIndex(-1);
    window.dispatchEvent(new Event('quran-audio-close'));
  }, [stop]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    setRepeatModeState(mode);
    window.dispatchEvent(
      new CustomEvent('quran-repeat-changed', {
        detail: { repeat: mode === 'one', repeatMode: mode }
      })
    );
  }, []);

  const toggleRepeatMode = useCallback(() => {
    let nextMode: RepeatMode = 'none';
    if (repeatMode === 'none') nextMode = 'one';
    else if (repeatMode === 'one') nextMode = 'surah';
    else nextMode = 'none';

    setRepeatMode(nextMode);
  }, [repeatMode, setRepeatMode]);

  // Setup MediaSession Action Handlers for System / Lock Screen Controls
  useEffect(() => {
    mediaSessionManager.setActionHandlers({
      onPlay: play,
      onPause: pause,
      onPreviousTrack: prevTrack,
      onNextTrack: nextTrack,
      onSeekBackward: (offset) => seekBy(-(offset || 5)),
      onSeekForward: (offset) => seekBy(offset || 5),
      onSeekTo: (seekTime) => seekTo(seekTime),
      onStop: stop
    });
  }, [play, pause, prevTrack, nextTrack, seekBy, seekTo, stop]);

  // Play a single track
  const playSingleTrack = useCallback(
    (trackData: {
      src: string;
      fallbackSrc?: string;
      title: string;
      subtitle: string;
      surahNumber?: number;
      ayahNumber?: number;
      repeat?: boolean;
      reciterId?: string;
      reciterName?: string;
    }) => {
      const mode: RepeatMode = trackData.repeat ? 'one' : 'none';
      setRepeatModeState(mode);

      const reciter = getReciterById(trackData.reciterId || selectedReciter);

      const track: AudioTrack = {
        id: `single-${Date.now()}`,
        src: trackData.src,
        fallbackSrc: trackData.fallbackSrc,
        title: trackData.title,
        subtitle: trackData.subtitle,
        surahNumber: trackData.surahNumber,
        ayahNumber: trackData.ayahNumber,
        reciterId: reciter.id,
        reciterName: trackData.reciterName || reciter.name
      };

      setPlaylist([track]);
      setCurrentIndex(0);
      playTrackDirectly(track);
    },
    [playTrackDirectly, selectedReciter]
  );

  // Play whole Surah Ayahs in sequence with continuous background playback and mirrors
  const playSurahAyahs = useCallback(
    (params: {
      surahNumber: number;
      surahName: string;
      ayahs: Ayah[];
      startIndex?: number;
      reciter?: string;
      repeatAyahOnly?: boolean;
    }) => {
      const activeReciterId = params.reciter || selectedReciter || DEFAULT_RECITER_ID;
      const reciterInfo = getReciterById(activeReciterId);
      const { surahNumber, surahName, ayahs, startIndex = 0, repeatAyahOnly = false } = params;

      const newPlaylist: AudioTrack[] = ayahs.map((ayah) => {
        const sources = quranAudioService.getAyahAudioSources(
          surahNumber,
          ayah.numberInSurah,
          ayah.number,
          activeReciterId
        );

        return {
          id: `surah-${surahNumber}-ayah-${ayah.numberInSurah}`,
          src: sources.primary,
          fallbackSrc: sources.fallback,
          title: `${surahName} • Ayah ${ayah.numberInSurah}`,
          subtitle: `Recitation: ${reciterInfo.name}`,
          surahNumber,
          ayahNumber: ayah.numberInSurah,
          globalAyahNumber: ayah.number,
          reciterId: activeReciterId,
          reciterName: reciterInfo.name,
          arabicText: ayah.text,
          translation: ayah.translation
        };
      });

      const targetIndex = Math.max(0, Math.min(startIndex, newPlaylist.length - 1));
      setPlaylist(newPlaylist);
      setCurrentIndex(targetIndex);

      if (repeatAyahOnly) {
        setRepeatModeState('one');
      } else {
        setRepeatModeState('none');
      }

      if (newPlaylist[targetIndex]) {
        playTrackDirectly(newPlaylist[targetIndex]);
      }
    },
    [playTrackDirectly, selectedReciter]
  );

  // Play full continuous Surah stream MP3
  const playFullSurahStream = useCallback(
    (surahNumber: number, surahName: string, reciterId?: string) => {
      const activeReciterId = reciterId || selectedReciter || DEFAULT_RECITER_ID;
      const reciterInfo = getReciterById(activeReciterId);
      const streamUrl = quranAudioService.getFullSurahStreamUrl(surahNumber, activeReciterId);

      const track: AudioTrack = {
        id: `full-surah-${surahNumber}`,
        src: streamUrl,
        title: `Surah ${surahName} (Full Recitation)`,
        subtitle: `Recitation: ${reciterInfo.name}`,
        surahNumber,
        reciterId: activeReciterId,
        reciterName: reciterInfo.name
      };

      setPlaylist([track]);
      setCurrentIndex(0);
      setRepeatModeState('none');
      playTrackDirectly(track);
    },
    [playTrackDirectly, selectedReciter]
  );

  // Backward compatible playAudio helper
  const playAudio = useCallback(
    (src: string, title: string, subtitle: string) => {
      const isRepeat = src.includes('?repeat=1');
      playSingleTrack({ src, title, subtitle, repeat: isRepeat });
    },
    [playSingleTrack]
  );

  const activeSurahNumber = currentTrack?.surahNumber || null;
  const activeAyahNumber = currentTrack?.ayahNumber || null;

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        playbackSpeed,
        repeatMode,
        playlist,
        currentIndex,
        isPlayerVisible,
        activeSurahNumber,
        activeAyahNumber,
        selectedReciter,
        reciters: QURAN_RECITERS,
        setSelectedReciter,
        playSingleTrack,
        playSurahAyahs,
        playFullSurahStream,
        playAudio,
        play,
        pause,
        togglePlay,
        stop,
        nextTrack,
        prevTrack,
        seekTo,
        seekBy,
        setPlaybackSpeed,
        setRepeatMode,
        toggleRepeatMode,
        closePlayer
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
