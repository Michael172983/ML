import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { Shield, Bell } from 'lucide-react';
import { wagmiConfig } from './lib/wagmi';
import { useGuardianWS } from './hooks/useGuardianWS';
import { DefenseStatus } from './components/DefenseStatus';
import { GuardianConfig } from './components/GuardianConfig';
import { ThreatFeed } from './components/ThreatFeed';
import { DemoPanel } from './components/DemoPanel';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import type { ThreatEvent, EvacuationSimulation, GuardianStatus } from './types';

const queryClient = new QueryClient();

function GuardianApp() {
  const [status, setStatus]         = useState<GuardianStatus | null>(null);
  const [threats, setThreats]       = useState<ThreatEvent[]>([]);
  const [, setEvacuations]          = useState<EvacuationSimulation[]>([]);
  const [notifications, setNotifs]  = useState<string[]>([]);

  const addNotif = useCallback((msg: string) => {
    setNotifs((prev) => [msg, ...prev].slice(0, 5));
    setTimeout(() => setNotifs((prev) => prev.filter((n) => n !== msg)), 6000);
  }, []);

  const { connected } = useGuardianWS({
    onStatus:     (s) => setStatus(s),
    onThreat:     (t) => {
      setThreats((prev) => {
        if (prev.find((e) => e.id === t.id)) return prev;
        return [t, ...prev];
      });
      addNotif(`🚨 Threat detected: ${t.analysis.threatLevel.toUpperCase()} — ${t.analysis.categories[0] ?? 'unknown'}`);
    },
    onEvacuation: (e) => {
      setEvacuations((prev) => [e, ...prev]);
      addNotif(`🛡️ Evacuation triggered — ${e.assets.length} assets secured`);
    },
  });

  return (
    <div className="min-h-screen grid-bg">
      {/* Notification Toast Stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((msg, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg bg-gray-900 border border-gray-700 shadow-2xl px-4 py-3 text-sm text-white animate-fade-in"
          >
            <Bell size={14} className="mt-0.5 text-orange-400 shrink-0" />
            <span>{msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={22} className="text-green-400" fill="rgba(34,197,94,0.15)" />
            <div>
              <span className="text-sm font-bold text-white tracking-tight">On-chain Security Guardian</span>
              <span className="ml-2 text-xs text-gray-600">MVP v0.1</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {threats.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                {threats.length} threat{threats.length > 1 ? 's' : ''}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full border ${
              status?.isActive
                ? 'text-green-400 border-green-800 bg-green-900/20'
                : 'text-gray-500 border-gray-800 bg-gray-900/40'
            }`}>
              {status?.isActive ? '● ACTIVE' : '○ OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <DefenseStatus status={status} wsConnected={connected} />
            <GuardianConfig status={status} onStatusChange={setStatus} />
            <DemoPanel isGuardianActive={status?.isActive ?? false} />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <ThreatFeed threats={threats} />
            <ArchitectureDiagram />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-4 text-center text-xs text-gray-700">
        On-chain Security Guardian MVP · Built with React, TypeScript, viem, wagmi, OpenAI/Anthropic
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: '#22c55e', accentColorForeground: 'black' })}>
          <GuardianApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
