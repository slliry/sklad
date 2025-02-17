import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { router, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

function useProtectedRoute(user: User | null) {
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Устанавливаем флаг готовности навигации после первого рендера
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth';
    console.log('Current segment:', segments[0], 'User:', user ? 'exists' : 'null');
    
    if (!isNavigationReady) {
      console.log('Navigation not ready yet...');
      return;
    }

    if (!user && !inAuthGroup) {
      console.log('No user, redirecting to login...');
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      console.log('User exists, redirecting to orders...');
      router.replace('/(tabs)/orders');
    }
  }, [user, segments, isNavigationReady]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth listener...');
      unsubscribe();
    };
  }, []);

  useProtectedRoute(user);

  if (loading) {
    console.log('Loading auth state...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f4c430" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider; 