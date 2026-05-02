import { Coins, ExternalLink, CheckCircle, Clock, XCircle, Zap, TrendingUp, Award } from 'lucide-react';
import type { TokenMintEvent, TokenBalance } from './types';

interface Props {
  balance: TokenBalance;
  mintEvents: TokenMintEvent[];
}

const STATUS_CONFIG = {
  pending:   { icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800', label: 'Pending'   },
  confirmed: { icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-900/20 border-green-800',   label: 'Confirmed' },
  failed:    { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-900/20 border-red-800',       label: 'Failed'    },
} as const;

function truncateSig(sig: string): string {
  return `${sig.slice(0, 8)}…${sig.slice(-6)}`;
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export function ContractPanel({ balance, mintEvents }: Props) {
  return (
    <div className="space-y-4">
      {/* Token Balance Card */}
      <div className="rounded-xl border border-pink-800/50 bg-gradient-to-br from-pink-950/40 to-gray-900/60 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm">💗</span>
              </div>
              <div>
                <div className="text-xs text-gray-500">LOVE Token</div>
                <div className="text-xs font-mono text-gray-600">Solana Devnet</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-white mt-3">
              {balance.balance.toLocaleString()}
              <span className="text-lg ml-1 text-pink-400">LOVE</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Program ID</div>
            <div className="text-xs font-mono text-gray-600 mt-0.5">LOVE7xMw…Xt2</div>
            <div className="mt-2 text-xs text-gray-500">Network</div>
            <div className="text-xs text-purple-400 font-semibold">Solana Devnet</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-3">
          {[
            { label: 'Total Earned', value: balance.totalEarned, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Sessions',     value: balance.totalSessions, icon: Award,      color: 'text-blue-400'  },
            { label: 'Mint Events',  value: mintEvents.filter((e) => e.status === 'confirmed').length, icon: Zap, color: 'text-pink-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center">
              <Icon size={14} className={`mx-auto mb-1 ${color}`} />
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-600">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Contract Logic */}
      <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Coins size={13} className="text-purple-400" />
          <span className="text-xs font-bold text-gray-200">Smart Contract Logic (TypeScript / Anchor)</span>
        </div>
        <div className="bg-gray-950 rounded-lg p-3 text-xs font-mono overflow-x-auto border border-gray-800">
          <div className="text-gray-600 mb-1">// LOVE Token Mint Program (Solana / Anchor)</div>
          <div className="text-purple-400">{'#[program]'}</div>
          <div className="text-blue-300">{'pub mod love_earn {'}</div>
          <div className="text-gray-400 pl-4">{'use super::*;'}</div>
          <div className="text-gray-400 pl-4 mt-1">{'pub fn mint_love_tokens('}</div>
          <div className="text-gray-400 pl-8">{'ctx: Context<MintLove>,'}</div>
          <div className="text-gray-400 pl-8">{'activity_data: ActivityData,'}</div>
          <div className="text-gray-400 pl-4">{') -> Result<()> {'}</div>
          <div className="text-green-400 pl-8">{'// Validate activity threshold'}</div>
          <div className="text-gray-300 pl-8">{'require!('}</div>
          <div className="text-gray-300 pl-12">{'activity_data.duration_secs >= 1800'}</div>
          <div className="text-gray-300 pl-12">{'|| activity_data.avg_heart_rate > 100,'}</div>
          <div className="text-gray-300 pl-12">{'ErrorCode::ThresholdNotMet'}</div>
          <div className="text-gray-300 pl-8">{');'}</div>
          <div className="text-gray-400 pl-8 mt-1">{'let amount = calculate_reward('}</div>
          <div className="text-gray-400 pl-12">{'&activity_data'}</div>
          <div className="text-gray-400 pl-8">{');'}</div>
          <div className="text-yellow-400 pl-8 mt-1">{'token::mint_to('}</div>
          <div className="text-gray-400 pl-12">{'ctx.accounts.into_mint_context(),'}</div>
          <div className="text-gray-400 pl-12">{'amount,'}</div>
          <div className="text-yellow-400 pl-8">{')?;'}</div>
          <div className="text-blue-300 pl-4 mt-1">{'}'}</div>
          <div className="text-blue-300">{'}'}</div>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-3">
        <div className="text-xs text-gray-500 mb-1">Recipient Wallet</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-300 flex-1 truncate">{balance.address}</span>
          <a
            href={`https://explorer.solana.com/address/${balance.address}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Mint Events */}
      <div>
        <div className="text-xs font-bold text-gray-300 mb-2">Mint History</div>
        {mintEvents.length === 0 ? (
          <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-6 text-center">
            <Coins size={28} className="mx-auto mb-2 text-gray-700" />
            <p className="text-xs text-gray-500">No mints yet. Complete an activity and mint LOVE tokens!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...mintEvents].reverse().map((event) => {
              const cfg = STATUS_CONFIG[event.status];
              const Icon = cfg.icon;
              return (
                <div key={event.id} className={`rounded-lg border p-3 ${cfg.bg}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={12} className={cfg.color} />
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                    <span className="ml-auto text-xs text-pink-400 font-bold">+{event.amount} LOVE</span>
                  </div>
                  <div className="mt-1.5 text-xs text-gray-500">{event.triggerCondition}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-600">{truncateSig(event.txSignature)}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">{timeAgo(event.timestamp)}</span>
                      {event.status === 'confirmed' && (
                        <a
                          href={`https://explorer.solana.com/tx/${event.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400"
                        >
                          <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
