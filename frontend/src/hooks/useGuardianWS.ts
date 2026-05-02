import { useEffect, useRef, useCallback, useState } from 'react';
import type { WSMessage, ThreatEvent, EvacuationSimulation, GuardianStatus } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001';
const RECONNECT_DELAY_MS = 3000;

interface UseGuardianWSOptions {
  onThreat?: (event: ThreatEvent) => void;
  onEvacuation?: (sim: EvacuationSimulation) => void;
  onStatus?: (status: GuardianStatus) => void;
}

export function useGuardianWS(options: UseGuardianWSOptions = {}) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as WSMessage;
        switch (msg.type) {
          case 'threat_detected':
            optionsRef.current.onThreat?.(msg.payload as ThreatEvent);
            break;
          case 'evacuation_triggered':
            optionsRef.current.onEvacuation?.(msg.payload as EvacuationSimulation);
            break;
          case 'status_update':
          case 'guardian_started':
          case 'guardian_stopped':
            optionsRef.current.onStatus?.(msg.payload as GuardianStatus);
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    };

    socket.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    socket.onerror = () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return { connected };
}
