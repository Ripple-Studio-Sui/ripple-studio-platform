'use client';

import { APP_NAME } from '@ripple-studio/shared';
import { startZkLogin } from '@/lib/auth/zklogin';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: 'google' | 'apple') => {
    setLoading(provider);
    setError(null);
    try {
      await startZkLogin(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start sign in');
      setLoading(null);
    }
  };

  const googleConfigured = !!process.env.NEXT_PUBLIC_ZKLOGIN_GOOGLE_CLIENT_ID;
  const appleConfigured = !!process.env.NEXT_PUBLIC_ZKLOGIN_APPLE_CLIENT_ID;

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-ripple-400 flex items-center justify-center">
              <span className="text-ripple-950 font-bold">R</span>
            </div>
            <span className="font-semibold text-xl">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-ripple-300 text-sm">
            Sign in with zkLogin — no seed phrase, no wallet extension.
          </p>
        </div>

        <div className="bg-ripple-900/40 border border-ripple-700/50 rounded-2xl p-8 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={() => handleLogin('google')}
            disabled={!googleConfigured || loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl font-medium transition-colors"
          >
            {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <button
            onClick={() => handleLogin('apple')}
            disabled={!appleConfigured || loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-black text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl font-medium transition-colors border border-ripple-700/50"
          >
            {loading === 'apple' ? 'Redirecting…' : 'Continue with Apple'}
          </button>

          {!googleConfigured && !appleConfigured && (
            <p className="text-ripple-400 text-xs text-center pt-2">
              Configure OAuth client IDs in <code className="text-ripple-300">.env</code> to enable
              sign in.
            </p>
          )}

          <p className="text-ripple-400 text-xs text-center pt-4 leading-relaxed">
            Your Sui wallet is created automatically on first sign in. We securely store your zkLogin
            salt — never share it or you may lose access to your wallet.
          </p>
        </div>

        <p className="text-center text-ripple-400 text-sm mt-6">
          <Link href="/" className="hover:text-ripple-200 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}