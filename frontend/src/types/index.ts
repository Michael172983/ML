export type ThreatLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type ThreatCategory =
  | 'approval_scam'
  | 'rug_pull'
  | 'liquidity_drain'
  | 'honeypot'
  | 'phishing'
  | 'flash_loan_attack'
  | 'unknown';

export interface ContractAnalysis {
  contractAddress: string;
  threatLevel: ThreatLevel;
  categories: ThreatCategory[];
  confidence: number;
  reasoning: string;
  indicators: string[];
  recommendation: string;
  analysisTimestamp: number;
}

export interface ThreatEvent {
  id: string;
  transaction: {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
  };
  analysis: ContractAnalysis;
  evacuationTriggered: boolean;
  evacuationTx?: EvacuationSimulation;
  detectedAt: number;
}

export interface EvacuatedAsset {
  type: 'ETH' | 'ERC20' | 'ERC721';
  symbol: string;
  amount: string;
  contractAddress?: string;
  tokenId?: string;
  valueUsd: number;
}

export interface EvacuationSimulation {
  id: string;
  triggeredBy: string;
  fromWallet: string;
  toSafetyWallet: string;
  assets: EvacuatedAsset[];
  frontrunGasPrice: string;
  estimatedCostEth: string;
  status: 'simulated' | 'submitted' | 'confirmed' | 'failed';
  simulatedAt: number;
  txHash?: string;
}

export interface GuardianStatus {
  isActive: boolean;
  watchedWallet: string | null;
  safetyWallet: string | null;
  chainId: number;
  totalThreatsDetected: number;
  totalEvacuations: number;
  lastCheckAt: number | null;
  pendingTxsScanned: number;
  uptime: number;
}

export type WSMessageType =
  | 'status_update'
  | 'threat_detected'
  | 'evacuation_triggered'
  | 'tx_scanned'
  | 'guardian_started'
  | 'guardian_stopped'
  | 'error';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}
