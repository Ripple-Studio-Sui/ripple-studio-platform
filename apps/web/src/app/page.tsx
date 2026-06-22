import { APP_NAME } from '@ripple-studio/shared';
import { ArrowRight, Layers, Sparkles, Upload, Zap } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Upload,
    title: 'Ripple Create',
    description: 'Upload traits, configure rarity, generate thousands of NFTs.',
  },
  {
    icon: Sparkles,
    title: 'Ripple AI',
    description: 'Your persistent AI companion for design, launch, and strategy.',
  },
  {
    icon: Layers,
    title: 'Ripple Deploy',
    description: 'One-click deployment to Sui with Walrus storage built in.',
  },
  {
    icon: Zap,
    title: 'Ripple Launch',
    description: 'Publish to TradePort, BlueMove, and Clutchy instantly.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-ripple-400 flex items-center justify-center">
            <span className="text-ripple-950 font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-lg">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-ripple-200 hover:text-white transition-colors text-sm"
          >
            Dashboard
          </Link>
          <button className="bg-ripple-500 hover:bg-ripple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Sign in
          </button>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-ripple-800/50 border border-ripple-600/50 rounded-full px-4 py-1.5 text-sm text-ripple-200 mb-8">
          <Sparkles className="w-4 h-4" />
          Built for Sui · Powered by AI
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          One idea.
          <br />
          <span className="text-ripple-300">Infinite ripples.</span>
        </h1>

        <p className="text-xl text-ripple-200 max-w-2xl mx-auto mb-10">
          The no-code NFT creation platform for Sui. From trait upload to marketplace launch —
          without writing a single line of code.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/create"
            className="flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Start creating
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/Ripple-Studio-Sui/ripple-studio-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ripple-200 hover:text-white px-6 py-3 rounded-xl border border-ripple-600/50 hover:border-ripple-400 transition-colors text-sm"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-ripple-900/40 border border-ripple-700/50 rounded-2xl p-6 hover:border-ripple-500/50 transition-colors"
            >
              <feature.icon className="w-8 h-8 text-ripple-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-ripple-300 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ripple-800/50 py-8 text-center text-ripple-400 text-sm">
        <p>© 2026 Ripple Studio · Built on Sui</p>
      </footer>
    </main>
  );
}