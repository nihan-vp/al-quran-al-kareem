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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
        <CardDescription>
          {isSignUp ? 'Create a new account' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <div className="text-destructive text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (isSignUp ? 'Signing Up...' : 'Logging In...') : (isSignUp ? 'Sign Up' : 'Login')}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-brand-primary underline text-sm"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
