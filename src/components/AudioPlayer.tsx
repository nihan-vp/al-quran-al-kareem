/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  Repeat, 
  Repeat1, 
  RotateCcw, 
  RotateCw,
  Gauge,
  Headphones,
  ChevronDown,
  Check,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAudio } from '@/contexts/AudioContext';
import { getReciterById } from '@/constants/reciters';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    playbackSpeed,
    repeatMode,
    selectedReciter,
    reciters,
    setSelectedReciter,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    seekBy,
    setPlaybackSpeed,
    toggleRepeatMode,
    closePlayer,
    isPlayerVisible
  } = useAudio();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showReciterMenu, setShowReciterMenu] = useState(false);

  const speedMenuRef = useRef<HTMLDivElement | null>(null);
  const reciterMenuRef = useRef<HTMLDivElement | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
      if (reciterMenuRef.current && !reciterMenuRef.current.contains(event.target as Node)) {
        setShowReciterMenu(false);
      }
    };

    if (showSpeedMenu || showReciterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpeedMenu, showReciterMenu]);

  if (!isPlayerVisible || !currentTrack) {
    return null;
  }

  const currentReciterInfo = getReciterById(selectedReciter);

  const speedOptions = [
    { label: '0.75x', value: 0.75 },
    { label: '1.0x (Normal)', value: 1.0 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2.0x', value: 2.0 },
  ];

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 80, opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-20 left-1/2 z-50 w-[94%] max-w-xl -translate-x-1/2 rounded-3xl border border-emerald-500/20 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl dark:border-emerald-500/20 dark:bg-slate-900/95 md:bottom-8"
    >
      <div className="flex flex-col gap-3">
        {/* Track Title & Background Status Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <Headphones className={`h-5 w-5 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>

            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h4 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                  {currentTrack.title}
                </h4>
                {/* Background playing active badge */}
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex items-center gap-1 border-emerald-300 bg-emerald-50 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Background Active
                </Badge>
              </div>

              <p className="truncate text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{currentReciterInfo.name}</span>
                {repeatMode === 'one' && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">
                    <Repeat1 className="h-3 w-3" /> Ayah Loop
                  </span>
                )}
                {repeatMode === 'surah' && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">
                    <Repeat className="h-3 w-3" /> Surah Loop
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Reciter Selector Dropdown */}
            <div className="relative" ref={reciterMenuRef}>
              <button
                type="button"
                className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/90 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all hover:border-brand-primary/40 hover:bg-slate-200/80 hover:text-brand-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95 cursor-pointer max-w-[130px] sm:max-w-[160px] truncate"
                onClick={() => {
                  setShowReciterMenu(prev => !prev);
                  setShowSpeedMenu(false);
                }}
                title={`Reciter: ${currentReciterInfo.name}`}
              >
                <User className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                <span className="truncate">{currentReciterInfo.name.split(' ')[0]}</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 shrink-0 transition-transform duration-200 ${showReciterMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showReciterMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 bottom-full mb-2 z-50 flex w-64 max-h-72 overflow-y-auto flex-col gap-1 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      Choose Reciter
                    </div>
                    {reciters.map(r => {
                      const isSelected = selectedReciter === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setSelectedReciter(r.id);
                            setShowReciterMenu(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-brand-primary text-white font-bold shadow-sm'
                              : 'hover:bg-slate-100 text-slate-700 hover:text-brand-primary dark:text-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex flex-col overflow-hidden pr-2">
                            <span className="font-semibold truncate">{r.name}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                              {r.arabicName} • {r.style}
                            </span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Speed Control Dropdown */}
            <div className="relative" ref={speedMenuRef}>
              <button
                type="button"
                className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/90 px-2 py-1 text-xs font-semibold text-slate-700 transition-all hover:border-brand-primary/40 hover:bg-slate-200/80 hover:text-brand-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95 cursor-pointer"
                onClick={() => {
                  setShowSpeedMenu(prev => !prev);
                  setShowReciterMenu(false);
                }}
                title="Select Playback Speed"
              >
                <Gauge className="h-3.5 w-3.5 text-brand-primary" />
                <span>{playbackSpeed}x</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${showSpeedMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 bottom-full mb-2 z-50 flex w-36 flex-col gap-1 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Playback Speed
                    </div>
                    {speedOptions.map(opt => {
                      const isSelected = playbackSpeed === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setPlaybackSpeed(opt.value);
                            setShowSpeedMenu(false);
                          }}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-brand-primary text-white font-bold shadow-sm'
                              : 'hover:bg-slate-100 text-slate-700 hover:text-brand-primary dark:text-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-slate-900 rounded-xl"
              onClick={closePlayer}
              title="Close Player"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Slider & Timestamps */}
        <div className="space-y-1">
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            onValueChange={(val) => {
              const v = Array.isArray(val) ? val[0] : val;
              seekTo(v);
            }}
            className="my-1 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-semibold text-slate-400">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Repeat Mode Cycle */}
          <Button
            variant={repeatMode !== 'none' ? 'default' : 'ghost'}
            size="icon"
            className={`h-9 w-9 rounded-xl ${
              repeatMode !== 'none'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-brand-primary'
            }`}
            onClick={toggleRepeatMode}
            title={
              repeatMode === 'none'
                ? 'Repeat: Off (Click for Ayah loop)'
                : repeatMode === 'one'
                ? 'Repeat: Current Ayah (Click for Surah loop)'
                : 'Repeat: Entire Surah (Click to turn off)'
            }
          >
            {repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-2">
            {/* Previous Ayah / Track */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-700 hover:text-brand-primary rounded-xl"
              onClick={prevTrack}
              title="Previous Ayah"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Seek -5s */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-xl"
              onClick={() => seekBy(-5)}
              title="Seek back 5 seconds"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {/* Main Play / Pause Button */}
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 transition-transform active:scale-95"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </Button>

            {/* Seek +5s */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-900 rounded-xl"
              onClick={() => seekBy(5)}
              title="Seek forward 5 seconds"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>

            {/* Next Ayah / Track */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-700 hover:text-brand-primary rounded-xl"
              onClick={nextTrack}
              title="Next Ayah"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-9" />
        </div>
      </div>
    </motion.div>
  );
}
