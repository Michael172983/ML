import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { SecurityGuardian } from '../agent/guardian.js';
import type {
  WatchConfig,
  WSMessage,
  ThreatEvent,
  EvacuationSimulation,
  GuardianStatus,
} from '../types/index.js';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// ─── Active guardian instance ─────────────────────────────────────────────────
let guardian: SecurityGuardian | null = null;

function broadcast<T>(type: WSMessage['type'], payload: T): void {
  const msg: WSMessage<T> = { type, payload, timestamp: Date.now() };
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function createGuardian(config: WatchConfig): SecurityGuardian {
  if (guardian) guardian.stop();

  guardian = new SecurityGuardian(config);

  guardian.on('threat', (event: ThreatEvent) => {
    broadcast('threat_detected', event);
  });

  guardian.on('evacuation', (sim: EvacuationSimulation) => {
    broadcast('evacuation_triggered', sim);
  });

  guardian.on('status', (status: GuardianStatus) => {
    broadcast('status_update', status);
  });

  return guardian;
}

// ─── REST Endpoints ───────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get('/api/status', (_req, res) => {
  if (!guardian) {
    return res.json({ isActive: false, watchedWallet: null, safetyWallet: null });
  }
  return res.json(guardian.getStatus());
});

app.post('/api/guardian/start', async (req, res) => {
  const config = req.body as WatchConfig;

  if (!config.walletAddress || !config.safetyWalletAddress) {
    return res.status(400).json({ error: 'walletAddress and safetyWalletAddress are required' });
  }
  if (!config.alertThreshold) config.alertThreshold = 'medium';
  if (config.autoEvacuate === undefined) config.autoEvacuate = true;
  if (!config.chainId) config.chainId = 11155111;
  if (!config.monitoredTokens) config.monitoredTokens = [];

  const g = createGuardian(config);
  try {
    await g.start();
    broadcast('guardian_started', g.getStatus());
    return res.json({ ok: true, status: g.getStatus() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

app.post('/api/guardian/stop', (_req, res) => {
  if (!guardian) return res.status(404).json({ error: 'Guardian not running' });
  guardian.stop();
  broadcast('guardian_stopped', guardian.getStatus());
  return res.json({ ok: true });
});

app.post('/api/guardian/config', (req, res) => {
  if (!guardian) return res.status(404).json({ error: 'Guardian not running' });
  guardian.updateConfig(req.body as Partial<WatchConfig>);
  return res.json({ ok: true, status: guardian.getStatus() });
});

app.get('/api/threats', (_req, res) => {
  if (!guardian) return res.json([]);
  return res.json(guardian.getThreatHistory());
});

app.get('/api/evacuations', (_req, res) => {
  if (!guardian) return res.json([]);
  return res.json(guardian.getEvacuationHistory());
});

/**
 * Demo endpoint: inject a simulated attack transaction.
 * POST /api/demo/simulate-attack   { "type": "approval" | "swap" | "transfer" }
 */
app.post('/api/demo/simulate-attack', async (req, res) => {
  if (!guardian) return res.status(404).json({ error: 'Start guardian first' });
  const type = (req.body.type ?? 'approval') as 'approval' | 'swap' | 'transfer';
  await guardian.simulateMockAttack(type);
  return res.json({ ok: true, type });
});

// ─── WebSocket ────────────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  // Send current status on connect
  if (guardian) {
    const msg: WSMessage<GuardianStatus> = {
      type:      'status_update',
      payload:   guardian.getStatus(),
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(msg));

    // Send threat history
    for (const threat of guardian.getThreatHistory().slice(0, 20)) {
      const m: WSMessage<ThreatEvent> = { type: 'threat_detected', payload: threat, timestamp: threat.detectedAt };
      ws.send(JSON.stringify(m));
    }
  }

  ws.on('close', () => console.log('[WS] Client disconnected'));
  ws.on('error', (err) => console.error('[WS] Error:', err));
});

export { httpServer };
