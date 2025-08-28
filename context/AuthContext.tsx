// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type UserRole = 'CR' | 'Student';
interface User {
  id: string;
  name: string;
  role: UserRole;
}
interface AuthContextType {
  user: User | null;
  signIn: (role: UserRole) => void;
  signOut: () => void;
  loading: boolean; // This state is crucial
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this is where you'd check for a saved user session.
    // For now, we are just simulating that the check is complete.
    setLoading(false);
  }, []);

  const signIn = (role: UserRole) => {
    setUser({ id: '1', name: 'Test User', role: role });
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
