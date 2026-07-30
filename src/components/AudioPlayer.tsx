/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Repeat } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  src: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}

export function AudioPlayer({ src, title, subtitle, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const initialRepeat = typeof src === 'string' && src.includes('?repeat=1');
  const [repeat, setRepeat] = useState(initialRepeat);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync repeat state whenever src changes
  useEffect(() => {
    const isRepeatSrc = typeof src === 'string' && src.includes('?repeat=1');
    setRepeat(isRepeatSrc);
  }, [src]);

  // Keep HTML5 audio loop property synced with repeat state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeat;
    }
    // Broadcast repeat change to keep cards in sync
    window.dispatchEvent(new CustomEvent('quran-repeat-changed', { detail: { repeat } }));
  }, [repeat]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value: number | readonly number[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    if (audioRef.current) {
      audioRef.current.currentTime = v;
      setProgress(v);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-20 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl md:bottom-10"
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (repeat && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            setIsPlaying(true);
          } else {
            setIsPlaying(false);
            window.dispatchEvent(new Event('quran-audio-ended'));
          }
        }}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col overflow-hidden">
            <h4 className="truncate text-sm font-bold">{title}</h4>
            <p className="truncate text-xs text-muted-foreground flex items-center gap-1.5">
              <span>{subtitle}</span>
              {repeat && (
                <span className="inline-flex items-center gap-0.5 rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-primary">
                  <Repeat className="h-3 w-3" /> Infinite Loop
                </span>
              )}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-slate-900" 
            onClick={() => {
              if (onClose) onClose();
              window.dispatchEvent(new Event('quran-audio-close'));
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Slider
          value={[progress]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          className="my-1"
        />

        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 5; }}>
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full bg-brand-primary text-white shadow-md hover:bg-brand-primary/90" 
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if (audioRef.current) audioRef.current.currentTime += 5; }}>
            <SkipForward className="h-5 w-5" />
          </Button>
          <Button
            variant={repeat ? "default" : "ghost"}
            size="icon"
            aria-label="Toggle infinite repeat"
            className={repeat ? "bg-brand-primary text-white shadow-sm" : "text-muted-foreground hover:text-brand-primary"}
            onClick={() => setRepeat(prev => !prev)}
            title={repeat ? "Infinite repeat enabled (Click to disable)" : "Enable infinite repeat loop"}
          >
            <Repeat className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
