// ---- Activity & Sensor Data ----

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface ActivitySample {
  timestamp: number;
  heartRate: number;       // bpm
  steps: number;
  distanceKm: number;
  calories: number;
  gps: GpsPoint;
}

export type ActivityMode = 'rest' | 'walk' | 'workout' | 'dog_walk';

export interface ActivitySession {
  id: string;
  mode: ActivityMode;
  startedAt: number;
  durationSeconds: number;
  samples: ActivitySample[];
  loveTokensEarned: number;
  settled: boolean;
}

// ---- Reward Conditions (Drag-and-Drop canvas) ----

export type ConditionOperator = '>=' | '<=' | '==' | '>';
export type ConditionMetric =
  | 'duration_minutes'
  | 'heart_rate_avg'
  | 'distance_km'
  | 'steps'
  | 'calories';

export interface RewardCondition {
  id: string;
  metric: ConditionMetric;
  operator: ConditionOperator;
  threshold: number;
  reward: number; // LOVE tokens to mint
  label: string;
  color: string;
  icon: string;
}

// ---- LOVE Token / Smart Contract ----

export interface TokenMintEvent {
  id: string;
  sessionId: string;
  recipient: string;
  amount: number;
  triggerCondition: string;
  txSignature: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface TokenBalance {
  address: string;
  balance: number;
  totalEarned: number;
  totalSessions: number;
}

// ---- AI Agent (mock OpenClaw) ----

export type RiskLevel = 'safe' | 'caution' | 'warning' | 'danger';

export interface SafetyInfo {
  id: string;
  area: string;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  source: string;
  fetchedAt: number;
}

export interface AgentThought {
  id: string;
  timestamp: number;
  step: 'observe' | 'think' | 'act' | 'reflect';
  content: string;
  toolUsed?: string;
  result?: string;
}

export interface AgentReport {
  sessionId: string;
  thoughts: AgentThought[];
  safetyInfo: SafetyInfo[];
  recommendation: string;
  riskScore: number; // 0-100
  generatedAt: number;
}

// ---- App state ----

export type AppTab = 'dashboard' | 'canvas' | 'agent' | 'contract';
