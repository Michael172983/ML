import { useState } from 'react';
import { FlaskConical, ChevronRight, Loader } from 'lucide-react';
import { guardianApi } from '../hooks/useGuardianApi';

interface Props {
  isGuardianActive: boolean;
}

const SCENARIOS = [
  {
    type:        'approval' as const,
    label:       'Approval Scam Attack',
    description: 'Simulate setApprovalForAll() to a malicious contract',
    color:       'border-red-800 hover:border-red-600 hover:bg-red-900/20',
    badge:       'bg-red-900/40 text-red-400',
    badgeText:   'CRITICAL',
  },
  {
    type:        'swap' as const,
    label:       'Rug Pull / Liquidity Drain',
    description: 'Simulate rapid liquidity removal from a DEX pool',
    color:       'border-orange-800 hover:border-orange-600 hover:bg-orange-900/20',
    badge:       'bg-orange-900/40 text-orange-400',
    badgeText:   'HIGH',
  },
  {
    type:        'transfer' as const,
    label:       'Suspicious Token Transfer',
    description: 'Simulate a large ERC-20 transfer to unknown address',
    color:       'border-yellow-800 hover:border-yellow-600 hover:bg-yellow-900/20',
    badge:       'bg-yellow-900/40 text-yellow-400',
    badgeText:   'MEDIUM',
  },
];

export function DemoPanel({ isGuardianActive }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult]   = useState<string | null>(null);

  const run = async (type: 'approval' | 'swap' | 'transfer') => {
    setLoading(type);
    setResult(null);
    try {
      await guardianApi.simulateAttack(type);
      setResult(`✓ "${type}" scenario injected — check threat feed`);
    } catch (e: unknown) {
      setResult(`✗ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(null);
      setTimeout(() => setResult(null), 5000);
    }
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur p-6">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical size={16} className="text-purple-400" />
        <h2 className="text-base font-bold text-white tracking-tight">Demo Simulator</h2>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Inject mock attack transactions to see the guardian in action.
        {!isGuardianActive && (
          <span className="text-yellow-500 ml-1">Activate the guardian first.</span>
        )}
      </p>

      <div className="space-y-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.type}
            disabled={!isGuardianActive || loading !== null}
            onClick={() => run(s.type)}
            className={`w-full flex items-center justify-between rounded-lg border p-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${s.color}`}
          >
            <div className="flex items-start gap-2 text-left">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${s.badge}`}>
                {s.badgeText}
              </span>
              <div>
                <p className="text-xs font-semibold text-white">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
              </div>
            </div>
            <div className="ml-3 shrink-0">
              {loading === s.type ? (
                <Loader size={14} className="text-gray-400 animate-spin" />
              ) : (
                <ChevronRight size={14} className="text-gray-500" />
              )}
            </div>
          </button>
        ))}
      </div>

      {result && (
        <div className={`mt-3 rounded-lg p-2.5 text-xs font-mono ${
          result.startsWith('✓') ? 'bg-green-900/20 text-green-400 border border-green-800' : 'bg-red-900/20 text-red-400 border border-red-800'
        }`}>
          {result}
        </div>
      )}
    </div>
  );
}
