'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isFirebaseConfigured: false });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      // Dynamically set the auth domain for this session to the current hostname.
      // This is a robust way to solve auth/unauthorized-domain errors in proxied
      // development environments (like cloud IDEs) where the domain isn't 'localhost'.
      auth.authDomain = window.location.hostname;
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
