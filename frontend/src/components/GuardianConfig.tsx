import { useState } from 'react';
import { Settings, Play, Square, AlertTriangle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { guardianApi } from '../hooks/useGuardianApi';
import type { GuardianStatus, ThreatLevel } from '../types';

interface Props {
  status: GuardianStatus | null;
  onStatusChange: (s: GuardianStatus) => void;
}

const THRESHOLD_OPTIONS: { value: ThreatLevel; label: string }[] = [
  { value: 'low',      label: 'Low — Alert on any anomaly' },
  { value: 'medium',   label: 'Medium — Alert on significant threats' },
  { value: 'high',     label: 'High — Alert only on severe threats' },
  { value: 'critical', label: 'Critical — Alert only on critical' },
];

const CHAIN_OPTIONS = [
  { id: 11155111, name: 'Sepolia Testnet' },
  { id: 1,        name: 'Ethereum Mainnet' },
  { id: 137,      name: 'Polygon' },
];

export function GuardianConfig({ status, onStatusChange }: Props) {
  const { address } = useAccount();

  const [safetyWallet, setSafetyWallet]   = useState('');
  const [threshold, setThreshold]         = useState<ThreatLevel>('medium');
  const [autoEvacuate, setAutoEvacuate]   = useState(true);
  const [chainId, setChainId]             = useState(11155111);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const isRunning = status?.isActive ?? false;

  const handleStart = async () => {
    if (!address) return;
    setError(null);
    setLoading(true);
    try {
      const res = await guardianApi.start({
        walletAddress:        address,
        safetyWalletAddress:  safetyWallet || `0x${'0'.repeat(40)}`,
        chainId,
        alertThreshold:       threshold,
        autoEvacuate,
      }) as { status: GuardianStatus };
      onStatusChange(res.status);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start guardian');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await guardianApi.stop();
      const s = await guardianApi.status() as GuardianStatus;
      onStatusChange(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to stop guardian');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur p-6">
      <div className="flex items-center gap-2 mb-5">
        <Settings size={16} className="text-gray-400" />
        <h2 className="text-base font-bold text-white tracking-tight">Guardian Configuration</h2>
      </div>

      {/* Wallet Connect */}
      <div className="mb-5">
        <label className="block text-xs text-gray-500 mb-2">Monitored Wallet</label>
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
        {address && (
          <p className="mt-1.5 text-xs text-gray-500 font-mono">{address}</p>
        )}
      </div>

      {/* Safety Wallet */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1.5">
          Safety Wallet Address
          <span className="text-gray-600 ml-1">(evacuation destination)</span>
        </label>
        <input
          type="text"
          value={safetyWallet}
          onChange={(e) => setSafetyWallet(e.target.value)}
          placeholder="0x..."
          disabled={isRunning}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-green-700 disabled:opacity-50"
        />
      </div>

      {/* Chain */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1.5">Network</label>
        <select
          value={chainId}
          onChange={(e) => setChainId(Number(e.target.value))}
          disabled={isRunning}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-green-700 disabled:opacity-50"
        >
          {CHAIN_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Alert Threshold */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1.5">Alert Threshold</label>
        <select
          value={threshold}
          onChange={(e) => setThreshold(e.target.value as ThreatLevel)}
          disabled={isRunning}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-green-700 disabled:opacity-50"
        >
          {THRESHOLD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Auto Evacuate */}
      <div className="mb-5">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-xs text-white">Auto-Evacuation</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Automatically move funds on HIGH/CRITICAL threats
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoEvacuate}
            disabled={isRunning}
            onClick={() => setAutoEvacuate((v) => !v)}
            className={`relative inline-flex h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
              autoEvacuate ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                autoEvacuate ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-900/30 border border-red-800 p-3">
          <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Start / Stop */}
      {!isRunning ? (
        <button
          onClick={handleStart}
          disabled={loading || !address}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg transition-colors glow-green"
        >
          <Play size={14} fill="currentColor" />
          {loading ? 'Starting…' : 'Activate Guardian'}
        </button>
      ) : (
        <button
          onClick={handleStop}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
        >
          <Square size={14} fill="currentColor" />
          {loading ? 'Stopping…' : 'Deactivate Guardian'}
        </button>
      )}
    </div>
  );
}
