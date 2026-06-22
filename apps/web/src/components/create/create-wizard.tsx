'use client';

import {
  MVP_MAX_SUPPLY,
  WIZARD_STEP_LABELS,
  WIZARD_STEPS,
  type CollectionDetail,
  type WizardStep,
} from '@ripple-studio/shared';
import { PreviewCard } from '@/components/create/preview-card';
import { WizardStepper } from '@/components/create/wizard-stepper';
import {
  createCollection,
  getCollectionDetail,
  updateAssetRarity,
  updateCollection,
  updateLayers,
  uploadTraits,
} from '@/lib/collections';
import {
  getGenerationStatus,
  listGeneratedNfts,
  startGeneration,
} from '@/lib/generation';
import type { GenerationJobStatus, NftItemPreview } from '@ripple-studio/shared';
import { countCombinations, generatePreviewCombinations } from '@/lib/preview';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  FolderUp,
  GripVertical,
  Layers,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function CreateWizard() {
  const [step, setStep] = useState<WizardStep>('details');
  const [completed, setCompleted] = useState<Set<WizardStep>>(new Set());
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [supply, setSupply] = useState(100);
  const [royaltyBps, setRoyaltyBps] = useState(500);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState<GenerationJobStatus | null>(null);
  const [generatedNfts, setGeneratedNfts] = useState<NftItemPreview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [previewSeed, setPreviewSeed] = useState(0);
  const previews = useMemo(
    () => (detail ? generatePreviewCombinations(detail.traitLayers) : []),
    [detail, previewSeed],
  );

  const combinations = detail ? countCombinations(detail.traitLayers) : 0;

  const refreshDetail = useCallback(async (id: string) => {
    const data = await getCollectionDetail(id);
    setDetail(data);
    return data;
  }, []);

  const goNext = useCallback(() => {
    const idx = WIZARD_STEPS.indexOf(step);
    if (idx < WIZARD_STEPS.length - 1) {
      setCompleted((prev) => new Set([...prev, step]));
      setStep(WIZARD_STEPS[idx + 1]);
    }
  }, [step]);

  const goBack = useCallback(() => {
    const idx = WIZARD_STEPS.indexOf(step);
    if (idx > 0) setStep(WIZARD_STEPS[idx - 1]);
  }, [step]);

  const handleDetailsNext = async () => {
    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }
    if (supply < 1 || supply > MVP_MAX_SUPPLY) {
      setError(`Supply must be between 1 and ${MVP_MAX_SUPPLY}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (collectionId) {
        await updateCollection(collectionId, { name, description, supply, royaltyBps });
        await refreshDetail(collectionId);
      } else {
        const created = await createCollection({ name, description, supply, royaltyBps });
        setCollectionId(created.id);
        await refreshDetail(created.id);
      }
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !collectionId) return;

    setLoading(true);
    setError(null);
    setUploadProgress(`Uploading ${files.length} files…`);

    try {
      const result = await uploadTraits(collectionId, Array.from(files));
      setDetail(result.collection);
      setUploadProgress(`Uploaded ${result.assetsCreated} traits across ${result.layersCreated} layers`);
      setCompleted((prev) => new Set([...prev, 'upload']));
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const moveLayer = async (index: number, direction: -1 | 1) => {
    if (!detail || !collectionId) return;
    const layers = [...detail.traitLayers];
    const target = index + direction;
    if (target < 0 || target >= layers.length) return;

    [layers[index], layers[target]] = [layers[target], layers[index]];
    const updated = layers.map((l, i) => ({ id: l.id, displayOrder: i, isRequired: l.isRequired, name: l.name }));

    setLoading(true);
    try {
      const result = await updateLayers(collectionId, { layers: updated });
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder layers');
    } finally {
      setLoading(false);
    }
  };

  const toggleLayerRequired = async (layerId: string, isRequired: boolean) => {
    if (!detail || !collectionId) return;
    const updated = detail.traitLayers.map((l) => ({
      id: l.id,
      displayOrder: l.displayOrder,
      isRequired: l.id === layerId ? isRequired : l.isRequired,
      name: l.name,
    }));

    setLoading(true);
    try {
      const result = await updateLayers(collectionId, { layers: updated });
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update layer');
    } finally {
      setLoading(false);
    }
  };

  const updateWeight = (assetId: string, weight: number) => {
    if (!detail) return;
    setDetail({
      ...detail,
      traitLayers: detail.traitLayers.map((layer) => ({
        ...layer,
        assets: layer.assets.map((a) =>
          a.id === assetId ? { ...a, rarityWeight: weight } : a,
        ),
      })),
    });
  };

  const saveRarity = async () => {
    if (!detail || !collectionId) return;
    setLoading(true);
    setError(null);
    try {
      const assets = detail.traitLayers.flatMap((l) =>
        l.assets.map((a) => ({ id: a.id, rarityWeight: a.rarityWeight })),
      );
      const result = await updateAssetRarity(collectionId, { assets });
      setDetail(result);
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rarity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionId && step !== 'details') {
      refreshDetail(collectionId).catch(() => {});
    }
  }, [collectionId, step, refreshDetail]);

  useEffect(() => {
    if (!collectionId || !isGenerating) return;
    if (genStatus?.status === 'completed' || genStatus?.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const status = await getGenerationStatus(collectionId);
        setGenStatus(status);
        if (status.status === 'completed') {
          setIsGenerating(false);
          const nfts = await listGeneratedNfts(collectionId, 1, 12);
          setGeneratedNfts(nfts.items);
          await refreshDetail(collectionId);
        }
        if (status.status === 'failed') {
          setIsGenerating(false);
          setError(status.error ?? 'Generation failed');
        }
      } catch {
        /* polling error — retry next tick */
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [collectionId, isGenerating, genStatus?.status, refreshDetail]);

  const handleGenerate = async () => {
    if (!collectionId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const status = await startGeneration(collectionId);
      setGenStatus(status);
      if (status.status === 'completed') {
        setIsGenerating(false);
        const nfts = await listGeneratedNfts(collectionId, 1, 12);
        setGeneratedNfts(nfts.items);
        await refreshDetail(collectionId);
      }
    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'Failed to start generation');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-ripple-400 hover:text-ripple-200 text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">Create collection</h1>
          <p className="text-ripple-300 mt-1">
            Step {WIZARD_STEPS.indexOf(step) + 1} of {WIZARD_STEPS.length} — {WIZARD_STEP_LABELS[step]}
          </p>
        </div>

        <WizardStepper currentStep={step} completedSteps={completed} />

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="bg-ripple-900/40 border border-ripple-700/50 rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-ripple-200 mb-2">Collection name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cyber Explorers"
                className="w-full bg-ripple-950/50 border border-ripple-700/50 rounded-xl px-4 py-3 text-white placeholder:text-ripple-500 focus:outline-none focus:border-ripple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ripple-200 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tell the story of your collection…"
                className="w-full bg-ripple-950/50 border border-ripple-700/50 rounded-xl px-4 py-3 text-white placeholder:text-ripple-500 focus:outline-none focus:border-ripple-400 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ripple-200 mb-2">
                  Supply (max {MVP_MAX_SUPPLY})
                </label>
                <input
                  type="number"
                  min={1}
                  max={MVP_MAX_SUPPLY}
                  value={supply}
                  onChange={(e) => setSupply(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-ripple-950/50 border border-ripple-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ripple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ripple-200 mb-2">
                  Royalty ({(royaltyBps / 100).toFixed(1)}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={royaltyBps}
                  onChange={(e) => setRoyaltyBps(parseInt(e.target.value, 10))}
                  className="w-full mt-3 accent-ripple-400"
                />
              </div>
            </div>
            <button
              onClick={handleDetailsNext}
              disabled={loading}
              className="flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="bg-ripple-900/40 border border-ripple-700/50 border-dashed rounded-2xl p-12 text-center">
            <FolderUp className="w-12 h-12 text-ripple-400 mx-auto mb-4" />
            <p className="text-ripple-200 text-lg mb-2">Drop your trait folders</p>
            <p className="text-ripple-400 text-sm mb-6 max-w-md mx-auto">
              Organize traits in folders — each folder is a layer. Example:{' '}
              <code className="text-ripple-300">Background/blue.png</code>,{' '}
              <code className="text-ripple-300">Eyes/laser.png</code>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              // @ts-expect-error webkitdirectory is non-standard but widely supported
              webkitdirectory=""
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || !collectionId}
              className="bg-ripple-500 hover:bg-ripple-400 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              {loading ? 'Uploading…' : 'Browse trait folders'}
            </button>
            {uploadProgress && <p className="text-ripple-400 text-sm mt-4">{uploadProgress}</p>}
            <div className="flex justify-between mt-8">
              <button onClick={goBack} className="text-ripple-400 hover:text-ripple-200 text-sm">← Back</button>
            </div>
          </div>
        )}

        {/* Step: Layers */}
        {step === 'layers' && detail && (
          <div className="space-y-4">
            <p className="text-ripple-300 text-sm mb-4">
              {detail.traitLayers.length} layers · {combinations.toLocaleString()} possible combinations
            </p>
            {detail.traitLayers.map((layer, i) => (
              <div
                key={layer.id}
                className="bg-ripple-900/40 border border-ripple-700/50 rounded-xl p-4 flex items-center gap-4"
              >
                <GripVertical className="w-5 h-5 text-ripple-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-ripple-100">{layer.name}</p>
                  <p className="text-xs text-ripple-400">{layer.assets.length} traits</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-ripple-300">
                  <input
                    type="checkbox"
                    checked={layer.isRequired}
                    onChange={(e) => toggleLayerRequired(layer.id, e.target.checked)}
                    className="accent-ripple-400"
                  />
                  Required
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveLayer(i, -1)}
                    disabled={i === 0 || loading}
                    className="px-2 py-1 text-ripple-400 hover:text-white disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveLayer(i, 1)}
                    disabled={i === detail.traitLayers.length - 1 || loading}
                    className="px-2 py-1 text-ripple-400 hover:text-white disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-4">
              <button onClick={goBack} className="text-ripple-400 hover:text-ripple-200 text-sm">← Back</button>
              <button
                onClick={goNext}
                className="flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 text-white px-6 py-3 rounded-xl font-medium"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Rarity */}
        {step === 'rarity' && detail && (
          <div className="space-y-6">
            {detail.traitLayers.map((layer) => (
              <div key={layer.id} className="bg-ripple-900/40 border border-ripple-700/50 rounded-xl p-6">
                <h3 className="font-medium text-ripple-100 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-ripple-400" />
                  {layer.name}
                </h3>
                <div className="space-y-3">
                  {layer.assets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-4">
                      {asset.previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.previewUrl} alt={asset.name} className="w-10 h-10 rounded-lg object-contain bg-ripple-950/50" />
                      )}
                      <span className="flex-1 text-sm text-ripple-200">{asset.name}</span>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={asset.rarityWeight}
                        onChange={(e) => updateWeight(asset.id, parseInt(e.target.value, 10) || 1)}
                        className="w-20 bg-ripple-950/50 border border-ripple-700/50 rounded-lg px-2 py-1 text-sm text-white text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-4">
              <button onClick={goBack} className="text-ripple-400 hover:text-ripple-200 text-sm">← Back</button>
              <button
                onClick={saveRarity}
                disabled={loading}
                className="flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & preview <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && detail && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-ripple-300 text-sm">
                {combinations.toLocaleString()} total combinations · showing {previews.length} random samples
              </p>
              <button
                onClick={() => setPreviewSeed((s) => s + 1)}
                className="text-ripple-400 hover:text-ripple-200 text-sm"
              >
                Shuffle previews
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previews.map((combo, i) => (
                <PreviewCard key={combo.id} combination={combo} index={i} />
              ))}
            </div>
            {combinations > supply && (
              <p className="mt-4 text-amber-300/80 text-sm bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
                ⚠️ {combinations.toLocaleString()} combinations exceed your supply of {supply}. Duplicates will be
                skipped during generation (PR-5).
              </p>
            )}
            <div className="flex justify-between pt-8">
              <button onClick={goBack} className="text-ripple-400 hover:text-ripple-200 text-sm">← Back</button>
              <button
                onClick={goNext}
                className="flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 text-white px-6 py-3 rounded-xl font-medium"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Generate */}
        {step === 'generate' && detail && (
          <div className="space-y-8">
            <div className="bg-ripple-900/40 border border-ripple-700/50 rounded-2xl p-12 text-center">
              <Sparkles className="w-12 h-12 text-ripple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{detail.name}</h2>
              <p className="text-ripple-300 mb-6">
                {detail.status === 'generated'
                  ? `Generated ${genStatus?.generated ?? supply} NFTs successfully`
                  : `Ready to generate ${supply.toLocaleString()} unique NFTs`}
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8 text-sm">
                <div className="bg-ripple-950/50 rounded-xl p-4">
                  <p className="text-ripple-400">Supply</p>
                  <p className="text-xl font-bold">{supply}</p>
                </div>
                <div className="bg-ripple-950/50 rounded-xl p-4">
                  <p className="text-ripple-400">Layers</p>
                  <p className="text-xl font-bold">{detail.traitLayers.length}</p>
                </div>
                <div className="bg-ripple-950/50 rounded-xl p-4">
                  <p className="text-ripple-400">Royalty</p>
                  <p className="text-xl font-bold">{(royaltyBps / 100).toFixed(1)}%</p>
                </div>
              </div>

              {isGenerating && genStatus && (
                <div className="max-w-md mx-auto mb-8">
                  <div className="flex justify-between text-sm text-ripple-400 mb-2">
                    <span>Generating…</span>
                    <span>
                      {genStatus.progress} / {genStatus.total}
                    </span>
                  </div>
                  <div className="h-2 bg-ripple-950/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ripple-400 transition-all duration-500"
                      style={{
                        width: `${genStatus.total ? (genStatus.progress / genStatus.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {genStatus.duplicatesSkipped > 0 && (
                    <p className="text-xs text-ripple-500 mt-2">
                      {genStatus.duplicatesSkipped} duplicates skipped
                    </p>
                  )}
                </div>
              )}

              {detail.status !== 'generated' && !isGenerating && (
                <button
                  onClick={handleGenerate}
                  className="bg-ripple-500 hover:bg-ripple-400 text-white px-8 py-4 rounded-xl font-medium transition-colors"
                >
                  Generate {supply} NFTs
                </button>
              )}

              {detail.status === 'generated' && (
                <div className="flex items-center justify-center gap-4">
                  <Link
                    href={`/collections/${collectionId}`}
                    className="bg-ripple-500 hover:bg-ripple-400 text-white px-6 py-3 rounded-xl font-medium"
                  >
                    View collection
                  </Link>
                  <Link href="/dashboard" className="text-ripple-400 hover:text-ripple-200 text-sm">
                    Dashboard
                  </Link>
                </div>
              )}
            </div>

            {generatedNfts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Generated NFTs</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {generatedNfts.map((nft) => (
                    <div
                      key={nft.id}
                      className="bg-ripple-900/60 border border-ripple-700/50 rounded-xl overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={nft.imageUrl} alt={nft.name} className="aspect-square object-contain bg-ripple-950/50" />
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{nft.name}</p>
                        <p className="text-xs text-ripple-400">Rank #{nft.rarityRank}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={goBack} className="text-ripple-400 hover:text-ripple-200 text-sm">
              ← Back to preview
            </button>
          </div>
        )}
      </div>
    </main>
  );
}