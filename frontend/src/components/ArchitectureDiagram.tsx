import { Network } from 'lucide-react';

export function ArchitectureDiagram() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur p-6">
      <div className="flex items-center gap-2 mb-5">
        <Network size={16} className="text-blue-400" />
        <h2 className="text-base font-bold text-white tracking-tight">System Architecture</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">

          {/* Row 0 — Identity + UI */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {/* World ID */}
            <div className="rounded-lg border border-purple-800 bg-purple-900/20 p-3 text-center">
              <div className="text-lg mb-1">🌐</div>
              <p className="text-xs font-bold text-purple-300">World ID</p>
              <p className="text-xs text-gray-500 mt-0.5">Human Verification</p>
            </div>
            {/* Wallet */}
            <div className="rounded-lg border border-blue-800 bg-blue-900/20 p-3 text-center">
              <div className="text-lg mb-1">👛</div>
              <p className="text-xs font-bold text-blue-300">MetaMask / Wallet</p>
              <p className="text-xs text-gray-500 mt-0.5">wagmi + RainbowKit</p>
            </div>
            {/* Frontend */}
            <div className="rounded-lg border border-indigo-800 bg-indigo-900/20 p-3 text-center">
              <div className="text-lg mb-1">🖥️</div>
              <p className="text-xs font-bold text-indigo-300">React Dashboard</p>
              <p className="text-xs text-gray-500 mt-0.5">Tailwind + Lucide</p>
            </div>
            {/* Blockchain */}
            <div className="rounded-lg border border-cyan-800 bg-cyan-900/20 p-3 text-center">
              <div className="text-lg mb-1">⛓️</div>
              <p className="text-xs font-bold text-cyan-300">Ethereum / EVM</p>
              <p className="text-xs text-gray-500 mt-0.5">Sepolia / Mainnet</p>
            </div>
          </div>

          {/* Arrows Row 1 */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="flex justify-center">
              <Arrow label="ZK Proof" />
            </div>
            <div className="flex justify-center">
              <Arrow label="WalletConnect" />
            </div>
            <div className="flex justify-center">
              <Arrow label="WebSocket / REST" />
            </div>
            <div className="flex justify-center">
              <Arrow label="viem RPC" dir="up" />
            </div>
          </div>

          {/* Middle Row — Core Agent */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {/* Config */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-3 text-center">
              <div className="text-lg mb-1">⚙️</div>
              <p className="text-xs font-bold text-gray-300">Guardian Config</p>
              <p className="text-xs text-gray-500 mt-0.5">Wallet · Chain · Threshold</p>
            </div>
            {/* Backend Agent */}
            <div className="rounded-lg border border-green-700 bg-green-900/20 p-3 text-center col-span-2">
              <div className="text-lg mb-1">🛡️</div>
              <p className="text-xs font-bold text-green-300">Security Guardian Agent</p>
              <p className="text-xs text-gray-500 mt-0.5">Node.js / TypeScript · OpenClaw Local LLM</p>
            </div>
            {/* Mempool Monitor */}
            <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-3 text-center">
              <div className="text-lg mb-1">👁️</div>
              <p className="text-xs font-bold text-yellow-300">Mempool Monitor</p>
              <p className="text-xs text-gray-500 mt-0.5">Pending Tx Watcher</p>
            </div>
          </div>

          {/* Arrows Row 2 */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div />
            <div className="flex justify-center">
              <Arrow label="Threat Event" />
            </div>
            <div className="flex justify-center">
              <Arrow label="Confidential Intent" />
            </div>
            <div className="flex justify-center">
              <Arrow label="Raw Tx Data" dir="up" />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-4 gap-3">
            <div />
            {/* AI Analyzer */}
            <div className="rounded-lg border border-pink-800 bg-pink-900/20 p-3 text-center">
              <div className="text-lg mb-1">🤖</div>
              <p className="text-xs font-bold text-pink-300">AI Analyzer</p>
              <p className="text-xs text-gray-500 mt-0.5">Claude / GPT-4o</p>
            </div>
            {/* NEAR Confidential Intents */}
            <div className="rounded-lg border border-teal-800 bg-teal-900/20 p-3 text-center">
              <div className="text-lg mb-1">🔒</div>
              <p className="text-xs font-bold text-teal-300">NEAR Confidential</p>
              <p className="text-xs text-gray-500 mt-0.5">Stealth Execution</p>
            </div>
            {/* Evacuation */}
            <div className="rounded-lg border border-orange-800 bg-orange-900/20 p-3 text-center">
              <div className="text-lg mb-1">🚀</div>
              <p className="text-xs font-bold text-orange-300">Auto Evacuation</p>
              <p className="text-xs text-gray-500 mt-0.5">Frontrun + Transfer</p>
            </div>
          </div>

        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { color: 'bg-purple-500', label: 'World ID · Identity' },
          { color: 'bg-blue-500',   label: 'User Interface Layer' },
          { color: 'bg-green-500',  label: 'Guardian Agent Core' },
          { color: 'bg-yellow-500', label: 'Blockchain Interface' },
          { color: 'bg-teal-500',   label: 'NEAR Confidential Intents' },
          { color: 'bg-pink-500',   label: 'AI Analysis Engine' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Arrow({ label, dir = 'down' }: { label: string; dir?: 'up' | 'down' }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {dir === 'up' && <span className="text-gray-600 text-xs">▲</span>}
      <div className="w-px h-4 bg-gray-700" />
      <span className="text-xs text-gray-600 whitespace-nowrap">{label}</span>
      <div className="w-px h-4 bg-gray-700" />
      {dir === 'down' && <span className="text-gray-600 text-xs">▼</span>}
    </div>
  );
}
