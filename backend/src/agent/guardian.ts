import { formatEther, parseEther } from 'viem';
import { randomBytes } from 'crypto';
import { analyzeContract } from './analyzer.js';
import { MempoolMonitor } from './monitor.js';
import type {
  WatchConfig,
  PendingTransaction,
  ThreatEvent,
  EvacuationSimulation,
  EvacuatedAsset,
  GuardianStatus,
  ThreatLevel,
} from '../types/index.js';

const THREAT_LEVEL_RANK: Record<ThreatLevel, number> = {
  safe:     0,
  low:      1,
  medium:   2,
  high:     3,
  critical: 4,
};

type EventCallback = (event: ThreatEvent) => void;
type EvacuationCallback = (simulation: EvacuationSimulation) => void;
type StatusCallback = (status: GuardianStatus) => void;

export class SecurityGuardian {
  private config: WatchConfig;
  private monitor: MempoolMonitor;
  private threatHistory: ThreatEvent[] = [];
  private evacuationHistory: EvacuationSimulation[] = [];
  private isActive = false;
  private startTime = 0;
  private pendingTxsScanned = 0;

  private onThreat?: EventCallback;
  private onEvacuation?: EvacuationCallback;
  private onStatusUpdate?: StatusCallback;

  constructor(config: WatchConfig) {
    this.config = config;
    this.monitor = new MempoolMonitor(config, this.handleTransaction.bind(this));
  }

  on(event: 'threat', cb: EventCallback): void;
  on(event: 'evacuation', cb: EvacuationCallback): void;
  on(event: 'status', cb: StatusCallback): void;
  on(event: string, cb: unknown): void {
    if (event === 'threat')     this.onThreat = cb as EventCallback;
    if (event === 'evacuation') this.onEvacuation = cb as EvacuationCallback;
    if (event === 'status')     this.onStatusUpdate = cb as StatusCallback;
  }

  async start(): Promise<void> {
    this.isActive = true;
    this.startTime = Date.now();
    await this.monitor.start();
    this.emitStatus();
    console.log(`[Guardian] Active — protecting ${this.config.walletAddress}`);
  }

  stop(): void {
    this.isActive = false;
    this.monitor.stop();
    this.emitStatus();
    console.log('[Guardian] Stopped');
  }

  async simulateMockAttack(type: 'approval' | 'swap' | 'transfer' = 'approval'): Promise<void> {
    await this.monitor.injectMockTransaction(this.config.walletAddress, type);
  }

  updateConfig(patch: Partial<WatchConfig>): void {
    Object.assign(this.config, patch);
    console.log('[Guardian] Config updated:', patch);
    this.emitStatus();
  }

  getStatus(): GuardianStatus {
    const stats = this.monitor.getStats();
    return {
      isActive:             this.isActive,
      watchedWallet:        this.config.walletAddress,
      safetyWallet:         this.config.safetyWalletAddress,
      chainId:              this.config.chainId,
      totalThreatsDetected: this.threatHistory.length,
      totalEvacuations:     this.evacuationHistory.length,
      lastCheckAt:          this.isActive ? Date.now() : null,
      pendingTxsScanned:    this.pendingTxsScanned + stats.scannedCount,
      uptime:               stats.uptimeSeconds,
    };
  }

  getThreatHistory(): ThreatEvent[] {
    return [...this.threatHistory].reverse();
  }

  getEvacuationHistory(): EvacuationSimulation[] {
    return [...this.evacuationHistory].reverse();
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async handleTransaction(tx: PendingTransaction): Promise<void> {
    if (!tx.to || tx.data === '0x' || tx.data.length < 10) return;

    console.log(`[Guardian] Analyzing tx ${tx.hash.slice(0, 10)}… → ${tx.to}`);

    const valueEth = formatEther(tx.value);
    const analysis = await analyzeContract(tx.to, tx.data, valueEth, tx.from);

    const isAboveThreshold =
      THREAT_LEVEL_RANK[analysis.threatLevel] >=
      THREAT_LEVEL_RANK[this.config.alertThreshold];

    if (!isAboveThreshold) {
      console.log(`[Guardian] ${tx.hash.slice(0, 10)} → ${analysis.threatLevel} (below threshold, skipping)`);
      return;
    }

    const threatEvent = this.buildThreatEvent(tx, analysis);
    this.threatHistory.push(threatEvent);
    this.onThreat?.(threatEvent);
    console.log(`[Guardian] 🚨 Threat detected: ${analysis.threatLevel} (${analysis.categories.join(', ')})`);

    if (this.config.autoEvacuate && THREAT_LEVEL_RANK[analysis.threatLevel] >= THREAT_LEVEL_RANK['high']) {
      const simulation = await this.simulateEvacuation(threatEvent);
      threatEvent.evacuationTriggered = true;
      threatEvent.evacuationTx = simulation;
      this.evacuationHistory.push(simulation);
      this.onEvacuation?.(simulation);
      console.log(`[Guardian] 🛡️ Evacuation simulated — ${simulation.assets.length} assets → ${this.config.safetyWalletAddress}`);
    }

    this.emitStatus();
  }

  private buildThreatEvent(tx: PendingTransaction, analysis: ReturnType<typeof analyzeContract> extends Promise<infer T> ? T : never): ThreatEvent {
    return {
      id:          `threat-${randomBytes(4).toString('hex')}`,
      transaction: {
        hash:     tx.hash,
        from:     tx.from,
        to:       tx.to!,
        value:    formatEther(tx.value),
        gasPrice: tx.gasPrice.toString(),
      },
      analysis,
      evacuationTriggered: false,
      detectedAt: Date.now(),
    };
  }

  private async simulateEvacuation(threat: ThreatEvent): Promise<EvacuationSimulation> {
    // In a real implementation this would:
    // 1. Enumerate wallet token balances via multicall
    // 2. Build ERC-20 transfer transactions
    // 3. Sign with the guardian's hot wallet
    // 4. Submit with gas price = attacker's gas price * 1.2 (frontrun)
    // Here we simulate the logic with realistic mock values.

    const attackerGasPrice = BigInt(threat.transaction.gasPrice);
    const frontrunGasPrice = (attackerGasPrice * 120n) / 100n; // +20%

    const assets: EvacuatedAsset[] = [
      {
        type:    'ETH',
        symbol:  'ETH',
        amount:  '2.4531',
        valueUsd: 7842,
      },
      {
        type:             'ERC20',
        symbol:           'USDC',
        amount:           '15000.00',
        contractAddress:  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        valueUsd:         15000,
      },
      {
        type:             'ERC20',
        symbol:           'WBTC',
        amount:           '0.08213',
        contractAddress:  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        valueUsd:         5240,
      },
    ];

    const gasCostEth = (frontrunGasPrice * 21000n * BigInt(assets.length)) / BigInt(1e18);

    return {
      id:              `evac-${randomBytes(4).toString('hex')}`,
      triggeredBy:     threat.id,
      fromWallet:      this.config.walletAddress,
      toSafetyWallet:  this.config.safetyWalletAddress,
      assets,
      frontrunGasPrice: frontrunGasPrice.toString(),
      estimatedCostEth: formatEther(gasCostEth > 0n ? gasCostEth : parseEther('0.0012')),
      status:          'simulated',
      simulatedAt:     Date.now(),
    };
  }

  private emitStatus(): void {
    this.onStatusUpdate?.(this.getStatus());
  }
}
