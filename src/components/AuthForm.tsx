/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthFormProps {
  onAuthSuccess?: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/weak-password') return 'Password should be at least 6 characters long.';
    if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      return 'Invalid email or password. Please try again.';
    }
    if (code === 'auth/too-many-requests') return 'Too many failed attempts. Please try again later.';
    return err?.message || 'An error occurred during authentication.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto w-full shadow-sm border border-slate-200/80">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
        <CardDescription>
          {isSignUp ? 'Sign up to sync bookmarks & presets' : 'Sign in to access your saved Quran data'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Email Address</label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>
          {error && <div className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</div>}
          <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/90" disabled={loading}>
            {loading ? (isSignUp ? 'Creating Account...' : 'Logging In...') : (isSignUp ? 'Sign Up' : 'Login')}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-brand-primary font-medium underline text-sm hover:text-brand-primary/80 transition-colors"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
