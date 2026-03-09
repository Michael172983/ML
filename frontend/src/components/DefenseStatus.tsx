import { Activity, Eye, Zap, Clock, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { ShieldIcon } from './ShieldIcon';
import type { GuardianStatus } from '../types';

interface Props {
  status: GuardianStatus | null;
  wsConnected: boolean;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function truncate(addr: string, chars = 6): string {
  if (!addr) return '—';
  return `${addr.slice(0, chars)}…${addr.slice(-4)}`;
}

export function DefenseStatus({ status, wsConnected }: Props) {
  const isActive = status?.isActive ?? false;

  const stats = [
    {
      icon: Eye,
      label: 'Transactions Scanned',
      value: status?.pendingTxsScanned.toLocaleString() ?? '0',
      color: 'text-blue-400',
    },
    {
      icon: Zap,
      label: 'Threats Detected',
      value: status?.totalThreatsDetected.toString() ?? '0',
      color: status?.totalThreatsDetected ? 'text-red-400' : 'text-green-400',
    },
    {
      icon: TrendingUp,
      label: 'Evacuations',
      value: status?.totalEvacuations.toString() ?? '0',
      color: status?.totalEvacuations ? 'text-orange-400' : 'text-gray-400',
    },
    {
      icon: Clock,
      label: 'Uptime',
      value: formatUptime(status?.uptime ?? 0),
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldIcon active={isActive} size={36} />
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Defense Status</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isActive ? 'Guardian is active and monitoring' : 'Guardian is offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wsConnected ? (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <Wifi size={12} />
              <span>Live</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <WifiOff size={12} />
              <span>Connecting…</span>
            </span>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className={`rounded-lg p-3 mb-6 border flex items-center gap-3 ${
        isActive
          ? 'bg-green-900/20 border-green-800'
          : 'bg-gray-800/40 border-gray-700'
      }`}>
        <Activity size={16} className={isActive ? 'text-green-400' : 'text-gray-600'} />
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className={isActive ? 'text-green-400 font-semibold' : 'text-gray-500'}>
              {isActive ? '● MONITORING ACTIVE' : '○ OFFLINE'}
            </span>
            {isActive && status?.chainId && (
              <span className="text-gray-500">Chain ID: {status.chainId}</span>
            )}
          </div>
          {isActive && (
            <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
          )}
        </div>
      </div>

      {/* Wallet Addresses */}
      {status?.watchedWallet && (
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-xs text-gray-500">Watched Wallet</span>
            <span className="text-xs text-white font-mono" title={status.watchedWallet}>
              {truncate(status.watchedWallet, 8)}
            </span>
          </div>
          {status.safetyWallet && (
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-xs text-gray-500">Safety Wallet</span>
              <span className="text-xs text-green-400 font-mono" title={status.safetyWallet}>
                {truncate(status.safetyWallet, 8)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={13} className="text-gray-500" />
              <span className="text-xs text-gray-500 truncate">{label}</span>
            </div>
            <span className={`text-xl font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
