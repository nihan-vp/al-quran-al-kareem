/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useMemorizationPlayback } from '../hooks/useMemorizationPlayback';
import { quranService } from '../services/quranService';
import { Surah, Ayah, MemorizationPlan, PlaybackSettings } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Target, 
  Plus, 
  Play, 
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Trash2, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  Volume2,
  Settings2,
  ExternalLink,
  Repeat,
  Info
} from 'lucide-react';

interface PlanPlayerProps {
  plan: MemorizationPlan;
  onClose: () => void;
}

function PlanPlayerModal({ plan, onClose }: PlanPlayerProps) {
  const navigate = useNavigate();
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [repeatCount, setRepeatCount] = useState<number>(plan.repeatCount || 3);
  const [playMeaning, setPlayMeaning] = useState<boolean>(plan.playMeaning ?? true);
  const [settings, setSettings] = useState<PlaybackSettings>(plan.settings || {
    delayBetweenAyahs: 1,
    delayBetweenCycles: 3,
    playbackSpeed: 1,
    reciter: 'ar.alafasy'
  });

  useEffect(() => {
    setLoading(true);
    quranService.getAyahsRange(plan.surahNumber, plan.startAyah, plan.endAyah)
      .then(data => {
        setAyahs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading ayahs for plan player:", err);
        setLoading(false);
      });
  }, [plan]);

  const playback = useMemorizationPlayback(ayahs, repeatCount, playMeaning, settings);
  const activeAyah = ayahs[playback.currentAyahIndex];

  return (
    <Dialog open={true} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Volume2 className="h-6 w-6 text-brand-primary" />
                {plan.title}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-brand-primary mt-1">
                Surah {plan.surahName} • Ayahs {plan.startAyah} to {plan.endAyah}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-1 text-xs"
              onClick={() => {
                onClose();
                navigate(`/memorize?surah=${plan.surahNumber}&start=${plan.startAyah}&end=${plan.endAyah}&repeat=${repeatCount}`);
              }}
            >
              Open Full Screen <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading audio and Quran text...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Active Ayah Display */}
            {activeAyah && (
              <Card className="border-2 border-brand-primary/20 bg-emerald-500/5 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-brand-primary text-white">
                    Ayah {activeAyah.numberInSurah}
                  </Badge>
                  <div className="text-xs font-semibold text-brand-primary flex items-center gap-1">
                    <Repeat className="h-3.5 w-3.5" /> Repeat {playback.currentRepeat} of {repeatCount >= 999 ? '♾️' : repeatCount}
                  </div>
                </div>

                <p className="quran-font text-3xl md:text-4xl text-right leading-loose tracking-wide py-2">
                  {activeAyah.text}
                </p>

                {playMeaning && activeAyah.malayalamTranslation && (
                  <p className="text-sm text-slate-700 font-medium border-t pt-3 border-emerald-500/20">
                    {activeAyah.malayalamTranslation}
                  </p>
                )}
              </Card>
            )}

            {/* Playback Controls */}
            <Card className="border-none bg-slate-50 p-4 rounded-2xl space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={playback.prev} disabled={playback.currentAyahIndex === 0}>
                  <SkipBack className="h-5 w-5" />
                </Button>

                {playback.isPlaying ? (
                  <Button size="icon" className="h-14 w-14 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg" onClick={playback.pause}>
                    <Pause className="h-6 w-6" />
                  </Button>
                ) : (
                  <Button size="icon" className="h-14 w-14 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg" onClick={playback.start}>
                    <Play className="h-6 w-6 fill-current ml-0.5" />
                  </Button>
                )}

                <Button variant="outline" size="icon" onClick={playback.stop}>
                  <Square className="h-5 w-5" />
                </Button>

                <Button variant="outline" size="icon" onClick={playback.next} disabled={playback.currentAyahIndex >= ayahs.length - 1}>
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Ayah {playback.currentAyahIndex + 1} of {ayahs.length}</span>
                  <span>{Math.round((playback.currentAyahIndex + 1) / ayahs.length * 100)}%</span>
                </div>
                <Progress value={((playback.currentAyahIndex + 1) / ayahs.length) * 100} className="h-2" />
              </div>
            </Card>

            {/* Quick Audio Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Repeat Count</Label>
                <Select value={repeatCount.toString()} onValueChange={v => setRepeatCount(Number(v))}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Time</SelectItem>
                    <SelectItem value="3">3 Times</SelectItem>
                    <SelectItem value="5">5 Times</SelectItem>
                    <SelectItem value="10">10 Times</SelectItem>
                    <SelectItem value="999">♾️ Infinite Loop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border p-3 rounded-xl bg-white">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Malayalam Meaning</Label>
                  <p className="text-[11px] text-muted-foreground">Play translation after recitation</p>
                </div>
                <Switch checked={playMeaning} onCheckedChange={setPlayMeaning} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PlansPage() {
  const { user } = useAuth();
  const { plans, addPlan, removePlan } = useFirestore(user?.uid);
  const navigate = useNavigate();

  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activePlayingPlan, setActivePlayingPlan] = useState<MemorizationPlan | null>(null);

  // Form State
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(7);
  const [repeatCount, setRepeatCount] = useState<number>(3);
  const [playMeaning, setPlayMeaning] = useState<boolean>(true);
  const [planTitle, setPlanTitle] = useState<string>('');

  useEffect(() => {
    quranService.getSurahs().then(data => {
      setSurahs(data);
    });
  }, []);

  const currentSurah = surahs.find(s => s.number === selectedSurah);

  useEffect(() => {
    if (currentSurah) {
      setStartAyah(1);
      setEndAyah(currentSurah.numberOfAyahs);
      setPlanTitle(`${currentSurah.englishName} (1-${currentSurah.numberOfAyahs})`);
    }
  }, [selectedSurah, currentSurah]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!currentSurah) return;

    await addPlan({
      title: planTitle || `${currentSurah.englishName} (${startAyah}-${endAyah})`,
      surahNumber: selectedSurah,
      surahName: currentSurah.englishName,
      startAyah,
      endAyah,
      repeatCount,
      playMeaning,
      settings: {
        delayBetweenAyahs: 1,
        delayBetweenCycles: 3,
        playbackSpeed: 1,
        reciter: 'ar.alafasy'
      }
    });

    setShowCreateForm(false);
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-primary/10 text-brand-primary shadow-sm">
          <Target className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Memorization Plans</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Save custom memorization plans with your preferred repeat counts and listen to reciter audio.
          </p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary/90 px-8 py-6 text-base rounded-xl shadow-lg" onClick={() => navigate('/login')}>
          Sign In to Create Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-emerald-800 to-teal-900 p-8 text-white shadow-xl md:p-10">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-lg">
            <Badge variant="outline" className="border-white/20 text-white/90 bg-white/10 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-300" /> Saved Memorization Presets
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Memorization Plans</h1>
            <p className="text-white/80 text-sm md:text-base">
              Save your favorite Quran ranges, configure repeat counts, and practice with reciter audio anytime.
            </p>
          </div>
          <Button 
            className="bg-white text-slate-900 hover:bg-white/90 font-bold px-6 py-6 rounded-2xl shadow-lg flex items-center gap-2"
            onClick={() => setShowCreateForm(prev => !prev)}
          >
            <Plus className="h-5 w-5 text-brand-primary" />
            {showCreateForm ? "Cancel Creator" : "New Plan"}
          </Button>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute left-1/2 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Form Creator */}
      {showCreateForm && (
        <Card className="border-2 border-brand-primary/20 bg-white shadow-xl rounded-3xl overflow-hidden animate-in fade-in duration-300">
          <CardHeader className="bg-brand-primary/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="h-5 w-5 text-brand-primary" /> Save Memorization Plan
            </CardTitle>
            <CardDescription>Select Surah, range, repeat count, and translation options.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreatePlan} className="space-y-6">
              <div className="space-y-2">
                <Label>Plan Title</Label>
                <Input 
                  value={planTitle} 
                  onChange={e => setPlanTitle(e.target.value)} 
                  placeholder="e.g. Surah Al-Mulk (1-10)"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Surah</Label>
                  <Select value={selectedSurah.toString()} onValueChange={v => setSelectedSurah(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {surahs.map(s => (
                        <SelectItem key={s.number} value={s.number.toString()}>
                          {s.number}. {s.englishName} ({s.numberOfAyahs} Ayahs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Ayah</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={currentSurah?.numberOfAyahs || 1} 
                    value={startAyah} 
                    onChange={e => setStartAyah(Number(e.target.value))} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Ayah</Label>
                  <Input 
                    type="number" 
                    min={startAyah} 
                    max={currentSurah?.numberOfAyahs || 1} 
                    value={endAyah} 
                    onChange={e => setEndAyah(Number(e.target.value))} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label>Repeat Count</Label>
                  <Select value={repeatCount.toString()} onValueChange={v => setRepeatCount(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Time</SelectItem>
                      <SelectItem value="3">3 Times</SelectItem>
                      <SelectItem value="5">5 Times</SelectItem>
                      <SelectItem value="10">10 Times</SelectItem>
                      <SelectItem value="999">♾️ Infinite Loop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between border p-3.5 rounded-xl bg-slate-50">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Malayalam Meaning</Label>
                    <p className="text-[11px] text-muted-foreground">Play translation audio</p>
                  </div>
                  <Switch checked={playMeaning} onCheckedChange={setPlayMeaning} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90 font-bold">
                  Save Plan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Memorization Audio Player Modal */}
      {activePlayingPlan && (
        <PlanPlayerModal 
          plan={activePlayingPlan} 
          onClose={() => setActivePlayingPlan(null)}
        />
      )}

      {/* Plans List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-brand-primary" /> Your Saved Plans ({plans.length})
        </h2>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed rounded-3xl bg-white/50">
            <Target className="h-14 w-14 text-muted-foreground/30" />
            <div>
              <h3 className="text-lg font-bold">No saved plans yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create custom memorization plans to quickly listen to and practice your favorite Quran ranges.
              </p>
            </div>
            <Button className="bg-brand-primary hover:bg-brand-primary/90 mt-2" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create First Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => {
              const totalAyahs = Math.max(1, plan.endAyah - plan.startAyah + 1);

              return (
                <Card key={plan.id} className="border-none bg-white shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                        <CardDescription className="text-xs font-medium text-brand-primary mt-1">
                          Surah {plan.surahName} • Ayahs {plan.startAyah} - {plan.endAyah} ({totalAyahs} Ayahs)
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="border-brand-primary/30 bg-brand-primary/10 text-brand-primary">
                        {plan.repeatCount >= 999 ? '♾️ Loop' : `${plan.repeatCount}x Repeat`}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-4">
                    {/* Primary Audio Play Button */}
                    <Button 
                      className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-5 rounded-xl shadow-md flex items-center justify-center gap-2"
                      onClick={() => setActivePlayingPlan(plan)}
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Play Plan Audio
                    </Button>

                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-brand-primary p-0 h-auto font-semibold hover:bg-transparent hover:underline flex items-center gap-1"
                        onClick={() => navigate(`/memorize?surah=${plan.surahNumber}&start=${plan.startAyah}&end=${plan.endAyah}&repeat=${plan.repeatCount}`)}
                      >
                        Open in Memorize Workspace <ChevronRight className="h-3.5 w-3.5" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => removePlan(plan.id)}
                        title="Delete Plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
