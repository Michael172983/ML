import { AlertTriangle, ExternalLink, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { ThreatBadge } from './ThreatBadge';
import type { ThreatEvent } from '../types';

interface Props {
  threats: ThreatEvent[];
}

function formatAge(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function truncate(s: string, len = 8) {
  return `${s.slice(0, len)}…${s.slice(-4)}`;
}

const CATEGORY_LABEL: Record<string, string> = {
  approval_scam:    'Approval Scam',
  rug_pull:         'Rug Pull',
  liquidity_drain:  'Liquidity Drain',
  honeypot:         'Honeypot',
  phishing:         'Phishing',
  flash_loan_attack:'Flash Loan',
  unknown:          'Unknown',
};

function ThreatCard({ event }: { event: ThreatEvent }) {
  const [expanded, setExpanded] = useState(false);
  const { analysis, transaction, evacuationTriggered, evacuationTx } = event;

  return (
    <div className={`rounded-lg border ${
      analysis.threatLevel === 'critical'
        ? 'border-red-700 bg-red-950/20'
        : analysis.threatLevel === 'high'
        ? 'border-red-800 bg-red-900/10'
        : analysis.threatLevel === 'medium'
        ? 'border-orange-800 bg-orange-900/10'
        : 'border-gray-700 bg-gray-800/40'
    } overflow-hidden`}>
      {/* Card Header */}
      <div
        className="flex items-start justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertTriangle
            size={14}
            className={`mt-0.5 shrink-0 ${
              analysis.threatLevel === 'critical' ? 'text-red-400' :
              analysis.threatLevel === 'high'     ? 'text-red-500' :
              analysis.threatLevel === 'medium'   ? 'text-orange-400' :
              'text-yellow-400'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ThreatBadge level={analysis.threatLevel} />
              {analysis.categories.map((cat) => (
                <span key={cat} className="text-xs text-gray-400 bg-gray-800 rounded px-1.5 py-0.5">
                  {CATEGORY_LABEL[cat] ?? cat}
                </span>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="font-mono" title={transaction.to}>{truncate(transaction.to)}</span>
              <span>·</span>
              <span>{formatAge(event.detectedAt)}</span>
              <span>·</span>
              <span>{analysis.confidence}% confidence</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {evacuationTriggered && (
            <span className="text-xs text-orange-400 bg-orange-900/30 border border-orange-800 rounded px-1.5 py-0.5 flex items-center gap-1">
              <ArrowRightLeft size={10} />
              Evacuated
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-800 p-3 space-y-3">
          {/* AI Reasoning */}
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">AI Analysis</p>
            <p className="text-xs text-gray-300 leading-relaxed">{analysis.reasoning}</p>
          </div>

          {/* Indicators */}
          {analysis.indicators.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Indicators</p>
              <ul className="space-y-0.5">
                {analysis.indicators.map((ind, i) => (
                  <li key={i} className="text-xs text-red-300 flex items-start gap-1.5">
                    <span className="mt-1 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {ind}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className="rounded-lg bg-gray-800/60 p-2.5">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Recommendation</p>
            <p className="text-xs text-white">{analysis.recommendation}</p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Transaction</p>
            {[
              { label: 'Hash',  value: transaction.hash,     link: `https://sepolia.etherscan.io/tx/${transaction.hash}` },
              { label: 'From',  value: transaction.from },
              { label: 'To',    value: transaction.to },
              { label: 'Value', value: `${transaction.value} ETH` },
            ].map(({ label, value, link }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-gray-400 max-w-[160px] truncate">{value}</span>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={10} className="text-gray-600 hover:text-blue-400" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Evacuation Simulation */}
          {evacuationTx && (
            <div className="rounded-lg border border-orange-800 bg-orange-900/10 p-2.5">
              <p className="text-xs text-orange-400 font-bold mb-2 uppercase tracking-wider">
                🛡️ Evacuation Simulation
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">To Safety Wallet</span>
                  <span className="font-mono text-green-400">{truncate(evacuationTx.toSafetyWallet, 8)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Frontrun Gas</span>
                  <span className="text-orange-400">{(Number(evacuationTx.frontrunGasPrice) / 1e9).toFixed(2)} Gwei</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Est. Gas Cost</span>
                  <span className="text-white">{evacuationTx.estimatedCostEth} ETH</span>
                </div>
                <div className="mt-2 space-y-0.5">
                  {evacuationTx.assets.map((asset, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500">{asset.symbol}</span>
                      <span className="text-white">{asset.amount} <span className="text-gray-500">(${asset.valueUsd.toLocaleString()})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ThreatFeed({ threats }: Props) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Threat Feed</h2>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">
          {threats.length} events
        </span>
      </div>

      {threats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-green-900/20 border border-green-800 flex items-center justify-center mb-3">
            <span className="text-2xl">🛡️</span>
          </div>
          <p className="text-sm text-gray-400">No threats detected</p>
          <p className="text-xs text-gray-600 mt-1">All clear — guardian is watching</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {threats.map((t) => (
            <ThreatCard key={t.id} event={t} />
          ))}
        </div>
      )}
    </div>
  );
}
