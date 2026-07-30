/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { logout } from '../firebase';
import { AuthForm } from '../components/AuthForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, LogOut, Bookmark, History, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuth();
  const { bookmarks, lastRead } = useFirestore(user?.uid);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Al-Quran</h1>
          <p className="text-sm text-muted-foreground">Sign in to save bookmarks and sync reading progress across devices.</p>
        </div>
        <AuthForm onAuthSuccess={() => navigate('/')} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-brand-primary/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-white text-2xl font-bold shadow-md">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <div>
              <CardTitle className="text-xl">{user.email}</CardTitle>
              <CardDescription className="text-xs text-brand-primary font-medium mt-1">
                Active Member
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Link to="/bookmarks">
              <Card className="border bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
                  <Bookmark className="h-6 w-6 text-brand-primary mb-1" />
                  <span className="text-2xl font-bold">{bookmarks.length}</span>
                  <span className="text-xs text-muted-foreground font-medium">Bookmarks</span>
                </CardContent>
              </Card>
            </Link>

            <Link to={lastRead ? `/surah/${lastRead.surahNumber}?ayah=${lastRead.ayahNumber}` : '#'}>
              <Card className="border bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
                  <History className="h-6 w-6 text-brand-primary mb-1" />
                  <span className="text-sm font-bold truncate max-w-full">
                    {lastRead ? lastRead.surahName : 'None'}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {lastRead ? `Ayah ${lastRead.ayahNumber}` : 'Last Read'}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>

          {lastRead && (
            <Link to={`/surah/${lastRead.surahNumber}?ayah=${lastRead.ayahNumber}`}>
              <div className="flex items-center justify-between p-4 rounded-xl bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="text-xs font-semibold text-brand-primary uppercase">Continue Reading</p>
                    <p className="text-sm font-bold">{lastRead.surahName} (Ayah {lastRead.ayahNumber})</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-brand-primary" />
              </div>
            </Link>
          )}

          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              className="w-full flex items-center justify-center gap-2"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
