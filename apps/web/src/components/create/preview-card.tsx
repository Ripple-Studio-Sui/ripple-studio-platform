import type { PreviewCombination } from '@ripple-studio/shared';

interface PreviewCardProps {
  combination: PreviewCombination;
  index: number;
}

export function PreviewCard({ combination, index }: PreviewCardProps) {
  return (
    <div className="bg-ripple-900/60 border border-ripple-700/50 rounded-xl overflow-hidden">
      <div className="aspect-square relative bg-ripple-950/50">
        {combination.traits.map((trait, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${trait.assetId}-${i}`}
            src={trait.previewUrl}
            alt={trait.assetName}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ zIndex: i + 1 }}
          />
        ))}
        {!combination.traits.length && (
          <div className="absolute inset-0 flex items-center justify-center text-ripple-500 text-sm">
            No preview
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-ripple-100">#{index + 1}</p>
        <p className="text-xs text-ripple-400 mt-1 truncate">
          {combination.traits.map((t) => t.assetName).join(' · ')}
        </p>
      </div>
    </div>
  );
}