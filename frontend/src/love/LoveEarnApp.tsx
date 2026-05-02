import { useState, useCallback } from 'react';
import { Heart, LayoutDashboard, Layers, Brain, Coins, Sparkles, Dog } from 'lucide-react';
import type {
  AppTab,
  ActivitySession,
  AgentReport,
  AgentThought,
  RewardCondition,
  TokenMintEvent,
  TokenBalance,
} from './types';
import { ActivityDashboard } from './ActivityDashboard';
import { RewardCanvas } from './RewardCanvas';
import { AgentPanel } from './AgentPanel';
import { ContractPanel } from './ContractPanel';
import { runAgentAnalysis, mintLoveTokens, getTokenBalance } from './simulation';

const TABS: { id: AppTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Activity',  icon: LayoutDashboard },
  { id: 'canvas',    label: 'Rewards',   icon: Layers          },
  { id: 'agent',     label: 'AI Agent',  icon: Brain           },
  { id: 'contract',  label: 'LOVE Token',icon: Coins           },
];

const DEFAULT_CONDITIONS: RewardCondition[] = [
  {
    id: 'default_1',
    metric: 'duration_minutes',
    operator: '>=',
    threshold: 30,
    reward: 10,
    label: 'Duration >= 30min',
    color: 'border-pink-500 bg-pink-900/20 text-pink-300',
    icon: '💓',
  },
  {
    id: 'default_2',
    metric: 'steps',
    operator: '>=',
    threshold: 3000,
    reward: 5,
    label: 'Steps >= 3000',
    color: 'border-blue-500 bg-blue-900/20 text-blue-300',
    icon: '🏃',
  },
  {
    id: 'default_3',
    metric: 'heart_rate_avg',
    operator: '>=',
    threshold: 100,
    reward: 8,
    label: 'Avg HR >= 100 bpm',
    color: 'border-orange-500 bg-orange-900/20 text-orange-300',
    icon: '🔥',
  },
];

export function LoveEarnApp() {
  const [tab, setTab] = useState<AppTab>('dashboard');
  const [session, setSession] = useState<ActivitySession | null>(null);
  const [conditions, setConditions] = useState<RewardCondition[]>(DEFAULT_CONDITIONS);
  const [agentReport, setAgentReport] = useState<AgentReport | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [, setAgentThoughts] = useState<AgentThought[]>([]);
  const [mintEvents, setMintEvents] = useState<TokenMintEvent[]>([]);
  const [minting, setMinting] = useState(false);
  const [balance, setBalance] = useState<TokenBalance>(getTokenBalance());
  const [toasts, setToasts] = useState<string[]>([]);

  const addToast = useCallback((msg: string) => {
    setToasts((prev) => [msg, ...prev].slice(0, 4));
    setTimeout(() => setToasts((prev) => prev.filter((m) => m !== msg)), 4000);
  }, []);

  const handleSessionComplete = useCallback((sess: ActivitySession) => {
    setSession(sess);
    addToast(`✅ Session complete! ${Math.round(sess.durationSeconds / 60)}min recorded`);
    setTab('canvas');
  }, [addToast]);

  const handleRunAgent = useCallback(async () => {
    if (!session) {
      addToast('⚠️ Start an activity session first!');
      setTab('dashboard');
      return;
    }
    setAgentRunning(true);
    setAgentThoughts([]);
    try {
      const report = await runAgentAnalysis(session, (thought) => {
        setAgentThoughts((prev) => [...prev, thought]);
      });
      setAgentReport(report);
      addToast(`🤖 Agent analysis complete — Risk: ${report.riskScore}/100`);
    } finally {
      setAgentRunning(false);
    }
  }, [session, addToast]);

  const handleMint = useCallback(async (metConditions: RewardCondition[]) => {
    if (!session) return;
    setMinting(true);
    try {
      for (const cond of metConditions) {
        const event = await mintLoveTokens(
          session.id,
          cond.reward,
          cond.label,
          (evt) => {
            setMintEvents((prev) => {
              const idx = prev.findIndex((e) => e.id === evt.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = evt;
                return next;
              }
              return [...prev, evt];
            });
          },
        );
        if (event.status === 'confirmed') {
          setBalance(getTokenBalance());
          addToast(`💗 Minted ${event.amount} LOVE tokens!`);
        }
      }
      setTab('contract');
    } finally {
      setMinting(false);
    }
  }, [session, addToast]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 50%, #0a0f0a 100%)' }}>
      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs">
        {toasts.map((msg, i) => (
          <div
            key={i}
            className="rounded-lg border border-pink-800/50 bg-gray-900/90 backdrop-blur px-4 py-2.5 text-xs text-white shadow-2xl"
          >
            {msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center shadow-lg">
              <Heart size={16} className="text-white" fill="white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                LOVE<span className="text-pink-400">.earn</span>
                <Dog size={13} className="text-orange-400 ml-0.5" />
              </div>
              <div className="text-xs text-gray-600">Activity-to-Token dApp · Solana Devnet</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs bg-pink-900/30 border border-pink-800/50 rounded-full px-2.5 py-1 text-pink-300 font-bold">
              <Sparkles size={10} />
              {balance.balance} LOVE
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-2xl mx-auto px-4 flex gap-0 border-t border-gray-800/40">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                tab === id
                  ? 'border-pink-500 text-pink-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Session status bar */}
      {session && (
        <div className="bg-gray-900/60 border-b border-gray-800/40 py-1.5 px-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Session active
            </span>
            <span>Mode: <span className="text-gray-300">{session.mode}</span></span>
            <span>Duration: <span className="text-gray-300">{Math.round(session.durationSeconds / 60)}min</span></span>
            <span>Samples: <span className="text-gray-300">{session.samples.length}</span></span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-5">
        {tab === 'dashboard' && (
          <ActivityDashboard onSessionComplete={handleSessionComplete} />
        )}
        {tab === 'canvas' && (
          <RewardCanvas
            conditions={conditions}
            setConditions={setConditions}
            session={session}
            onMint={handleMint}
            minting={minting}
          />
        )}
        {tab === 'agent' && (
          <AgentPanel
            report={agentReport}
            running={agentRunning}
            onRunAgent={handleRunAgent}
          />
        )}
        {tab === 'contract' && (
          <ContractPanel balance={balance} mintEvents={mintEvents} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/40 mt-10 py-4 text-center text-xs text-gray-700">
        LOVE.earn dApp · Hackathon MVP · AI × Web3 · Solana Devnet · Built with React, TypeScript, DnD Kit
      </footer>
    </div>
  );
}
