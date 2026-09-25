/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { mediaSessionManager } from '../services/mediaSession';
import { workerTimer } from '../utils/workerTimer';
import { Ayah } from '../types';

export type RepeatMode = 'none' | 'one' | 'surah';

export interface AudioTrack {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  surahNumber?: number;
  ayahNumber?: number;
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

  // Actions
  playSingleTrack: (track: {
    src: string;
    title: string;
    subtitle: string;
    surahNumber?: number;
    ayahNumber?: number;
    repeat?: boolean;
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
  const nextTrackTimerRef = useRef<number | null>(null);

  // Initialize persistent audio element
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

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
      audio.src = '';
      mediaSessionManager.clear();
      if (nextTrackTimerRef.current) workerTimer.clearTimeout(nextTrackTimerRef.current);
    };
  }, []);

  const playTrackDirectly = useCallback((track: AudioTrack) => {
    if (!audioRef.current) return;
    if (nextTrackTimerRef.current) {
      workerTimer.clearTimeout(nextTrackTimerRef.current);
      nextTrackTimerRef.current = null;
    }

    setCurrentTrack(track);
    setIsPlayerVisible(true);
    setProgress(0);

    const audio = audioRef.current;
    audio.src = track.src;
    audio.playbackRate = playbackSpeed;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        mediaSessionManager.updatePlaybackState('playing');
      })
      .catch((err) => {
        console.warn('Audio play request interrupted or prevented:', err);
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
  }, [playbackSpeed]);

  const nextTrack = useCallback(() => {
    if (playlist.length > 0 && currentIndex >= 0) {
      if (currentIndex < playlist.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        playTrackDirectly(playlist[nextIdx]);
      } else if (repeatMode === 'surah') {
        setCurrentIndex(0);
        playTrackDirectly(playlist[0]);
      } else {
        setIsPlaying(false);
        mediaSessionManager.updatePlaybackState('paused');
      }
    }
  }, [playlist, currentIndex, repeatMode, playTrackDirectly]);

  const prevTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      // Seek to beginning if more than 3 seconds in
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    if (playlist.length > 0 && currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      playTrackDirectly(playlist[prevIdx]);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    }
  }, [playlist, currentIndex, playTrackDirectly]);

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

  // Handle Track Ended Event with Background Worker Timer support
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      window.dispatchEvent(new Event('quran-audio-ended'));

      if (repeatMode === 'one') {
        // Infinite repeat of current track
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (playlist.length > 0 && currentIndex >= 0) {
        if (currentIndex < playlist.length - 1) {
          // Play next track seamlessly in background
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          playTrackDirectly(playlist[nextIdx]);
        } else if (repeatMode === 'surah') {
          // Loop whole surah from beginning
          setCurrentIndex(0);
          playTrackDirectly(playlist[0]);
        } else {
          setIsPlaying(false);
          mediaSessionManager.updatePlaybackState('paused');
        }
      } else {
        setIsPlaying(false);
        mediaSessionManager.updatePlaybackState('paused');
      }
    };

    audio.onended = handleEnded;
    return () => {
      audio.onended = null;
    };
  }, [repeatMode, playlist, currentIndex, playTrackDirectly]);

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

  // Play a single track (e.g. from AudioPlayer modal, specific ayah, or external URL)
  const playSingleTrack = useCallback(
    (trackData: {
      src: string;
      title: string;
      subtitle: string;
      surahNumber?: number;
      ayahNumber?: number;
      repeat?: boolean;
      reciterName?: string;
    }) => {
      const mode: RepeatMode = trackData.repeat ? 'one' : 'none';
      setRepeatModeState(mode);

      const track: AudioTrack = {
        id: `single-${Date.now()}`,
        src: trackData.src,
        title: trackData.title,
        subtitle: trackData.subtitle,
        surahNumber: trackData.surahNumber,
        ayahNumber: trackData.ayahNumber,
        reciterName: trackData.reciterName || 'Mishary Rashid Alafasy'
      };

      setPlaylist([track]);
      setCurrentIndex(0);
      playTrackDirectly(track);
    },
    [playTrackDirectly]
  );

  // Play whole Surah Ayahs in sequence with continuous background playback
  const playSurahAyahs = useCallback(
    (params: {
      surahNumber: number;
      surahName: string;
      ayahs: Ayah[];
      startIndex?: number;
      reciter?: string;
      repeatAyahOnly?: boolean;
    }) => {
      const { surahNumber, surahName, ayahs, startIndex = 0, reciter = 'ar.alafasy', repeatAyahOnly = false } = params;

      const newPlaylist: AudioTrack[] = ayahs.map((ayah) => ({
        id: `surah-${surahNumber}-ayah-${ayah.numberInSurah}`,
        src: `https://cdn.islamic.network/quran/audio/128/${reciter}/${ayah.number}.mp3`,
        title: `${surahName} • Ayah ${ayah.numberInSurah}`,
        subtitle: `Recitation: Mishary Rashid Alafasy`,
        surahNumber,
        ayahNumber: ayah.numberInSurah,
        reciterName: 'Mishary Rashid Alafasy',
        arabicText: ayah.text,
        translation: ayah.translation
      }));

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
    [playTrackDirectly]
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
        playSingleTrack,
        playSurahAyahs,
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
