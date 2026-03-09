import type { ThreatLevel } from '../types';

const CONFIG: Record<ThreatLevel, { label: string; cls: string; dot: string }> = {
  safe:     { label: 'SAFE',     cls: 'bg-green-900/40 text-green-400 border-green-700',    dot: 'bg-green-400' },
  low:      { label: 'LOW',      cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-700', dot: 'bg-yellow-400' },
  medium:   { label: 'MEDIUM',   cls: 'bg-orange-900/40 text-orange-400 border-orange-700', dot: 'bg-orange-400' },
  high:     { label: 'HIGH',     cls: 'bg-red-900/40 text-red-400 border-red-700',          dot: 'bg-red-500' },
  critical: { label: 'CRITICAL', cls: 'bg-red-950/60 text-red-300 border-red-600 animate-pulse', dot: 'bg-red-400 animate-ping' },
};

export function ThreatBadge({ level }: { level: ThreatLevel }) {
  const c = CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-bold tracking-widest ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
