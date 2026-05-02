import { Shield, Lock, Zap, Eye } from 'lucide-react';

interface Props {
  onEnter: () => void;
}

const features = [
  {
    step: '1',
    icon: Eye,
    title: 'Verify Identity',
    description: 'World ID ensures one unique human controls one powerful AI agent.',
    color: 'text-cyan-400',
    border: 'border-cyan-800',
    bg: 'bg-cyan-900/20',
  },
  {
    step: '2',
    icon: Lock,
    title: 'Local Intelligence',
    description: 'OpenClaw processes your alpha strategy locally. No data leaks.',
    color: 'text-purple-400',
    border: 'border-purple-800',
    bg: 'bg-purple-900/20',
  },
  {
    step: '3',
    icon: Zap,
    title: 'Stealth Execution',
    description: 'NEAR Confidential Intents hide your trades from front-running bots.',
    color: 'text-blue-400',
    border: 'border-blue-800',
    bg: 'bg-blue-900/20',
  },
];

const techPills = [
  'NEAR Protocol',
  'World ID',
  'OpenClaw',
  'Confidential Intents',
  'Zero-Knowledge Proofs',
];

export function LandingPage({ onEnter }: Props) {
  return (
    <div className="min-h-screen grid-bg flex flex-col">
      {/* Nav */}
      <nav className="p-6 flex justify-between items-center border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-cyan-400" fill="rgba(34,211,238,0.15)" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            On-chain Security Guardian
          </h1>
        </div>
        <span className="text-xs bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-gray-400">
          @CS_daichi
        </span>
      </nav>

      {/* Hero */}
      <header className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
        {/* Glow orb */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-cyan-500 to-blue-600 scale-150" />
          <div className="relative w-20 h-20 rounded-full border border-cyan-700 bg-cyan-900/30 flex items-center justify-center">
            <Shield size={36} className="text-cyan-400" fill="rgba(34,211,238,0.2)" />
          </div>
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight max-w-3xl">
          Privacy-First AI Agent{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            for World ID Humans
          </span>
        </h2>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
          Automating secure on-chain operations with{' '}
          <span className="text-cyan-300 font-semibold">OpenClaw</span>,{' '}
          <span className="text-blue-300 font-semibold">NEAR Confidential Intents</span>, and{' '}
          <span className="text-purple-300 font-semibold">World ID</span> verification.
        </p>

        <p className="text-sm text-gray-600 mb-10">
          One human. One agent. Zero leaks.
        </p>

        {/* Tech pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {techPills.map((pill) => (
            <span
              key={pill}
              className="text-xs px-3 py-1 rounded-full border border-gray-700 bg-gray-800/60 text-gray-400"
            >
              {pill}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={onEnter}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-8 py-3 rounded-lg font-bold text-white transition-colors shadow-lg shadow-blue-900/40"
          >
            Connect World ID
          </button>
          <button
            onClick={onEnter}
            className="border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-lg font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Open Dashboard →
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-gray-700">
          World ID verification coming soon — dashboard is open for demo
        </p>
      </header>

      {/* Features */}
      <section className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 px-6 pb-20">
        {features.map(({ step, icon: Icon, title, description, color, border, bg }) => (
          <div
            key={step}
            className={`p-6 rounded-xl border ${border} ${bg} backdrop-blur relative overflow-hidden`}
          >
            <span className="absolute top-3 right-4 text-5xl font-black opacity-10 select-none">
              {step}
            </span>
            <Icon size={20} className={`${color} mb-3`} />
            <h3 className={`${color} font-bold mb-2`}>{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-gray-800 text-gray-600 text-xs">
        Built for NEAR &amp; Worldcoin Hackathons 2026 &nbsp;·&nbsp; On-chain Security Guardian MVP v0.1
      </footer>
    </div>
  );
}
