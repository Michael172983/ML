import {
  createPublicClient,
  webSocket,
  http,
  type PublicClient,
  type WatchPendingTransactionsReturnType,
  type Hex,
  formatEther,
  formatGwei,
} from 'viem';
import { mainnet, sepolia, hardhat } from 'viem/chains';
import { type PendingTransaction, type WatchConfig } from '../types/index.js';

type TransactionCallback = (tx: PendingTransaction) => Promise<void>;

const CHAIN_MAP = {
  1:       mainnet,
  11155111: sepolia,
  31337:   hardhat,
} as const;

function resolveChain(chainId: number) {
  return CHAIN_MAP[chainId as keyof typeof CHAIN_MAP] ?? mainnet;
}

function buildClient(chainId: number): PublicClient {
  const chain = resolveChain(chainId);
  const wsUrl = process.env.RPC_WS_URL;
  const httpUrl = process.env.RPC_HTTP_URL;

  if (wsUrl) {
    return createPublicClient({ chain, transport: webSocket(wsUrl) }) as PublicClient;
  }
  if (httpUrl) {
    return createPublicClient({ chain, transport: http(httpUrl) }) as PublicClient;
  }
  // Default to public Sepolia endpoint for demo
  return createPublicClient({
    chain: sepolia,
    transport: http('https://rpc.sepolia.org'),
  }) as PublicClient;
}

export class MempoolMonitor {
  private client: PublicClient;
  private config: WatchConfig;
  private unwatch: WatchPendingTransactionsReturnType | null = null;
  private onTx: TransactionCallback;
  private isRunning = false;
  private scannedCount = 0;
  private startTime = 0;

  // Polling fallback state
  private pollInterval: NodeJS.Timeout | null = null;
  private lastSeenBlock = 0n;

  constructor(config: WatchConfig, onTransaction: TransactionCallback) {
    this.config = config;
    this.onTx = onTransaction;
    this.client = buildClient(config.chainId);
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();
    console.log(`[Monitor] Starting — watching ${this.config.walletAddress} on chain ${this.config.chainId}`);

    try {
      await this.startWebSocketMonitor();
    } catch (err) {
      console.warn('[Monitor] WebSocket unavailable, falling back to block polling:', err);
      this.startPollingMonitor();
    }
  }

  private async startWebSocketMonitor(): Promise<void> {
    const walletLower = this.config.walletAddress.toLowerCase() as Hex;

    this.unwatch = this.client.watchPendingTransactions({
      onTransactions: async (hashes) => {
        for (const hash of hashes) {
          try {
            const tx = await this.client.getTransaction({ hash });
            if (!tx) continue;
            const fromMatch = tx.from?.toLowerCase() === walletLower;
            const toMatch   = tx.to?.toLowerCase()   === walletLower;
            if (!fromMatch && !toMatch) continue;

            this.scannedCount++;
            await this.onTx({
              hash:       tx.hash,
              from:       tx.from,
              to:         tx.to ?? null,
              value:      tx.value,
              gasPrice:   tx.gasPrice ?? 0n,
              maxFeePerGas:          tx.maxFeePerGas,
              maxPriorityFeePerGas:  tx.maxPriorityFeePerGas,
              data:       tx.input,
              nonce:      tx.nonce,
              chainId:    tx.chainId ?? this.config.chainId,
              blockNumber: tx.blockNumber ?? undefined,
              timestamp:  Date.now(),
            });
          } catch {
            // Tx may have been dropped from mempool — skip
          }
        }
      },
      onError: (err) => console.error('[Monitor] WS error:', err),
    });
  }

  private startPollingMonitor(): void {
    console.log('[Monitor] Block polling mode activated (6s interval)');
    this.pollInterval = setInterval(async () => {
      try {
        await this.pollLatestBlock();
      } catch (err) {
        console.error('[Monitor] Poll error:', err);
      }
    }, 6000);

    // Run immediately
    this.pollLatestBlock().catch(console.error);
  }

  private async pollLatestBlock(): Promise<void> {
    const block = await this.client.getBlock({ blockTag: 'latest', includeTransactions: true });
    if (block.number === this.lastSeenBlock) return;
    this.lastSeenBlock = block.number ?? 0n;

    const walletLower = this.config.walletAddress.toLowerCase();
    for (const tx of block.transactions) {
      if (typeof tx === 'string') continue;
      // viem's getBlock with includeTransactions:true returns Transaction objects
      const fullTx = tx as {
        hash: string;
        from: string;
        to: string | null;
        input: string;
        value: bigint;
        gasPrice?: bigint;
        nonce: number;
      };
      const fromMatch = fullTx.from?.toLowerCase() === walletLower;
      const toMatch   = fullTx.to?.toLowerCase()   === walletLower;
      if (!fromMatch && !toMatch) continue;

      this.scannedCount++;
      await this.onTx({
        hash:       fullTx.hash,
        from:       fullTx.from,
        to:         fullTx.to,
        value:      fullTx.value,
        gasPrice:   fullTx.gasPrice ?? 0n,
        data:       fullTx.input,
        nonce:      fullTx.nonce,
        chainId:    this.config.chainId,
        timestamp:  Date.now(),
      });
    }
  }

  stop(): void {
    this.isRunning = false;
    this.unwatch?.();
    this.unwatch = null;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('[Monitor] Stopped');
  }

  getStats() {
    return {
      isRunning:    this.isRunning,
      scannedCount: this.scannedCount,
      uptimeSeconds: this.isRunning ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
    };
  }

  /**
   * Simulate a pending transaction for demo/testing purposes.
   */
  async injectMockTransaction(walletAddress: string, type: 'approval' | 'swap' | 'transfer'): Promise<void> {
    const mockContracts: Record<string, string> = {
      approval: '0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef',
      swap:     '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      transfer: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    };
    const calldatas: Record<string, string> = {
      approval: '0x095ea7b3000000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeefFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      swap:     '0x38ed173900000000000000000000000000000000000000000000000de0b6b3a7640000',
      transfer: '0xa9059cbb000000000000000000000000abcdef1234567890abcdef1234567890abcdef12',
    };

    const mockTx: PendingTransaction = {
      hash:      `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`,
      from:      walletAddress,
      to:        mockContracts[type],
      value:     type === 'swap' ? 100000000000000000n : 0n,
      gasPrice:  20000000000n,
      data:      calldatas[type],
      nonce:     Math.floor(Math.random() * 100),
      chainId:   this.config.chainId,
      timestamp: Date.now(),
    };

    console.log(`[Monitor] Injecting mock ${type} transaction: ${mockTx.hash}`);
    this.scannedCount++;
    await this.onTx(mockTx);
  }
}

export function formatTxDisplay(tx: PendingTransaction) {
  return {
    hash:       tx.hash,
    from:       tx.from,
    to:         tx.to ?? 'Contract Creation',
    valueEth:   formatEther(tx.value),
    gasPriceGwei: formatGwei(tx.gasPrice),
    hasCalldata: tx.data !== '0x' && tx.data.length > 2,
    timestamp:  tx.timestamp,
  };
}
