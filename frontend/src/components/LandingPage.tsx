import { useState } from 'react';
import { Shield, Lock, Zap, Eye, CheckCircle, X, Loader2 } from 'lucide-react';

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

type ModalStep = 'idle' | 'scanning' | 'verified';

function WorldIDModal({ onClose, onVerified }: { onClose: () => void; onVerified: () => void }) {
  const [step, setStep] = useState<ModalStep>('idle');

  function startScan() {
    setStep('scanning');
    setTimeout(() => {
      setStep('verified');
      setTimeout(() => {
        onVerified();
        onClose();
      }, 900);
    }, 2200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-gray-700 bg-gray-900 p-8 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-300"
        >
          <X size={16} />
        </button>

        {/* World ID logo-ish orb */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full border-2 border-blue-500 bg-blue-900/30 flex items-center justify-center">
            {step === 'scanning' && (
              <Loader2 size={28} className="text-blue-400 animate-spin" />
            )}
            {step === 'verified' && (
              <CheckCircle size={28} className="text-green-400" />
            )}
            {step === 'idle' && (
              <span className="text-2xl font-black text-blue-300">W</span>
            )}
          </div>
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          {step === 'idle'    && 'Verify with World ID'}
          {step === 'scanning' && 'Scanning iris…'}
          {step === 'verified' && 'Identity Verified!'}
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          {step === 'idle'    && "Prove you're a unique human. No personal data shared."}
          {step === 'scanning' && 'Hold still — generating zero-knowledge proof…'}
          {step === 'verified' && 'ZK proof accepted. One human, one agent.'}
        </p>

        {step === 'idle' && (
          <button
            onClick={startScan}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            Scan Iris (Demo)
          </button>
        )}

        {step === 'scanning' && (
          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}

        {step === 'verified' && (
          <div className="text-xs text-green-400 font-mono bg-green-900/20 border border-green-800 rounded-lg px-3 py-2">
            nullifier_hash: 0x{Math.random().toString(16).slice(2, 18)}…
          </div>
        )}

        <p className="mt-4 text-xs text-gray-700">
          Powered by Worldcoin · Real orb verification coming soon
        </p>
      </div>
    </div>
  );
}

export function LandingPage({ onEnter }: Props) {
  const [verified, setVerified]     = useState(false);
  const [showModal, setShowModal]   = useState(false);

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
          {verified ? (
            <span className="flex items-center gap-2 bg-green-900/30 border border-green-700 text-green-300 px-8 py-3 rounded-lg font-bold">
              <CheckCircle size={16} />
              Verified — entering dashboard…
            </span>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-8 py-3 rounded-lg font-bold text-white transition-colors shadow-lg shadow-blue-900/40"
            >
              Connect World ID
            </button>
          )}
          <button
            onClick={onEnter}
            className="border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-lg font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Open Dashboard →
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-gray-700">
          World ID orb verification · dashboard also open for demo
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

      {/* World ID Modal */}
      {showModal && (
        <WorldIDModal
          onClose={() => setShowModal(false)}
          onVerified={() => {
            setVerified(true);
            setTimeout(onEnter, 800);
          }}
        />
      )}
    </div>
  );
}
