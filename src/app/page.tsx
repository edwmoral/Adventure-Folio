
'use client';
import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dices, Key, Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAuthAction = async (action: 'signUp' | 'signIn') => {
    if (!isFirebaseConfigured || !auth) return;

    setIsLoading(true);
    try {
      if (action === 'signUp') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Account Created', description: 'Welcome to Adventure Folio!' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Signed In', description: 'Welcome back!' });
      }
      // The redirect to /dashboard is handled by LayoutWrapper
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Authentication Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) return;

    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // Use signInWithRedirect instead of signInWithPopup
      await signInWithRedirect(auth, provider);
      // The user will be redirected. The onAuthStateChanged listener will handle the
      // successful login when they are redirected back to the app.
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Google Sign-In Failed', description: error.message });
      setIsLoading(false);
    }
    // No need for a finally block to set loading to false, as the page will navigate away.
  };

  const allAuthDisabled = isLoading || !isFirebaseConfigured;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Dices className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-headline">Welcome to Adventure Folio</CardTitle>
          <CardDescription>Sign in or create an account to begin your journey.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {!isFirebaseConfigured && (
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Configuration Required</AlertTitle>
                  <AlertDescription>
                      Firebase is not configured. Please add your API keys to the <code>.env</code> file to enable login.
                  </AlertDescription>
              </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={allAuthDisabled}
                className="pl-10"
                />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={allAuthDisabled}
                className="pl-10"
                />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Button onClick={() => handleAuthAction('signIn')} disabled={allAuthDisabled || !email || !password}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Button variant="secondary" onClick={() => handleAuthAction('signUp')} disabled={allAuthDisabled || !email || !password}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={allAuthDisabled}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 54.7l-73.4 67.9C294.5 98.2 272.3 88 248 88c-73.2 0-132.3 59.2-132.3 132S174.8 352 248 352c77.4 0 120.5-47.9 124.6-70.5H248V204h238.5c2.6 14.7 3.8 30.2 3.8 45.8z"></path></svg>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
