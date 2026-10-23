import { createContext } from 'react';
import type { User } from '@/api/auth';

export type AuthState =
  { status: 'checking' } | { status: 'anonymous' } | { status: 'authenticated'; user: User };

export interface AuthContextValue {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
