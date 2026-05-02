import type {
  ActivitySample,
  ActivityMode,
  ActivitySession,
  GpsPoint,
  AgentThought,
  SafetyInfo,
  AgentReport,
  TokenMintEvent,
  TokenBalance,
  RewardCondition,
} from './types';

// ---- GPS path simulation (Tokyo Shibuya area) ----
const BASE_LAT = 35.6762;
const BASE_LNG = 139.6503;

function genGps(step: number, mode: ActivityMode): GpsPoint {
  const speed = mode === 'dog_walk' ? 0.0002 : mode === 'workout' ? 0.0006 : 0.0004;
  return {
    lat: BASE_LAT + Math.sin(step * 0.1) * speed * step,
    lng: BASE_LNG + Math.cos(step * 0.08) * speed * step,
    timestamp: Date.now() - (60 - step) * 1000,
  };
}

// ---- Heart rate simulation ----
function genHeartRate(step: number, mode: ActivityMode): number {
  const base = mode === 'rest' ? 65 : mode === 'walk' ? 90 : mode === 'dog_walk' ? 88 : 130;
  const noise = (Math.random() - 0.5) * 10;
  const wave = Math.sin(step * 0.3) * 8;
  return Math.round(Math.max(55, Math.min(185, base + noise + wave)));
}

export function generateSession(mode: ActivityMode, durationMinutes: number): ActivitySession {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const samples: ActivitySample[] = [];
  const totalSamples = Math.min(durationMinutes * 2, 60);

  let totalSteps = 0;
  let totalDist = 0;

  for (let i = 0; i < totalSamples; i++) {
    const stepIncrement = mode === 'rest' ? 0 : Math.round(5 + Math.random() * 15);
    const distIncrement = mode === 'rest' ? 0 : 0.005 + Math.random() * 0.01;
    totalSteps += stepIncrement;
    totalDist += distIncrement;

    samples.push({
      timestamp: Date.now() - (totalSamples - i) * 30000,
      heartRate: genHeartRate(i, mode),
      steps: Math.round(totalSteps),
      distanceKm: parseFloat(totalDist.toFixed(3)),
      calories: Math.round(totalDist * 60 + totalSteps * 0.04),
      gps: genGps(i, mode),
    });
  }

  return {
    id,
    mode,
    startedAt: Date.now() - durationMinutes * 60 * 1000,
    durationSeconds: durationMinutes * 60,
    samples,
    loveTokensEarned: 0,
    settled: false,
  };
}

// ---- Reward evaluation ----
export function evaluateConditions(
  session: ActivitySession,
  conditions: RewardCondition[],
): { condition: RewardCondition; met: boolean }[] {
  const last = session.samples[session.samples.length - 1];
  if (!last) return conditions.map((c) => ({ condition: c, met: false }));

  const avgHr =
    session.samples.reduce((s, x) => s + x.heartRate, 0) / session.samples.length;

  const getValue = (metric: RewardCondition['metric']): number => {
    switch (metric) {
      case 'duration_minutes': return session.durationSeconds / 60;
      case 'heart_rate_avg': return Math.round(avgHr);
      case 'distance_km': return last.distanceKm;
      case 'steps': return last.steps;
      case 'calories': return last.calories;
    }
  };

  return conditions.map((c) => {
    const val = getValue(c.metric);
    let met = false;
    switch (c.operator) {
      case '>=': met = val >= c.threshold; break;
      case '<=': met = val <= c.threshold; break;
      case '>':  met = val > c.threshold;  break;
      case '==': met = val === c.threshold; break;
    }
    return { condition: c, met };
  });
}

// ---- Mock AI Agent (OpenClaw-style) ----
const SAFETY_DB: SafetyInfo[] = [
  {
    id: 'safe_001',
    area: 'Shibuya, Tokyo',
    riskLevel: 'safe',
    title: 'Low Risk Area',
    description: 'Well-lit streets with high foot traffic. Suitable for evening walks.',
    source: 'TokyoSafetyNet API',
    fetchedAt: Date.now(),
  },
  {
    id: 'safe_002',
    area: 'Shinjuku, Tokyo',
    riskLevel: 'caution',
    title: 'Moderate Crowd Density',
    description: 'High crowd levels detected near entertainment district. Pet-friendly areas available on east side.',
    source: 'CrowdSense API',
    fetchedAt: Date.now(),
  },
  {
    id: 'safe_003',
    area: 'Harajuku, Tokyo',
    riskLevel: 'safe',
    title: 'Dog-Friendly Zone',
    description: 'Designated dog-walking paths available. Water stations at intervals.',
    source: 'PetSafe City API',
    fetchedAt: Date.now(),
  },
  {
    id: 'safe_004',
    area: 'Roppongi, Tokyo',
    riskLevel: 'warning',
    title: 'Night Caution Advisory',
    description: 'Increased activity levels at night. Recommended to walk in groups after 22:00.',
    source: 'TokyoSafetyNet API',
    fetchedAt: Date.now(),
  },
];

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function runAgentAnalysis(
  session: ActivitySession,
  onThought: (t: AgentThought) => void,
): Promise<AgentReport> {
  const thoughts: AgentThought[] = [];
  const addThought = (t: Omit<AgentThought, 'id' | 'timestamp'>) => {
    const thought: AgentThought = {
      ...t,
      id: `th_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    thoughts.push(thought);
    onThought(thought);
    return thought;
  };

  // Step 1: Observe
  addThought({
    step: 'observe',
    content: `Session detected: mode=${session.mode}, duration=${Math.round(session.durationSeconds / 60)}min, samples=${session.samples.length}`,
    toolUsed: 'session_reader',
    result: `GPS trail has ${session.samples.length} waypoints. Last position: ${session.samples[session.samples.length - 1]?.gps.lat.toFixed(4)}, ${session.samples[session.samples.length - 1]?.gps.lng.toFixed(4)}`,
  });
  await sleep(600);

  // Step 2: Think - fetch safety info
  addThought({
    step: 'think',
    content: 'Querying external safety database for current area risk assessment...',
    toolUsed: 'fetch_safety_info',
    result: 'Initiating HTTP call to TokyoSafetyNet, CrowdSense, and PetSafe City APIs',
  });
  await sleep(800);

  const safetyInfo = SAFETY_DB.slice(0, 2 + Math.floor(Math.random() * 2));

  addThought({
    step: 'think',
    content: `Retrieved ${safetyInfo.length} safety records. Analyzing risk levels...`,
    toolUsed: 'risk_analyzer',
    result: safetyInfo.map((s) => `[${s.riskLevel.toUpperCase()}] ${s.area}: ${s.title}`).join(' | '),
  });
  await sleep(500);

  // Step 3: Act - compute heart rate analysis
  const avgHr = Math.round(
    session.samples.reduce((s, x) => s + x.heartRate, 0) / session.samples.length,
  );
  const maxHr = Math.max(...session.samples.map((x) => x.heartRate));

  addThought({
    step: 'act',
    content: `Running biometric analysis: avg_hr=${avgHr}bpm, max_hr=${maxHr}bpm`,
    toolUsed: 'biometric_analyzer',
    result:
      maxHr > 160
        ? 'High intensity detected. Ensure proper hydration.'
        : avgHr > 100
        ? 'Moderate intensity. Cardiovascular benefit confirmed.'
        : 'Low intensity session. Good for recovery.',
  });
  await sleep(700);

  // Step 4: Act - token eligibility
  const last = session.samples[session.samples.length - 1];
  const eligible = session.durationSeconds >= 1800 || avgHr > 100 || (last?.steps ?? 0) > 3000;

  addThought({
    step: 'act',
    content: eligible
      ? 'LOVE token mint criteria met. Preparing on-chain settlement...'
      : 'Token criteria not yet met. Continuing to monitor activity...',
    toolUsed: 'contract_interface',
    result: eligible
      ? `Eligible to mint. Solana program invocation queued.`
      : `Threshold not reached. Required: 30min OR avg_hr>100 OR steps>3000`,
  });
  await sleep(600);

  // Step 5: Reflect
  const riskScore = safetyInfo.some((s) => s.riskLevel === 'danger')
    ? 85
    : safetyInfo.some((s) => s.riskLevel === 'warning')
    ? 45
    : safetyInfo.some((s) => s.riskLevel === 'caution')
    ? 25
    : 10;

  const recommendation =
    riskScore > 70
      ? 'High-risk environment detected. Recommend ending session and moving to a safe zone.'
      : riskScore > 40
      ? 'Moderate risk. Stay in well-lit areas and keep activity under 60 minutes.'
      : 'Environment is safe. Continue activity and enjoy earning LOVE tokens!';

  addThought({
    step: 'reflect',
    content: `Analysis complete. Risk score: ${riskScore}/100. ${recommendation}`,
    toolUsed: undefined,
    result: `Report generated with ${thoughts.length} reasoning steps.`,
  });

  return {
    sessionId: session.id,
    thoughts,
    safetyInfo,
    recommendation,
    riskScore,
    generatedAt: Date.now(),
  };
}

// ---- Mock Smart Contract (Solana-style) ----
let mockBalance: TokenBalance = {
  address: 'LoVE7xMwCQdM9RxGpJEy3PoKe5zQqBfMn3d8sUzXt2',
  balance: 0,
  totalEarned: 0,
  totalSessions: 0,
};

export function getTokenBalance(): TokenBalance {
  return { ...mockBalance };
}

export async function mintLoveTokens(
  sessionId: string,
  amount: number,
  conditionLabel: string,
  onProgress: (event: TokenMintEvent) => void,
): Promise<TokenMintEvent> {
  const event: TokenMintEvent = {
    id: `mint_${Date.now()}`,
    sessionId,
    recipient: mockBalance.address,
    amount,
    triggerCondition: conditionLabel,
    txSignature: `${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`,
    timestamp: Date.now(),
    status: 'pending',
  };

  onProgress(event);
  await sleep(1200);

  event.status = 'confirmed';
  mockBalance = {
    ...mockBalance,
    balance: mockBalance.balance + amount,
    totalEarned: mockBalance.totalEarned + amount,
    totalSessions: mockBalance.totalSessions + 1,
  };

  onProgress({ ...event });
  return event;
}
