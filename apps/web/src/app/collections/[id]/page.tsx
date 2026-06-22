'use client';

import { AuthGuard } from '@/components/auth-guard';
import { getCollectionDetail } from '@/lib/collections';
import { listGeneratedNfts } from '@/lib/generation';
import type { CollectionDetail, NftItemPreview } from '@ripple-studio/shared';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function CollectionView() {
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [nfts, setNfts] = useState<NftItemPreview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCollectionDetail(id), listGeneratedNfts(id, 1, 100)])
      .then(([col, nftList]) => {
        setDetail(col);
        setNfts(nftList.items);
        setTotal(nftList.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ripple-400" />
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ripple-400">Collection not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dashboard"
          className="text-ripple-400 hover:text-ripple-200 text-sm inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{detail.name}</h1>
            <p className="text-ripple-300 mt-1">
              {total} NFTs · {detail.traitLayers.length} layers ·{' '}
              <span className="capitalize">{detail.status}</span>
            </p>
          </div>
          {detail.status === 'draft' && (
            <Link
              href="/create"
              className="bg-ripple-500 hover:bg-ripple-400 text-white px-4 py-2 rounded-lg text-sm"
            >
              Continue editing
            </Link>
          )}
        </div>

        {nfts.length === 0 ? (
          <div className="bg-ripple-900/40 border border-ripple-700/50 border-dashed rounded-2xl p-16 text-center">
            <p className="text-ripple-300">No NFTs generated yet</p>
            <Link href="/create" className="text-ripple-400 hover:text-ripple-200 text-sm mt-4 inline-block">
              Go to create wizard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {nfts.map((nft) => (
              <div
                key={nft.id}
                className="bg-ripple-900/60 border border-ripple-700/50 rounded-xl overflow-hidden hover:border-ripple-500/50 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className="aspect-square object-contain bg-ripple-950/50 w-full"
                />
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{nft.name}</p>
                  <div className="flex justify-between text-xs text-ripple-400 mt-1">
                    <span>#{nft.rarityRank}</span>
                    <span>{nft.rarityScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function CollectionPage() {
  return (
    <AuthGuard>
      <CollectionView />
    </AuthGuard>
  );
}