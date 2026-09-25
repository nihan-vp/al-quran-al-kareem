/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Book,
  Search,
  Bookmark as BookmarkIcon,
  History,
  Settings,
  User as UserIcon,
  LogOut,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Volume2,
  BrainCircuit,
  Repeat,
  Repeat1,
  Target,
  Sparkles,
  Headphones
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import { quranService } from './services/quranService';
import { Surah, Ayah, SurahDetail } from './types';
import { useAuth } from './hooks/useAuth';
import { useFirestore } from './hooks/useFirestore';
import { logout } from './firebase';
import { AuthForm } from './components/AuthForm';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import PlansPage from './pages/PlansPage';
import { AudioPlayer } from './components/AudioPlayer';
import { MemorizationView } from './components/MemorizationView';
import { BottomNav } from './components/BottomNav';
import ProfilePage from './pages/ProfilePage';
import { AudioProvider, useAudio } from './contexts/AudioContext';

// --- Components ---

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Memorize', path: '/memorize', icon: BrainCircuit },
    { label: 'Plans', path: '/plans', icon: Target },
    { label: 'Bookmarks', path: '/bookmarks', icon: BookmarkIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-brand-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm">
            <Book className="h-5 w-5" />
          </div>
          <span className="tracking-tight">Al-Quran Al-Kareem</span>
        </Link>

        {/* Desktop Header Links */}
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map(link => {
            const isActive = link.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(link.path);
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl transition-all ${
                  isActive 
                    ? "bg-brand-primary/10 text-brand-primary font-bold shadow-xs" 
                    : "text-slate-600 hover:text-brand-primary hover:bg-slate-100/80"
                }`}
              >
                {Icon && <Icon className={`h-4 w-4 ${isActive ? 'text-brand-primary' : ''}`} />}
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="ml-2 pl-2 border-l border-slate-200">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  to="/profile" 
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                    location.pathname === '/profile' 
                      ? 'bg-brand-primary text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </Link>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-red-600" onClick={logout}>
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button size="sm" className="bg-brand-primary hover:bg-brand-primary/90 rounded-xl font-bold" onClick={() => navigate('/login')}>
                <UserIcon className="mr-1.5 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Header Profile Indicator */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white font-bold text-xs shadow-sm">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </Link>
          ) : (
            <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs font-semibold" onClick={() => navigate('/login')}>
              <UserIcon className="h-3.5 w-3.5 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

const SurahList = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { lastRead } = useFirestore(user?.uid);

  useEffect(() => {
    quranService.getSurahs().then(data => {
      setSurahs(data);
      setLoading(false);
    });
  }, []);

  const filteredSurahs = surahs.filter(s =>
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.includes(searchQuery) ||
    s.number.toString() === searchQuery
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Home Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-emerald-800 to-teal-900 p-8 text-white shadow-xl md:p-10">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <Badge variant="outline" className="border-white/20 text-white/90 bg-white/10 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-300" /> The Holy Quran
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Al-Quran Al-Kareem
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            Read, listen to beautiful recitations with background audio, and memorize the Noble Quran with smart tools.
          </p>

          <div className="relative pt-2 max-w-md">
            <Search className="absolute left-3.5 top-[calc(50%+4px)] h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search Surah by name or number..."
              className="pl-10 h-12 rounded-2xl border-none bg-white text-slate-900 shadow-lg placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3.5 top-[calc(50%+4px)] -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Decorative background motifs */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-2/3 -top-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      </div>

      {lastRead && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={`/surah/${lastRead.surahNumber}?ayah=${lastRead.ayahNumber}`}>
            <Card className="border border-brand-primary/20 bg-emerald-500/5 shadow-sm transition-all hover:bg-emerald-500/10 hover:shadow-md rounded-2xl">
              <CardContent className="flex items-center justify-between p-5 md:p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-brand-primary p-3 text-white shadow-sm">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-wider">Continue Reading</p>
                    <h3 className="text-lg font-bold text-slate-900">{lastRead.surahName}</h3>
                    <p className="text-xs font-medium text-slate-500">Ayah {lastRead.ayahNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-brand-primary">
                  <span>Resume</span>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSurahs.map((surah) => (
          <Link key={surah.number} to={`/surah/${surah.number}`}>
            <motion.div
              whileHover={{ y: -3 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 transition-all hover:shadow-lg hover:border-brand-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary font-bold text-sm">
                    {surah.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors">{surah.englishName}</h3>
                    <p className="text-xs text-slate-500">{surah.englishNameTranslation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="quran-font text-2xl text-slate-800">{surah.name}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">{surah.numberOfAyahs} Ayahs</p>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const SurahView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { bookmarks, addBookmark, removeBookmark, updateLastRead } = useFirestore(user?.uid);
  
  const {
    playSurahAyahs,
    isPlaying,
    activeSurahNumber,
    activeAyahNumber,
    repeatMode,
    togglePlay,
    setRepeatMode
  } = useAudio();

  const ayahRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const targetAyahParam = searchParams.get('ayah');
  const targetAyahNumber = targetAyahParam ? parseInt(targetAyahParam, 10) : null;

  useEffect(() => {
    if (targetAyahNumber) {
      setHighlightedAyah(targetAyahNumber);
      const timer = setTimeout(() => {
        setHighlightedAyah(null);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setHighlightedAyah(null);
    }
  }, [targetAyahNumber, location.search]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      quranService.getSurahWithTranslation(Number(id)).then(data => {
        setSurah(data);
        setLoading(false);
        if (user) {
          const currentParams = new URLSearchParams(window.location.search);
          const paramAyah = currentParams.get('ayah');
          if (paramAyah) {
            updateLastRead({
              surahNumber: data.number,
              ayahNumber: parseInt(paramAyah, 10),
              surahName: data.englishName
            });
          }
        }
      });
    }
  }, [id, user]);

  // Scroll to target ayah on load
  useEffect(() => {
    if (!loading && surah && targetAyahNumber) {
      const idx = surah.ayahs.findIndex(a => a.numberInSurah === targetAyahNumber);
      if (idx !== -1) {
        const timer = setTimeout(() => {
          ayahRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, surah, targetAyahNumber]);

  // Smooth scroll to actively playing ayah during background/foreground playback
  useEffect(() => {
    if (surah && activeSurahNumber === surah.number && activeAyahNumber != null) {
      const idx = surah.ayahs.findIndex(a => a.numberInSurah === activeAyahNumber);
      if (idx !== -1 && ayahRefs.current[idx]) {
        ayahRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [surah, activeSurahNumber, activeAyahNumber]);

  // Intersection observer for tracking last read position
  useEffect(() => {
    if (loading || !surah || !user) return;

    let debounceTimer: NodeJS.Timeout;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const ayahNum = Number(entry.target.getAttribute('data-ayah-number'));
          if (ayahNum) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              updateLastRead({
                surahNumber: surah.number,
                ayahNumber: ayahNum,
                surahName: surah.englishName
              });
            }, 800);
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -50% 0px',
      threshold: 0.5
    });

    ayahRefs.current.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [loading, surah, user, updateLastRead]);

  if (loading) return <div className="space-y-4">
    <Skeleton className="h-40 w-full rounded-2xl" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>;

  if (!surah) return <div>Surah not found</div>;

  const isCurrentSurahPlaying = isPlaying && activeSurahNumber === surah.number;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Surah Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-primary p-8 text-white shadow-xl md:p-12">
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <Badge variant="outline" className="border-white/20 text-white/80">Surah {surah.number}</Badge>
          <h1 className="text-4xl font-bold md:text-6xl">{surah.englishName}</h1>
          <p className="text-lg text-white/80">{surah.englishNameTranslation}</p>
          <div className="h-px w-24 bg-white/20" />
          <p className="quran-font text-5xl">{surah.name}</p>
          <div className="flex gap-4 text-sm text-white/60">
            <span>{surah.revelationType}</span>
            <span>•</span>
            <span>{surah.numberOfAyahs} Ayahs</span>
          </div>

          {/* Quick Play Surah Button */}
          <div className="pt-2">
            <Button
              className="bg-white text-brand-primary hover:bg-white/90 font-bold px-6 py-5 rounded-2xl shadow-lg flex items-center gap-2"
              onClick={() => {
                if (isCurrentSurahPlaying) {
                  togglePlay();
                } else {
                  playSurahAyahs({
                    surahNumber: surah.number,
                    surahName: surah.englishName,
                    ayahs: surah.ayahs,
                    startIndex: 0
                  });
                }
              }}
            >
              {isCurrentSurahPlaying ? (
                <>
                  <Pause className="h-4 w-4" /> Pause Recitation
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" /> Play Full Surah (Background)
                </>
              )}
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      {surah.number !== 1 && surah.number !== 9 && (
        <div className="text-center py-8">
          <p className="quran-font text-4xl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
        </div>
      )}

      <div className="space-y-6">
        {surah.ayahs.map((ayah, idx) => {
          const isBookmarked = bookmarks.some(b => b.surahNumber === surah.number && b.ayahNumber === ayah.numberInSurah);
          const bookmarkId = bookmarks.find(b => b.surahNumber === surah.number && b.ayahNumber === ayah.numberInSurah)?.id;
          const isTargetAyah = highlightedAyah === ayah.numberInSurah;
          const isThisAyahActive = activeSurahNumber === surah.number && activeAyahNumber === ayah.numberInSurah;
          const isThisAyahPlaying = isThisAyahActive && isPlaying;
          const isThisAyahRepeating = isThisAyahActive && repeatMode === 'one';

          return (
            <Card
              key={ayah.number}
              data-ayah-number={ayah.numberInSurah}
              className={`overflow-hidden border-none transition-all duration-700 ${
                isThisAyahPlaying
                  ? "bg-brand-primary/10 ring-2 ring-brand-primary shadow-md scale-[1.01]"
                  : isTargetAyah
                  ? "bg-brand-primary/15 ring-2 ring-brand-primary/80 shadow-lg scale-[1.01]"
                  : "bg-white/50 hover:bg-white shadow-sm"
              }`}
              ref={el => { ayahRefs.current[idx] = el; }}
            >
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        isThisAyahPlaying
                          ? "bg-brand-primary text-white"
                          : "bg-brand-primary/10 text-brand-primary"
                      }`}>
                        {ayah.numberInSurah}
                      </div>
                      {isThisAyahPlaying && (
                        <Badge variant="outline" className="border-brand-primary/30 text-brand-primary bg-brand-primary/10 text-[10px] animate-pulse">
                          Now Playing
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Play / Pause Ayah */}
                      <Button
                        variant={isThisAyahPlaying ? "default" : "ghost"}
                        size="icon"
                        className={isThisAyahPlaying ? "bg-brand-primary text-white" : "text-muted-foreground hover:text-brand-primary"}
                        onClick={() => {
                          if (isThisAyahPlaying) {
                            togglePlay();
                          } else {
                            playSurahAyahs({
                              surahNumber: surah.number,
                              surahName: surah.englishName,
                              ayahs: surah.ayahs,
                              startIndex: idx
                            });
                          }
                          if (user) {
                            updateLastRead({
                              surahNumber: surah.number,
                              ayahNumber: ayah.numberInSurah,
                              surahName: surah.englishName
                            });
                          }
                        }}
                        title={isThisAyahPlaying ? "Pause Audio" : "Play from this Ayah"}
                      >
                        {isThisAyahPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-5 w-5" />}
                      </Button>

                      {/* Repeat Ayah Loop */}
                      <Button
                        variant={isThisAyahRepeating ? "default" : "ghost"}
                        size="icon"
                        aria-label="Repeat infinitely"
                        className={
                          isThisAyahRepeating
                            ? "bg-brand-primary text-white shadow-sm hover:bg-brand-primary/90"
                            : "text-muted-foreground hover:text-brand-primary"
                        }
                        onClick={() => {
                          if (isThisAyahRepeating) {
                            setRepeatMode('none');
                          } else {
                            playSurahAyahs({
                              surahNumber: surah.number,
                              surahName: surah.englishName,
                              ayahs: surah.ayahs,
                              startIndex: idx,
                              repeatAyahOnly: true
                            });
                          }
                          if (user) {
                            updateLastRead({
                              surahNumber: surah.number,
                              ayahNumber: ayah.numberInSurah,
                              surahName: surah.englishName
                            });
                          }
                        }}
                        title={
                          isThisAyahRepeating
                            ? "Ayah repeat loop active (Click to disable)"
                            : "Repeat this Ayah in loop"
                        }
                      >
                        <Repeat1 className={`h-4 w-4 ${isThisAyahRepeating ? "animate-pulse" : ""}`} />
                      </Button>

                      {/* Bookmark Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isBookmarked ? "text-brand-primary" : "text-muted-foreground"}
                        onClick={() => {
                          if (!user) {
                            navigate('/login');
                            return;
                          }
                          if (isBookmarked && bookmarkId) {
                            removeBookmark(bookmarkId);
                          } else {
                            addBookmark({
                              surahNumber: surah.number,
                              ayahNumber: ayah.numberInSurah,
                              surahName: surah.englishName,
                              timestamp: Date.now()
                            });
                          }
                          updateLastRead({
                            surahNumber: surah.number,
                            ayahNumber: ayah.numberInSurah,
                            surahName: surah.englishName
                          });
                        }}
                      >
                        <BookmarkIcon className={isBookmarked ? "fill-current" : ""} />
                      </Button>
                    </div>
                  </div>

                  <p className="quran-text text-right leading-relaxed">
                    {(() => {
                      let ayahText = ayah.text;
                      if (
                        idx === 0 &&
                        surah.number !== 1 &&
                        surah.number !== 9
                      ) {
                        const bismillahRegex = /^[\s\n\r\u200C\u200F\u202A\u202B\u202C]*بِسْمِ[\s\n\r\u200C\u200F\u202A\u202B\u202C]*[اٱ]للّ?ه[\s\n\r\u200C\u200F\u202A\u202B\u202C]*[اٱ]لرَّ?حْمَٰ?نِ[\s\n\r\u200C\u200F\u202A\u202B\u202C]*[اٱ]لرَّ?حِيمِ[\s\n\r\u200C\u200F\u202A\u202B\u202C]*[\n\r]*/u;
                        const newAyahText = ayahText.replace(bismillahRegex, '').trimStart();
                        if (ayahText === newAyahText) {
                          const fallback = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
                          if (ayahText.startsWith(fallback)) {
                            ayahText = ayahText.slice(fallback.length).trimStart();
                          }
                        } else {
                          ayahText = newAyahText;
                        }
                      }
                      return ayahText;
                    })()}
                  </p>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ayah.translation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const BookmarksView = () => {
  const { user } = useAuth();
  const { bookmarks, removeBookmark } = useFirestore(user?.uid);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-primary/10 text-brand-primary">
          <BookmarkIcon className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Sign in for Bookmarks</h2>
          <p className="text-sm text-muted-foreground">Sign in to save your favorite Ayahs and sync across all your devices.</p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary/90 px-6 py-5 rounded-xl font-bold" onClick={() => navigate('/login')}>
          Sign In / Register
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Bookmarks Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-emerald-800 to-teal-900 p-8 text-white shadow-xl md:p-10">
        <div className="relative z-10 space-y-2">
          <Badge variant="outline" className="border-white/20 text-white/90 bg-white/10 backdrop-blur-md">
            <BookmarkIcon className="h-3.5 w-3.5 mr-1 text-amber-300" /> Saved Verses
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Your Bookmarks ({bookmarks.length})</h1>
          <p className="text-white/80 text-sm md:text-base">
            Quickly jump back to your bookmarked Ayahs anytime.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed rounded-3xl bg-white/50">
          <BookmarkIcon className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <h3 className="text-lg font-bold">No bookmarks yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Click the bookmark icon on any Ayah while reading to save it here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) => (
            <Card key={b.id} className="group relative overflow-hidden transition-all hover:shadow-lg border-none bg-white rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <Link to={`/surah/${b.surahNumber}?ayah=${b.ayahNumber}`} className="hover:text-brand-primary font-bold">
                    {b.surahName}
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => removeBookmark(b.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-brand-primary">
                  Ayah {b.ayahNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to={`/surah/${b.surahNumber}?ayah=${b.ayahNumber}`} className="text-xs text-brand-primary font-bold inline-flex items-center gap-1 hover:underline">
                  Go to Ayah {b.ayahNumber} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <AudioProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-8 pb-28 md:pb-12">
            <Routes>
              <Route path="/" element={<SurahList />} />
              <Route path="/surah/:id" element={<SurahView />} />
              <Route path="/bookmarks" element={<BookmarksView />} />
              <Route path="/memorize" element={<MemorizationView />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
          <footer className="border-t bg-white py-8 hidden md:block">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Al-Quran Al-Kareem. Built with peace and devotion.</p>
            </div>
          </footer>
          <BottomNav />
          <AnimatePresence>
            <AudioPlayer />
          </AnimatePresence>
        </div>
      </Router>
    </AudioProvider>
  );
}
