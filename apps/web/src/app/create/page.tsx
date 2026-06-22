import { MVP_MAX_SUPPLY } from '@ripple-studio/shared';
import Link from 'next/link';

const steps = ['Upload traits', 'Configure layers', 'Set rarity', 'Preview', 'Generate'];

export default function CreatePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-ripple-400 hover:text-ripple-200 text-sm">
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">Create collection</h1>
          <p className="text-ripple-300 mt-1">Step 1 of 5 — Upload traits</p>
        </div>

        <div className="flex gap-2 mb-8">
          {steps.map((step, i) => (
            <div
              key={step}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${
                i === 0
                  ? 'bg-ripple-500 text-white'
                  : 'bg-ripple-900/40 text-ripple-400 border border-ripple-700/50'
              }`}
            >
              {step}
            </div>
          ))}
        </div>

        <div className="bg-ripple-900/40 border border-ripple-700/50 border-dashed rounded-2xl p-16 text-center">
          <p className="text-ripple-200 text-lg mb-2">Drop trait folders here</p>
          <p className="text-ripple-400 text-sm mb-4">
            PNG, JPG, SVG, GIF · Max {MVP_MAX_SUPPLY} NFTs in MVP
          </p>
          <button className="bg-ripple-700 hover:bg-ripple-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            Browse files
          </button>
        </div>
      </div>
    </main>
  );
}