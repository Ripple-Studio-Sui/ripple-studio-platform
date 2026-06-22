'use client';

import { APP_NAME } from '@ripple-studio/shared';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { Plus } from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{APP_NAME}</h1>
            <p className="text-ripple-300 mt-1">
              {user?.displayName ?? user?.email ?? 'Creator'} ·{' '}
              <span className="font-mono text-xs text-ripple-400">
                {user?.suiAddress.slice(0, 6)}…{user?.suiAddress.slice(-4)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New collection
            </Link>
            <button
              onClick={logout}
              className="text-ripple-400 hover:text-ripple-200 text-sm px-3 py-2"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="bg-ripple-900/40 border border-ripple-700/50 border-dashed rounded-2xl p-16 text-center">
          <p className="text-ripple-300 text-lg mb-2">No collections yet</p>
          <p className="text-ripple-400 text-sm mb-6">
            Create your first NFT collection to get started.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create collection
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}