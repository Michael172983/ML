import { useState, useEffect, useRef } from 'react';
import {
  Heart, Footprints, Flame, MapPin, Play, Square, Dog, Dumbbell, PersonStanding, Moon,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ActivitySession, ActivityMode, ActivitySample } from './types';
import { generateSession } from './simulation';

interface Props {
  onSessionComplete: (session: ActivitySession) => void;
}

const MODES: { value: ActivityMode; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'rest',      label: 'Rest',      icon: Moon,            color: 'text-blue-400'   },
  { value: 'walk',      label: 'Walk',      icon: PersonStanding,  color: 'text-green-400'  },
  { value: 'workout',   label: 'Workout',   icon: Dumbbell,        color: 'text-orange-400' },
  { value: 'dog_walk',  label: 'Dog Walk',  icon: Dog,             color: 'text-pink-400'   },
];

function pulse(value: number, max: number): string {
  const pct = Math.min(value / max, 1);
  if (pct > 0.8) return 'text-red-400';
  if (pct > 0.6) return 'text-orange-400';
  if (pct > 0.4) return 'text-yellow-400';
  return 'text-green-400';
}

export function ActivityDashboard({ onSessionComplete }: Props) {
  const [mode, setMode] = useState<ActivityMode>('walk');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [samples, setSamples] = useState<ActivitySample[]>([]);
  const [session, setSession] = useState<ActivitySession | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live simulation tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // Generate samples every 5 seconds
  useEffect(() => {
    if (!running || elapsed % 5 !== 0) return;
    const sess = generateSession(mode, Math.max(1, elapsed / 60));
    setSamples(sess.samples.slice(-20));
    setSession(sess);
  }, [elapsed, running, mode]);

  function handleStart() {
    setElapsed(0);
    setSamples([]);
    setSession(null);
    setRunning(true);
  }

  function handleStop() {
    setRunning(false);
    const finalSession = generateSession(mode, Math.max(1, elapsed / 60));
    finalSession.durationSeconds = elapsed;
    setSession(finalSession);
    onSessionComplete(finalSession);
  }

  const lastSample = samples[samples.length - 1];
  const avgHr = samples.length
    ? Math.round(samples.reduce((s, x) => s + x.heartRate, 0) / samples.length)
    : 0;

  const chartData = samples.map((s, i) => ({
    t: i,
    hr: s.heartRate,
    steps: Math.round(s.steps / 10),
  }));

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="grid grid-cols-4 gap-2">
        {MODES.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => !running && setMode(value)}
            disabled={running}
            className={`flex flex-col items-center gap-1 rounded-lg p-3 border text-xs font-medium transition-all ${
              mode === value
                ? 'border-pink-500 bg-pink-900/20 text-pink-300'
                : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
            } ${running ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon size={18} className={mode === value ? 'text-pink-400' : color} />
            {label}
          </button>
        ))}
      </div>

      {/* Timer & Controls */}
      <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-900/60 p-4">
        <div>
          <div className="text-4xl font-bold font-mono text-white tracking-widest">
            {formatElapsed(elapsed)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {running ? 'Session active…' : session ? 'Session complete' : 'Ready to start'}
          </div>
        </div>
        <button
          onClick={running ? handleStop : handleStart}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${
            running
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-pink-600 hover:bg-pink-700 text-white'
          }`}
        >
          {running ? <><Square size={14} /> Stop</> : <><Play size={14} /> Start</>}
        </button>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Heart Rate',
            value: lastSample?.heartRate ?? avgHr,
            unit: 'bpm',
            icon: Heart,
            color: pulse(lastSample?.heartRate ?? 0, 180),
            glow: 'glow-red',
          },
          {
            label: 'Steps',
            value: lastSample?.steps ?? 0,
            unit: '',
            icon: Footprints,
            color: 'text-blue-400',
            glow: '',
          },
          {
            label: 'Distance',
            value: lastSample ? lastSample.distanceKm.toFixed(2) : '0.00',
            unit: 'km',
            icon: MapPin,
            color: 'text-green-400',
            glow: '',
          },
          {
            label: 'Calories',
            value: lastSample?.calories ?? 0,
            unit: 'kcal',
            icon: Flame,
            color: 'text-orange-400',
            glow: '',
          },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gray-700 bg-gray-900/60 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} className="text-gray-500" />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <div className={`text-lg font-bold ${color}`}>
              {value}
              <span className="text-xs ml-1 text-gray-600">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Heart Rate Chart */}
      {chartData.length > 2 && (
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-300">Heart Rate (bpm)</span>
            <span className="text-xs text-gray-500">Avg: {avgHr} bpm</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#6b7280' }} />
              <YAxis domain={[50, 180]} tick={{ fontSize: 9, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
                labelFormatter={() => ''}
              />
              <Area
                type="monotone"
                dataKey="hr"
                stroke="#ec4899"
                strokeWidth={2}
                fill="rgba(236, 72, 153, 0.15)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* GPS mini map */}
      {samples.length > 0 && (
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-300">GPS Trail</span>
            <span className="text-xs text-gray-500">
              {lastSample?.gps.lat.toFixed(4)}, {lastSample?.gps.lng.toFixed(4)}
            </span>
          </div>
          <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ height: 100 }}>
            <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Grid lines */}
              {[1, 2, 3, 4].map((i) => (
                <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={100} stroke="#1f2937" strokeWidth={0.5} />
              ))}
              {[1, 2, 3].map((i) => (
                <line key={`h${i}`} x1={0} y1={i * 25} x2={300} y2={i * 25} stroke="#1f2937" strokeWidth={0.5} />
              ))}
              {/* Path */}
              <polyline
                points={samples.map((s, i) => {
                  const x = (i / (samples.length - 1)) * 280 + 10;
                  const latNorm = ((s.gps.lat - BASE_LAT_MIN) / LAT_RANGE) * 80 + 10;
                  const y = 100 - latNorm;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#ec4899"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Current position dot */}
              {(() => {
                const last = samples[samples.length - 1];
                const x = 280 + 10;
                const latNorm = ((last.gps.lat - BASE_LAT_MIN) / LAT_RANGE) * 80 + 10;
                const y = 100 - latNorm;
                return (
                  <circle cx={x} cy={y} r={4} fill="#ec4899">
                    <animate attributeName="r" values="4;7;4" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                );
              })()}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

const BASE_LAT_MIN = 35.675;
const LAT_RANGE = 0.005;
