/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Volume2, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  // If src contains ?repeat=1, enable repeat by default
  const initialRepeat = typeof src === 'string' && src.includes('?repeat=1');
  const [repeat, setRepeat] = useState(initialRepeat);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
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
      className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 overflow-hidden rounded-2xl border bg-white/90 p-4 shadow-2xl backdrop-blur-xl md:bottom-10"
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
            // Dispatch global event for SurahView to listen for sequential playback
            window.dispatchEvent(new Event('quran-audio-ended'));
          }
        }}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col overflow-hidden">
            <h4 className="truncate text-sm font-bold">{title}</h4>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            if (onClose) onClose();
            // Dispatch global event to stop sequential mode
            window.dispatchEvent(new Event('quran-audio-close'));
          }}>
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
            className="h-12 w-12 rounded-full bg-brand-primary hover:bg-brand-primary/90" 
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
            aria-label="Repeat infinitely"
            className={repeat ? "bg-brand-primary text-white" : ""}
            onClick={() => setRepeat(r => !r)}
            title="Repeat infinitely"
          >
            <Repeat className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
