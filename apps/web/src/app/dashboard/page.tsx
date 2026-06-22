import { APP_NAME } from '@ripple-studio/shared';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{APP_NAME}</h1>
            <p className="text-ripple-300 mt-1">Your collections</p>
          </div>
          <Link
            href="/create"
            className="flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New collection
          </Link>
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