'use client';

import { APP_NAME } from '@ripple-studio/shared';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { listCollections } from '@/lib/collections';
import type { Collection } from '@ripple-studio/shared';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCollections()
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

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

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-ripple-400" />
          </div>
        ) : collections.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={
                  collection.status === 'generated'
                    ? `/collections/${collection.id}`
                    : '/create'
                }
                className="bg-ripple-900/40 border border-ripple-700/50 rounded-2xl p-6 hover:border-ripple-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-ripple-100">{collection.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-ripple-800/60 text-ripple-300 capitalize">
                    {collection.status}
                  </span>
                </div>
                {collection.description && (
                  <p className="text-ripple-400 text-sm mb-4 line-clamp-2">{collection.description}</p>
                )}
                <div className="flex gap-4 text-xs text-ripple-500">
                  <span>Supply: {collection.supply}</span>
                  <span>Royalty: {(collection.royaltyBps / 100).toFixed(1)}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
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