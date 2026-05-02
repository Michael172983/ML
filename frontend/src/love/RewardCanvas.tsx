import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Coins, GripVertical, Zap, Check, X } from 'lucide-react';
import type { RewardCondition, ConditionMetric, ActivitySession } from './types';
import { evaluateConditions } from './simulation';

const METRIC_OPTIONS: { value: ConditionMetric; label: string; unit: string; defaultThreshold: number }[] = [
  { value: 'duration_minutes', label: 'Duration',     unit: 'min',  defaultThreshold: 30  },
  { value: 'heart_rate_avg',   label: 'Avg HR',       unit: 'bpm',  defaultThreshold: 100 },
  { value: 'distance_km',      label: 'Distance',     unit: 'km',   defaultThreshold: 1.0 },
  { value: 'steps',            label: 'Steps',        unit: '',     defaultThreshold: 5000 },
  { value: 'calories',         label: 'Calories',     unit: 'kcal', defaultThreshold: 200 },
];

const PALETTE_COLORS = [
  'border-pink-500 bg-pink-900/20 text-pink-300',
  'border-purple-500 bg-purple-900/20 text-purple-300',
  'border-blue-500 bg-blue-900/20 text-blue-300',
  'border-green-500 bg-green-900/20 text-green-300',
  'border-orange-500 bg-orange-900/20 text-orange-300',
];

const ICONS = ['💓', '🐕', '🏃', '🔥', '⚡', '💎', '🌟', '🎯'];

interface DraggableConditionProps {
  condition: RewardCondition;
  result?: { met: boolean } | null;
  onRemove: () => void;
}

function DraggableCondition({ condition, result, onRemove }: DraggableConditionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: condition.id,
  });
  const style = { transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.4 : 1 };
  const colorClass = condition.color;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${colorClass} cursor-grab active:cursor-grabbing select-none`}
    >
      <span {...listeners} {...attributes} className="touch-none">
        <GripVertical size={12} className="text-gray-600" />
      </span>
      <span className="text-base leading-none">{condition.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{condition.label}</div>
        <div className="text-gray-500 mt-0.5">
          {METRIC_OPTIONS.find((m) => m.value === condition.metric)?.label} {condition.operator} {condition.threshold}
          {METRIC_OPTIONS.find((m) => m.value === condition.metric)?.unit} → {condition.reward} LOVE
        </div>
      </div>
      {result && (
        <span className={`shrink-0 rounded-full p-0.5 ${result.met ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-600'}`}>
          {result.met ? <Check size={10} /> : <X size={10} />}
        </span>
      )}
      <button onClick={onRemove} className="text-gray-600 hover:text-red-400 transition-colors shrink-0">
        <Trash2 size={11} />
      </button>
    </div>
  );
}

function ConditionOverlay({ condition }: { condition: RewardCondition }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${condition.color} shadow-2xl opacity-90`}>
      <GripVertical size={12} className="text-gray-600" />
      <span>{condition.icon}</span>
      <span className="font-semibold">{condition.label}</span>
    </div>
  );
}

interface DroppableZoneProps {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  isOver?: boolean;
}

function DroppableZone({ id, title, subtitle, children, isOver }: DroppableZoneProps) {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({ id });
  const over = isOver || dndIsOver;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed p-4 transition-all min-h-[140px] ${
        over
          ? 'border-pink-500 bg-pink-900/10'
          : 'border-gray-700 bg-gray-900/40'
      }`}
    >
      <div className="mb-3">
        <div className="text-xs font-bold text-gray-300">{title}</div>
        <div className="text-xs text-gray-600">{subtitle}</div>
      </div>
      <div className="space-y-2">
        {children}
        {over && (
          <div className="text-xs text-pink-400 text-center py-2 animate-pulse">Drop here</div>
        )}
      </div>
    </div>
  );
}

interface Props {
  conditions: RewardCondition[];
  setConditions: (c: RewardCondition[]) => void;
  session: ActivitySession | null;
  onMint: (conditions: RewardCondition[]) => void;
  minting: boolean;
}

export function RewardCanvas({ conditions, setConditions, session, onMint, minting }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    metric: ConditionMetric;
    operator: RewardCondition['operator'];
    threshold: number;
    reward: number;
    icon: string;
  }>({
    metric: 'duration_minutes',
    operator: '>=',
    threshold: 30,
    reward: 10,
    icon: '💓',
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [stagedConditions, setStagedConditions] = useState<string[]>([]);

  const evalResults = session
    ? evaluateConditions(session, conditions)
    : null;

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = active.id as string;

    if (over.id === 'active-zone') {
      setActiveConditions((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setStagedConditions((prev) => prev.filter((x) => x !== id));
    } else if (over.id === 'staged-zone') {
      setStagedConditions((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setActiveConditions((prev) => prev.filter((x) => x !== id));
    } else if (over.id === 'palette-zone') {
      setActiveConditions((prev) => prev.filter((x) => x !== id));
      setStagedConditions((prev) => prev.filter((x) => x !== id));
    }
  }, []);

  function addCondition() {
    const metricMeta = METRIC_OPTIONS.find((m) => m.value === form.metric)!;
    const colorIdx = conditions.length % PALETTE_COLORS.length;
    const newCond: RewardCondition = {
      id: `cond_${Date.now()}`,
      metric: form.metric,
      operator: form.operator,
      threshold: form.threshold,
      reward: form.reward,
      label: `${metricMeta.label} ${form.operator} ${form.threshold}${metricMeta.unit}`,
      color: PALETTE_COLORS[colorIdx],
      icon: form.icon,
    };
    setConditions([...conditions, newCond]);
    setForm((f) => ({ ...f, threshold: metricMeta.defaultThreshold, reward: 10 }));
  }

  function removeCondition(id: string) {
    setConditions(conditions.filter((c) => c.id !== id));
    setActiveConditions((prev) => prev.filter((x) => x !== id));
    setStagedConditions((prev) => prev.filter((x) => x !== id));
  }

  const paletteConditions = conditions.filter(
    (c) => !activeConditions.includes(c.id) && !stagedConditions.includes(c.id),
  );
  const activeConds = conditions.filter((c) => activeConditions.includes(c.id));
  const stagedConds = conditions.filter((c) => stagedConditions.includes(c.id));
  const activeCondObj = conditions.find((c) => c.id === activeId);

  const metActiveConds = evalResults
    ? activeConds.filter((c) => evalResults.find((r) => r.condition.id === c.id)?.met)
    : [];
  const totalReward = metActiveConds.reduce((s, c) => s + c.reward, 0);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Add condition form */}
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={14} className="text-pink-400" />
            <span className="text-xs font-bold text-gray-200">Add Reward Condition</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Metric</label>
              <select
                value={form.metric}
                onChange={(e) => {
                  const m = e.target.value as ConditionMetric;
                  const meta = METRIC_OPTIONS.find((x) => x.value === m)!;
                  setForm((f) => ({ ...f, metric: m, threshold: meta.defaultThreshold }));
                }}
                className="w-full text-xs bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
              >
                {METRIC_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label} ({m.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Operator</label>
              <select
                value={form.operator}
                onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value as RewardCondition['operator'] }))}
                className="w-full text-xs bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
              >
                {(['>=', '>', '<=', '=='] as const).map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Threshold</label>
              <input
                type="number"
                value={form.threshold}
                onChange={(e) => setForm((f) => ({ ...f, threshold: parseFloat(e.target.value) || 0 }))}
                className="w-full text-xs bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">LOVE Reward</label>
              <input
                type="number"
                value={form.reward}
                onChange={(e) => setForm((f) => ({ ...f, reward: parseInt(e.target.value) || 1 }))}
                className="w-full text-xs bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">Icon:</span>
            <div className="flex gap-1">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`text-base rounded px-1 py-0.5 transition-all ${
                    form.icon === icon ? 'bg-pink-900/40 ring-1 ring-pink-500' : 'hover:bg-gray-800'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={addCondition}
            className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            + Add Condition
          </button>
        </div>

        {/* Drag-and-Drop Canvas */}
        <div className="grid grid-cols-1 gap-3">
          {/* Palette */}
          <DroppableZone id="palette-zone" title="📦 Condition Palette" subtitle="Drag conditions to zones below">
            {paletteConditions.length === 0 ? (
              <div className="text-xs text-gray-600 text-center py-3">No conditions yet — add some above</div>
            ) : (
              paletteConditions.map((c) => (
                <DraggableCondition
                  key={c.id}
                  condition={c}
                  result={null}
                  onRemove={() => removeCondition(c.id)}
                />
              ))
            )}
          </DroppableZone>

          {/* Active Zone */}
          <DroppableZone
            id="active-zone"
            title="⚡ Active Reward Zone"
            subtitle="Conditions in this zone will trigger LOVE token minting"
          >
            {activeConds.length === 0 ? (
              <div className="text-xs text-gray-600 text-center py-3">Drop conditions here to activate</div>
            ) : (
              activeConds.map((c) => {
                const result = evalResults?.find((r) => r.condition.id === c.id) ?? null;
                return (
                  <DraggableCondition
                    key={c.id}
                    condition={c}
                    result={result}
                    onRemove={() => removeCondition(c.id)}
                  />
                );
              })
            )}
          </DroppableZone>

          {/* Staged Zone */}
          <DroppableZone
            id="staged-zone"
            title="🔮 Staged (Paused)"
            subtitle="Conditions on hold — not evaluating"
          >
            {stagedConds.length === 0 ? (
              <div className="text-xs text-gray-600 text-center py-3">Drag here to pause conditions</div>
            ) : (
              stagedConds.map((c) => (
                <DraggableCondition
                  key={c.id}
                  condition={c}
                  result={null}
                  onRemove={() => removeCondition(c.id)}
                />
              ))
            )}
          </DroppableZone>
        </div>

        {/* Reward Summary & Mint Button */}
        {activeConds.length > 0 && (
          <div className="rounded-xl border border-pink-800 bg-pink-900/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-pink-400" />
                <span className="text-xs font-bold text-pink-300">Reward Summary</span>
              </div>
              <span className="text-xs text-gray-500">
                {metActiveConds.length}/{activeConds.length} conditions met
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-pink-400">{totalReward} LOVE</div>
                <div className="text-xs text-gray-500 mt-0.5">tokens to mint on Solana</div>
              </div>
              <button
                onClick={() => onMint(metActiveConds)}
                disabled={minting || metActiveConds.length === 0 || !session}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  minting || metActiveConds.length === 0 || !session
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                }`}
              >
                <Zap size={12} />
                {minting ? 'Minting…' : 'Mint LOVE Tokens'}
              </button>
            </div>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeId && activeCondObj ? <ConditionOverlay condition={activeCondObj} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
