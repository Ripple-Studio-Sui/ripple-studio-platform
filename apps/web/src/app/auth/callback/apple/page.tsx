'use client';

import { completeZkLoginAuth, useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function parseIdTokenFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  return params.get('id_token');
}

export default function AppleCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const idToken = parseIdTokenFromHash();
      if (!idToken) {
        setError('No ID token received from Apple. Please try again.');
        return;
      }

      try {
        await completeZkLoginAuth(idToken, 'apple');
        await refreshUser();
        router.replace('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    }

    handleCallback();
  }, [router, refreshUser]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-red-300 mb-4">{error}</p>
          <a href="/login" className="text-ripple-400 hover:text-ripple-200 text-sm">
            ← Try again
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-ripple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ripple-300">Creating your Sui wallet…</p>
      </div>
    </main>
  );
}