'use client';

import {
  API_ROUTES,
  type AuthResponse,
  type User,
} from '@ripple-studio/shared';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { clearTokens, getAccessToken, setTokens } from './storage';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await apiFetch<User>(API_ROUTES.authMe);
      setUser(me);
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export async function completeZkLoginAuth(
  jwt: string,
  provider: 'google' | 'apple',
): Promise<AuthResponse> {
  const { loadEphemeralSession, clearEphemeralSession } = await import('./zklogin');
  const session = loadEphemeralSession();
  if (!session) throw new Error('Ephemeral session expired. Please sign in again.');

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  const res = await fetch(`${API_URL}${API_ROUTES.authZkLoginComplete}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jwt,
      provider,
      ephemeralPublicKey: session.keypair.getPublicKey().toBase64(),
      maxEpoch: session.maxEpoch,
      jwtRandomness: session.randomness,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Authentication failed');
  }

  const data: AuthResponse = await res.json();
  setTokens(data.tokens.accessToken, data.tokens.refreshToken);
  clearEphemeralSession();
  return data;
}