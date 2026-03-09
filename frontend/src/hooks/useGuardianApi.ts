const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface StartConfig {
  walletAddress: string;
  safetyWalletAddress: string;
  chainId: number;
  alertThreshold: string;
  autoEvacuate: boolean;
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const guardianApi = {
  start: (config: StartConfig) =>
    apiFetch('/api/guardian/start', { method: 'POST', body: JSON.stringify(config) }),

  stop: () =>
    apiFetch('/api/guardian/stop', { method: 'POST' }),

  status: () =>
    apiFetch('/api/status'),

  threats: () =>
    apiFetch('/api/threats'),

  evacuations: () =>
    apiFetch('/api/evacuations'),

  simulateAttack: (type: 'approval' | 'swap' | 'transfer') =>
    apiFetch('/api/demo/simulate-attack', { method: 'POST', body: JSON.stringify({ type }) }),
};
