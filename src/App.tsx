/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';
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
  BrainCircuit
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
import { AudioPlayer } from './components/AudioPlayer';
import { MemorizationView } from './components/MemorizationView';

// --- Context for Audio ---
import { createContext, useContext } from 'react';

interface AudioContextType {
  playAudio: (src: string, title: string, subtitle: string) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};


// --- Components ---

const Navbar = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brand-primary">
          <Book className="h-6 w-6" />
          <span className="hidden sm:inline">Al-Quran Al-Kareem</span>
          <span className="sm:hidden">Quran</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium hover:text-brand-primary">Home</Link>
          <Link to="/memorize" className="text-sm font-medium hover:text-brand-primary flex items-center gap-1">
            <BrainCircuit className="h-4 w-4" />
            Memorize
          </Link>
          <Link to="/bookmarks" className="text-sm font-medium hover:text-brand-primary">Bookmarks</Link>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              <UserIcon className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 top-16 w-full border-b bg-white p-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Home</Link>
              <Link to="/memorize" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Memorize</Link>
              <Link to="/bookmarks" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Bookmarks</Link>
              <hr />
              {user ? (
                <Button variant="ghost" onClick={() => { logout(); setIsMenuOpen(false); }}>Logout</Button>
              ) : (
                <Button onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="space-y-8">
      {lastRead && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to={`/surah/${lastRead.surahNumber}`}>
            <Card className="border-none bg-brand-primary/5 shadow-none transition-all hover:bg-brand-primary/10">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-brand-primary p-2 text-white">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-brand-primary uppercase tracking-wider">Last Read</p>
                    <h3 className="text-lg font-bold">{lastRead.surahName}</h3>
                    <p className="text-sm text-muted-foreground">Ayah {lastRead.ayahNumber}</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-brand-primary" />
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search Surah..." 
          className="pl-10 h-12 rounded-xl border-none bg-white shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSurahs.map((surah) => (
          <Link key={surah.number} to={`/surah/${surah.number}`}>
            <motion.div
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl border bg-white p-6 transition-all hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary font-bold">
                    {surah.number}
                  </div>
                  <div>
                    <h3 className="font-bold group-hover:text-brand-primary">{surah.englishName}</h3>
                    <p className="text-xs text-muted-foreground">{surah.englishNameTranslation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="quran-font text-2xl">{surah.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{surah.numberOfAyahs} Ayahs</p>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const SurahView = ({ repeatAyah, setRepeatAyah }: {
  repeatAyah: { [ayahNumber: number]: boolean };
  setRepeatAyah: React.Dispatch<React.SetStateAction<{ [ayahNumber: number]: boolean }>>;
}) => {
  const { id } = useParams();
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { bookmarks, addBookmark, removeBookmark, updateLastRead } = useFirestore(user?.uid);
  const { playAudio } = useAudio();
  const [sequential, setSequential] = useState<{ active: boolean; index: number | null }>({ active: false, index: null });
  const ayahRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      quranService.getSurahWithTranslation(Number(id)).then(data => {
        setSurah(data);
        setLoading(false);
        if (user) {
          updateLastRead({
            uid: user.uid,
            surahNumber: data.number,
            ayahNumber: 1,
            surahName: data.englishName
          });
        }
      });
    }
  }, [id, user]);

  useEffect(() => {
    if (!sequential.active || sequential.index == null || !surah) return;
    const handler = () => {
      if (sequential.active && sequential.index != null && !repeatAyah[surah.ayahs[sequential.index].numberInSurah]) {
        const nextIdx = sequential.index + 1;
        if (nextIdx < surah.ayahs.length) {
          const nextAyah = surah.ayahs[nextIdx];
          setSequential({ active: true, index: nextIdx });
          const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${nextAyah.number}.mp3`;
          playAudio(audioUrl, surah.englishName, `Ayah ${nextAyah.numberInSurah}`);
        } else {
          setSequential({ active: false, index: null });
        }
      }
    };
    window.addEventListener('quran-audio-ended', handler);
    return () => window.removeEventListener('quran-audio-ended', handler);
  }, [sequential, surah, playAudio, repeatAyah]);

  useEffect(() => {
    const handler = () => setSequential({ active: false, index: null });
    window.addEventListener('quran-audio-close', handler);
    return () => window.removeEventListener('quran-audio-close', handler);
  }, []);

  useEffect(() => {
    if (sequential.active && sequential.index != null && ayahRefs.current[sequential.index]) {
      ayahRefs.current[sequential.index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [sequential]);

  if (loading) return <div className="space-y-4">
    <Skeleton className="h-40 w-full rounded-2xl" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-20 w-full" />
  </div>;

  if (!surah) return <div>Surah not found</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
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

          return (
            <Card key={ayah.number} className="overflow-hidden border-none bg-white/50 shadow-sm transition-all hover:bg-white" ref={el => { ayahRefs.current[idx] = el; }}>
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                      {ayah.numberInSurah}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-brand-primary"
                        onClick={() => {
                          const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`;
                          if (!repeatAyah[ayah.numberInSurah]) {
                            setSequential({ active: true, index: idx });
                            playAudio(audioUrl, surah.englishName, `Ayah ${ayah.numberInSurah}`);
                          } else {
                            playAudio(audioUrl + '?repeat=1', surah.englishName, `Ayah ${ayah.numberInSurah}`);
                          }
                          if (user) {
                            updateLastRead({
                              uid: user.uid,
                              surahNumber: surah.number,
                              ayahNumber: ayah.numberInSurah,
                              surahName: surah.englishName
                            });
                          }
                        }}
                        title="Play Ayah"
                      >
                        <Volume2 className="h-5 w-5" />
                      </Button>
                      <Button
                        variant={repeatAyah[ayah.numberInSurah] ? "default" : "ghost"}
                        size="icon"
                        aria-label="Repeat infinitely"
                        className={repeatAyah[ayah.numberInSurah] ? "bg-brand-primary text-white" : ""}
                        onClick={() => {
                          setRepeatAyah(prev => {
                            const newState = { ...prev, [ayah.numberInSurah]: !prev[ayah.numberInSurah] };
                            // If enabling repeat, immediately play with repeat
                            if (!prev[ayah.numberInSurah]) {
                              const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`;
                              playAudio(
                                audioUrl + '?repeat=1',
                                surah.englishName,
                                `Ayah ${ayah.numberInSurah}`
                              );
                            }
                            return newState;
                          });
                          if (user) {
                            updateLastRead({
                              uid: user.uid,
                              surahNumber: surah.number,
                              ayahNumber: ayah.numberInSurah,
                              surahName: surah.englishName
                            });
                          }
                        }}
                        title="Repeat this Ayah infinitely"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={isBookmarked ? "text-brand-primary" : "text-muted-foreground"}
                        onClick={() => {
                          if (!user) return;
                          if (isBookmarked && bookmarkId) {
                            removeBookmark(bookmarkId);
                          } else {
                            addBookmark({
                              surahNumber: surah.number,
                              ayahNumber: ayah.numberInSurah,
                              surahName: surah.englishName,
                              timestamp: Date.now(),
                              uid: user.uid
                            });
                          }
                          updateLastRead({
                            uid: user.uid,
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
                        // Remove all forms of Bismillah with optional whitespace, newlines, alternate spellings, and diacritics
                        // Match exact Bismillah with all possible Unicode forms (ٱ, invisible chars, etc)
                        const bismillahRegex = /^[\s\n\r\u200C\u200F\u202A\u202B\u202C]*بِسْمِ[\s\n\r\u200C\u200F\u202A\u202B\u202C]*[اٱ]للّ?ه[\s\n\r\u200C\u200F\u202A\u202B\u202C]*[اٱ]لرَّ?حْمَٰ?نِ[\s\n\r\u200C\u200F\u202A\u202B\u202C]*[اٱ]لرَّ?حِيمِ[\s\n\r\u200C\u200F\u202A\u202B\u202C]*[\n\r]*/u;
                        const newAyahText = ayahText.replace(bismillahRegex, '').trimStart();
                        if (ayahText === newAyahText) {
                          // Try fallback: remove just the exact visible string
                          const fallback = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
                          if (ayahText.startsWith(fallback)) {
                            ayahText = ayahText.slice(fallback.length).trimStart();
                          } else {
                            console.warn('Bismillah not removed:', ayahText);
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <BookmarkIcon className="h-16 w-16 text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">Sign in to see your bookmarks</h2>
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Your Bookmarks</h1>
      {bookmarks.length === 0 ? (
        <p className="text-muted-foreground">You haven't bookmarked any ayahs yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) => (
            <Card key={b.id} className="group relative overflow-hidden transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Link to={`/surah/${b.surahNumber}`} className="hover:text-brand-primary">
                    {b.surahName}
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => removeBookmark(b.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>Ayah {b.ayahNumber}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={`/surah/${b.surahNumber}`} className="text-sm text-brand-primary font-medium">
                  Go to Ayah →
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
  const [audioData, setAudioData] = useState<{ src: string; title: string; subtitle: string } | null>(null);
  const [repeatAyah, setRepeatAyah] = useState<{ [ayahNumber: number]: boolean }>({});
  const resetRepeatAyah = () => setRepeatAyah({});

  const playAudio = (src: string, title: string, subtitle: string) => {
    setAudioData({ src, title, subtitle });
  };

  return (
    <AudioContext.Provider value={{ playAudio }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<SurahList />} />
              <Route path="/surah/:id" element={<SurahView repeatAyah={repeatAyah} setRepeatAyah={setRepeatAyah} />} />
              <Route path="/bookmarks" element={<BookmarksView />} />
              <Route path="/memorize" element={<MemorizationView />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
            </Routes>
          </main>
          <footer className="border-t bg-white py-8">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Al-Quran Al-Kareem. Built with peace and devotion.</p>
            </div>
          </footer>
          <AnimatePresence>
            {audioData && (
              <AudioPlayer 
                {...audioData} 
                onClose={() => {
                  setAudioData(null);
                  resetRepeatAyah();
                }} 
              />
            )}
          </AnimatePresence>
        </div>
      </Router>
    </AudioContext.Provider>
  );
}

