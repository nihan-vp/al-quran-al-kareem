/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Settings2, 
  Save, 
  History,
  ChevronRight,
  Volume2,
  BookOpen,
  Info
} from 'lucide-react';

import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { quranService } from '@/services/quranService';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { useMemorizationPlayback } from '@/hooks/useMemorizationPlayback';
import { Surah, Ayah, PlaybackSettings } from '@/types';

export function MemorizationView() {
  const { user } = useAuth();
  const { presets, addPreset, removePreset } = useFirestore(user?.uid);
  
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(7);
  const [repeatCount, setRepeatCount] = useState<number>(3);
  const [playMeaning, setPlayMeaning] = useState<boolean>(true);
  
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState<PlaybackSettings>({
    delayBetweenAyahs: 1,
    delayBetweenCycles: 3,
    playbackSpeed: 1,
    reciter: 'ar.alafasy'
  });

  const playback = useMemorizationPlayback(ayahs, repeatCount, playMeaning, settings);

  useEffect(() => {
    quranService.getSurahs().then(setSurahs);
  }, []);

  const currentSurah = surahs.find(s => s.number === selectedSurah);

  const handleLoadRange = async () => {
    setLoading(true);
    try {
      const data = await quranService.getAyahsRange(selectedSurah, startAyah, endAyah);
      setAyahs(data);
    } catch (error) {
      console.error("Error loading range:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreset = () => {
    if (!user) return;
    const title = `${currentSurah?.englishName} (${startAyah}-${endAyah})`;
    addPreset({
      title,
      surahNumber: selectedSurah,
      startAyah,
      endAyah,
      repeatCount,
      playMeaning,
      settings,
      timestamp: Date.now(),
      uid: user.uid
    });
  };

  const loadPreset = (preset: any) => {
    setSelectedSurah(preset.surahNumber);
    setStartAyah(preset.startAyah);
    setEndAyah(preset.endAyah);
    setRepeatCount(preset.repeatCount);
    setPlayMeaning(preset.playMeaning);
    setSettings(preset.settings);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Configuration Panel */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="border-none bg-white/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-brand-primary" />
              Configuration
            </CardTitle>
            <CardDescription>Select range and playback options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Surah</Label>
              <Select value={selectedSurah.toString()} onValueChange={(v) => setSelectedSurah(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Surah" />
                </SelectTrigger>
                <SelectContent>
                  {surahs.map(s => (
                    <SelectItem key={s.number} value={s.number.toString()}>
                      {s.number}. {s.englishName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Ayah</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={currentSurah?.numberOfAyahs || 1} 
                  value={startAyah} 
                  onChange={(e) => setStartAyah(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Ayah</Label>
                <Input 
                  type="number" 
                  min={startAyah} 
                  max={currentSurah?.numberOfAyahs || 1} 
                  value={endAyah} 
                  onChange={(e) => setEndAyah(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Repeat Count</Label>
              <Select value={repeatCount.toString()} onValueChange={(v) => setRepeatCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Time</SelectItem>
                  <SelectItem value="3">3 Times</SelectItem>
                  <SelectItem value="5">5 Times</SelectItem>
                  <SelectItem value="10">10 Times</SelectItem>
                  <SelectItem value="20">20 Times</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Malayalam Meaning</Label>
                <p className="text-xs text-muted-foreground">Play meaning after recitation</p>
              </div>
              <Switch checked={playMeaning} onCheckedChange={setPlayMeaning} />
            </div>

            <Button className="w-full bg-brand-primary hover:bg-brand-primary/90" onClick={handleLoadRange} disabled={loading}>
              {loading ? "Loading..." : "Load Range"}
            </Button>

            {user && (
              <Button variant="outline" className="w-full" onClick={handleSavePreset}>
                <Save className="mr-2 h-4 w-4" />
                Save as Preset
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Presets */}
        {presets.length > 0 && (
          <Card className="border-none bg-white/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Your Presets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-48">
                <div className="p-4 space-y-2">
                  {presets.map(p => (
                    <div key={p.id} className="flex items-center justify-between group">
                      <button 
                        className="text-sm text-left hover:text-brand-primary flex-1"
                        onClick={() => loadPreset(p)}
                      >
                        {p.title}
                      </button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => removePreset(p.id)}>
                        <Square className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Playback Panel */}
      <div className="lg:col-span-8 space-y-6">
        {ayahs.length > 0 ? (
          <>
            <Card className="border-none bg-brand-primary text-white shadow-xl overflow-hidden relative">
              <CardContent className="p-8 md:p-12 text-center space-y-6 relative z-10">
                <div className="flex justify-center gap-2">
                  <Badge variant="outline" className="border-white/20 text-white/80">
                    Cycle {playback.currentRepeat} of {repeatCount}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-white/80">
                    {playback.isArabicPlaying ? "Arabic Recitation" : "Malayalam Meaning"}
                  </Badge>
                </div>
                
                <h2 className="text-3xl font-bold">{currentSurah?.englishName}</h2>
                <p className="text-white/60">Ayah {ayahs[playback.currentAyahIndex]?.numberInSurah} of {endAyah}</p>
                
                <div className="py-8 min-h-40 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${playback.currentAyahIndex}-${playback.isArabicPlaying}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {playback.isArabicPlaying ? (
                        <p className="quran-font text-4xl md:text-5xl leading-relaxed">
                          {ayahs[playback.currentAyahIndex]?.text}
                        </p>
                      ) : (
                        <p className="text-xl md:text-2xl font-medium leading-relaxed italic">
                          {ayahs[playback.currentAyahIndex]?.malayalamTranslation}
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="space-y-4">
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white"
                      animate={{ width: `${playback.progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-center gap-6">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={playback.prev}>
                      <SkipBack className="h-6 w-6" />
                    </Button>
                    
                    {playback.isPlaying ? (
                      <Button 
                        size="icon" 
                        className="h-16 w-16 rounded-full bg-white text-brand-primary hover:bg-white/90"
                        onClick={playback.pause}
                      >
                        <Pause className="h-8 w-8" />
                      </Button>
                    ) : (
                      <Button 
                        size="icon" 
                        className="h-16 w-16 rounded-full bg-white text-brand-primary hover:bg-white/90"
                        onClick={playback.start}
                      >
                        <Play className="h-8 w-8 fill-current" />
                      </Button>
                    )}

                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={playback.next}>
                      <SkipForward className="h-6 w-6" />
                    </Button>
                    
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={playback.stop}>
                      <Square className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              {/* Decorative elements */}
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            </Card>

            <ScrollArea className="h-100 rounded-2xl border bg-white/50 p-4">
              <div className="space-y-4">
                {ayahs.map((ayah, idx) => (
                  <div 
                    key={ayah.number}
                    className={`p-4 rounded-xl transition-all ${
                      playback.currentAyahIndex === idx 
                      ? "bg-brand-primary/10 border-l-4 border-brand-primary" 
                      : "bg-white/30"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <Badge variant="outline" className="shrink-0">{ayah.numberInSurah}</Badge>
                      <p className="quran-font text-2xl text-right leading-relaxed flex-1">{ayah.text}</p>
                      {/* Malayalam audio button (controls hidden during playback) */}
                      <div style={{ position: 'relative', minWidth: 120 }}>
                        <audio
                          controls={!playback.isPlaying}
                          style={{ minWidth: 120, opacity: playback.isPlaying ? 0.5 : 1 }}
                          title={playback.isPlaying ? "Disabled during main playback" : "Malayalam audio"}
                        >
                          <source
                            src={`https://lalithasaram.net/audio/qtaud/transl/${String(ayah.surahNumber || selectedSurah).padStart(3, '0')}_${String(ayah.numberInSurah).padStart(3, '0')}.ogg`}
                            type="audio/ogg"
                          />
                          Your browser does not support the audio element.
                        </audio>
                        {playback.isPlaying && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(255,255,255,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            color: '#333',
                            pointerEvents: 'none',
                            borderRadius: 8
                          }}>
                            Disabled during playback
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground italic">{ayah.malayalamTranslation}</p>
                    {idx === 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: Main playback (above) will play Arabic then Malayalam in order. Manual Malayalam audio is disabled during playback to prevent overlap.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-100 text-center space-y-4 border-2 border-dashed rounded-3xl opacity-50">
            <BookOpen className="h-16 w-16 text-brand-primary" />
            <div>
              <h3 className="text-xl font-bold">No Range Loaded</h3>
              <p className="text-sm text-muted-foreground">Configure your memorization session on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
