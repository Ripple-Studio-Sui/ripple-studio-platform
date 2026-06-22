'use client';

import { AuthGuard } from '@/components/auth-guard';
import { getCollectionDetail } from '@/lib/collections';
import { listGeneratedNfts } from '@/lib/generation';
import {
  getWalrusCostEstimate,
  getWalrusUploadStatus,
  startWalrusUpload,
} from '@/lib/walrus';
import type {
  CollectionDetail,
  NftItemPreview,
  WalrusCostEstimate,
  WalrusUploadJobStatus,
} from '@ripple-studio/shared';
import { ArrowLeft, CloudUpload, Loader2 } from 'lucide-react';
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
  const [walrusStatus, setWalrusStatus] = useState<WalrusUploadJobStatus | null>(null);
  const [walrusEstimate, setWalrusEstimate] = useState<WalrusCostEstimate | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCollectionDetail(id), listGeneratedNfts(id, 1, 100)])
      .then(([col, nftList]) => {
        setDetail(col);
        setNfts(nftList.items);
        setTotal(nftList.total);
        const onWalrus = nftList.items.filter((n) => n.imageUrl.includes('walrus')).length;
        setUploadedCount(onWalrus);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !detail || detail.status !== 'generated') return;
    getWalrusCostEstimate(id).then(setWalrusEstimate).catch(() => {});
    getWalrusUploadStatus(id)
      .then((s) => {
        setWalrusStatus(s);
        if (s.uploaded > 0) setUploadedCount(s.uploaded);
      })
      .catch(() => {});
  }, [id, detail]);

  useEffect(() => {
    if (!id || !isUploading) return;
    if (walrusStatus?.status === 'completed' || walrusStatus?.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const status = await getWalrusUploadStatus(id);
        setWalrusStatus(status);
        if (status.status === 'completed') {
          setIsUploading(false);
          setUploadedCount(status.uploaded);
          const nftList = await listGeneratedNfts(id, 1, 100);
          setNfts(nftList.items);
        }
        if (status.status === 'failed') {
          setIsUploading(false);
          setError(status.error ?? 'Upload failed');
        }
      } catch {
        /* retry */
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id, isUploading, walrusStatus?.status]);

  const handleWalrusUpload = async () => {
    setIsUploading(true);
    setError(null);
    try {
      const status = await startWalrusUpload(id);
      setWalrusStatus(status);
      if (status.status === 'completed') {
        setIsUploading(false);
        setUploadedCount(status.uploaded);
        const nftList = await listGeneratedNfts(id, 1, 100);
        setNfts(nftList.items);
      }
    } catch (err) {
      setIsUploading(false);
      setError(err instanceof Error ? err.message : 'Failed to start upload');
    }
  };

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
              {uploadedCount > 0 && (
                <span className="text-emerald-400"> · {uploadedCount} on Walrus</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {detail.status === 'generated' && uploadedCount < total && (
              <button
                onClick={handleWalrusUpload}
                disabled={isUploading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CloudUpload className="w-4 h-4" />
                )}
                Store on Walrus
              </button>
            )}
            {detail.status === 'draft' && (
              <Link
                href="/create"
                className="bg-ripple-500 hover:bg-ripple-400 text-white px-4 py-2 rounded-lg text-sm"
              >
                Continue editing
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {isUploading && walrusStatus && (
          <div className="mb-6 bg-ripple-900/40 border border-ripple-700/50 rounded-xl p-4">
            <div className="flex justify-between text-sm text-ripple-400 mb-2">
              <span>Uploading to Walrus…</span>
              <span>
                {walrusStatus.uploaded} / {walrusStatus.total}
              </span>
            </div>
            <div className="h-2 bg-ripple-950/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${walrusStatus.total ? (walrusStatus.uploaded / walrusStatus.total) * 100 : 0}%`,
                }}
              />
            </div>
            {walrusEstimate && (
              <p className="text-xs text-ripple-500 mt-2">
                Est. ${walrusEstimate.estimatedCostUsd.toFixed(4)} for{' '}
                {(walrusEstimate.totalBytes / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
        )}

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