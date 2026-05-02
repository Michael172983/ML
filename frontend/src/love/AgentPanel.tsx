import { useState } from 'react';
import { Brain, Eye, Lightbulb, Zap, RefreshCw, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AgentReport, AgentThought, SafetyInfo } from './types';

interface Props {
  report: AgentReport | null;
  running: boolean;
  onRunAgent: () => void;
}

const STEP_CONFIG = {
  observe: { icon: Eye,         label: 'Observe', color: 'text-blue-400',   bg: 'bg-blue-900/20 border-blue-800'   },
  think:   { icon: Lightbulb,   label: 'Think',   color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800' },
  act:     { icon: Zap,         label: 'Act',     color: 'text-pink-400',   bg: 'bg-pink-900/20 border-pink-800'   },
  reflect: { icon: Brain,       label: 'Reflect', color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800' },
} as const;

const RISK_COLOR: Record<string, { text: string; bg: string; icon: React.ElementType }> = {
  safe:    { text: 'text-green-400',  bg: 'bg-green-900/20 border-green-800',   icon: CheckCircle   },
  caution: { text: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800', icon: Shield        },
  warning: { text: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800', icon: AlertTriangle },
  danger:  { text: 'text-red-400',    bg: 'bg-red-900/20 border-red-800',       icon: AlertTriangle },
};

function ThoughtCard({ thought }: { thought: AgentThought }) {
  const cfg = STEP_CONFIG[thought.step];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-lg border p-3 ${cfg.bg}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={12} className={cfg.color} />
        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
        {thought.toolUsed && (
          <span className="ml-auto text-xs text-gray-600 font-mono bg-gray-800 px-1.5 rounded">
            {thought.toolUsed}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{thought.content}</p>
      {thought.result && (
        <div className="mt-2 border-t border-gray-700 pt-2">
          <p className="text-xs text-gray-500 font-mono leading-relaxed">{thought.result}</p>
        </div>
      )}
    </div>
  );
}

function SafetyCard({ info }: { info: SafetyInfo }) {
  const cfg = RISK_COLOR[info.riskLevel];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-lg border p-3 ${cfg.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} className={cfg.text} />
        <span className={`text-xs font-bold ${cfg.text}`}>{info.area}</span>
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} uppercase`}>
          {info.riskLevel}
        </span>
      </div>
      <p className="text-xs font-semibold text-gray-200 mb-1">{info.title}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{info.description}</p>
      <p className="text-xs text-gray-600 mt-1">Source: {info.source}</p>
    </div>
  );
}

export function AgentPanel({ report, running, onRunAgent }: Props) {
  const [tab, setTab] = useState<'thoughts' | 'safety' | 'summary'>('thoughts');

  const riskColor =
    !report ? 'text-gray-500'
    : report.riskScore > 70 ? 'text-red-400'
    : report.riskScore > 40 ? 'text-orange-400'
    : 'text-green-400';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              running ? 'bg-purple-900/40 border border-purple-700 animate-pulse' : 'bg-gray-800 border border-gray-700'
            }`}>
              <Brain size={16} className={running ? 'text-purple-400' : 'text-gray-500'} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">OpenClaw Agent</div>
              <div className="text-xs text-gray-500">Agentic Workflow Engine</div>
            </div>
          </div>
          <button
            onClick={onRunAgent}
            disabled={running}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              running
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <RefreshCw size={11} className={running ? 'animate-spin' : ''} />
            {running ? 'Analyzing…' : 'Run Analysis'}
          </button>
        </div>

        {/* Risk meter */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Risk Score</span>
            <span className={`font-bold ${riskColor}`}>
              {report ? `${report.riskScore}/100` : '—'}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                !report ? 'bg-gray-700 w-0'
                : report.riskScore > 70 ? 'bg-red-500'
                : report.riskScore > 40 ? 'bg-orange-500'
                : 'bg-green-500'
              }`}
              style={{ width: report ? `${report.riskScore}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Agent Architecture Info */}
      <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
        <div className="text-xs font-bold text-gray-300 mb-2">Agent Reasoning Loop</div>
        <div className="flex items-center gap-1 flex-wrap">
          {(['observe', 'think', 'act', 'reflect'] as const).map((step, i) => {
            const cfg = STEP_CONFIG[step];
            const Icon = cfg.icon;
            return (
              <div key={step} className="flex items-center gap-1">
                <div className={`flex items-center gap-1 rounded px-2 py-0.5 border text-xs ${cfg.bg} ${cfg.color}`}>
                  <Icon size={9} />
                  {cfg.label}
                </div>
                {i < 3 && <span className="text-gray-700">→</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Tools: session_reader · fetch_safety_info · risk_analyzer · biometric_analyzer · contract_interface
        </div>
      </div>

      {report && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-gray-800/60 p-1">
            {(['thoughts', 'safety', 'summary'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  tab === t ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'thoughts' ? `🧠 Thoughts (${report.thoughts.length})` : t === 'safety' ? `🛡 Safety` : '📋 Report'}
              </button>
            ))}
          </div>

          {tab === 'thoughts' && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {report.thoughts.map((t) => (
                <ThoughtCard key={t.id} thought={t} />
              ))}
            </div>
          )}

          {tab === 'safety' && (
            <div className="space-y-2">
              {report.safetyInfo.map((s) => (
                <SafetyCard key={s.id} info={s} />
              ))}
            </div>
          )}

          {tab === 'summary' && (
            <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Recommendation</div>
                <p className={`text-sm font-medium ${riskColor}`}>{report.recommendation}</p>
              </div>
              <div className="border-t border-gray-800 pt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Risk Score</div>
                  <div className={`text-2xl font-bold ${riskColor}`}>{report.riskScore}/100</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Reasoning Steps</div>
                  <div className="text-2xl font-bold text-purple-400">{report.thoughts.length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Safety Sources</div>
                  <div className="text-2xl font-bold text-blue-400">{report.safetyInfo.length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Session ID</div>
                  <div className="text-xs font-mono text-gray-400 mt-1 truncate">{report.sessionId.slice(0, 16)}…</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!report && !running && (
        <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-8 text-center">
          <Brain size={32} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm text-gray-500">Start an activity session and run the agent to see reasoning.</p>
        </div>
      )}
    </div>
  );
}
