import { useState, useEffect, useMemo } from 'react'
import { Activity, Heart, Plus, Trash2, Save, Star, Zap, Target, TrendingUp, ChevronDown, ChevronUp, RefreshCw, BarChart3, Calendar, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtocolEntry {
  id: string
  date: string
  protocolId: string
  adherence: 1 | 2 | 3 | 4 | 5
  sideEffects: string
  observations: string
  energyEffect: -2 | -1 | 0 | 1 | 2
  moodEffect: -2 | -1 | 0 | 1 | 2
  notes: string
}

interface Protocol {
  id: string
  name: string
  category: 'supplement' | 'diet' | 'exercise' | 'sleep' | 'stress' | 'biohack' | 'medication' | 'therapy' | 'other'
  description: string
  frequency: 'daily' | 'weekly' | 'as-needed' | 'cycling'
  startDate: string
  active: boolean
  goal: string
  expectedDuration: number
  tags: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'health_protocol_log'

const CATEGORIES: Protocol['category'][] = [
  'supplement', 'diet', 'exercise', 'sleep', 'stress', 'biohack', 'medication', 'therapy', 'other',
]

const CAT_COLOR: Record<Protocol['category'], string> = {
  supplement: '#f59e0b',
  diet:       '#22c55e',
  exercise:   '#ef4444',
  sleep:      '#6366f1',
  stress:     '#8b5cf6',
  biohack:    '#06b6d4',
  medication: '#e879f9',
  therapy:    '#f97316',
  other:      '#94a3b8',
}

const FREQ_LABELS: Record<Protocol['frequency'], string> = {
  daily:     'Daily',
  weekly:    'Weekly',
  'as-needed': 'As needed',
  cycling:   'Cycling',
}

const EFFECT_LABELS: Record<number, string> = {
  '-2': 'Much worse',
  '-1': 'Slightly worse',
  '0':  'Neutral',
  '1':  'Slightly better',
  '2':  'Much better',
}

const EFFECT_COLORS: Record<number, string> = {
  '-2': '#ef4444',
  '-1': '#f97316',
  '0':  '#94a3b8',
  '1':  '#22c55e',
  '2':  '#10b981',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avg(nums: number[]): number | null {
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EffectSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string
  value: -2 | -1 | 0 | 1 | 2
  onChange: (v: -2 | -1 | 0 | 1 | 2) => void
  color: string
}) {
  const steps: (-2 | -1 | 0 | 1 | 2)[] = [-2, -1, 0, 1, 2]
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-medium" style={{ color: EFFECT_COLORS[value] }}>
          {EFFECT_LABELS[value]}
        </span>
      </div>
      <div className="flex gap-1">
        {steps.map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="flex-1 py-1.5 rounded text-xs font-bold transition-all"
            style={{
              background: value === s ? EFFECT_COLORS[s] + '33' : '#1e293b',
              border: `1px solid ${value === s ? EFFECT_COLORS[s] : '#334155'}`,
              color: value === s ? EFFECT_COLORS[s] : '#475569',
            }}
          >
            {s > 0 ? `+${s}` : s}
          </button>
        ))}
      </div>
    </div>
  )
}

function AdherencePips({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void
}) {
  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4, 5] as (1 | 2 | 3 | 4 | 5)[]).map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="flex-1 py-1.5 rounded text-xs font-bold transition-all"
          style={{
            background: n <= value ? '#6366f1' + '33' : '#1e293b',
            border: `1px solid ${n <= value ? '#6366f1' : '#334155'}`,
            color: n <= value ? '#818cf8' : '#475569',
          }}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function TrendBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, ((value + max) / (max * 2)) * 100)) : 50
  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'protocols' | 'log' | 'insights' | 'calendar'

export default function HealthProtocolLog() {
  const { toastSuccess } = useToast()

  // ── State ────────────────────────────────────────────────────────────────
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [entries, setEntries] = useState<ProtocolEntry[]>([])
  const [tab, setTab] = useState<Tab>('protocols')
  const [showAddProtocol, setShowAddProtocol] = useState(false)
  const [calendarProtocolId, setCalendarProtocolId] = useState<string>('')

  // Protocol form
  const emptyProto: Omit<Protocol, 'id'> = {
    name: '',
    category: 'supplement',
    description: '',
    frequency: 'daily',
    startDate: todayStr(),
    active: true,
    goal: '',
    expectedDuration: 30,
    tags: [],
  }
  const [protoForm, setProtoForm] = useState<Omit<Protocol, 'id'>>(emptyProto)
  const [tagsInput, setTagsInput] = useState('')

  // Log drafts: keyed by protocolId
  const [logDrafts, setLogDrafts] = useState<
    Record<string, {
      adherence: 1 | 2 | 3 | 4 | 5
      energyEffect: -2 | -1 | 0 | 1 | 2
      moodEffect: -2 | -1 | 0 | 1 | 2
      sideEffects: string
      observations: string
      notes: string
      date: string
    }>
  >({})

  // ── Persistence ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setProtocols(raw.protocols || [])
      setEntries(raw.entries || [])
    } catch { /**/ }
  }, [])

  function persist(p: Protocol[], e: ProtocolEntry[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ protocols: p, entries: e }))
    setProtocols(p)
    setEntries(e)
  }

  // ── Protocol CRUD ────────────────────────────────────────────────────────
  function addProtocol() {
    if (!protoForm.name.trim()) return
    const proto: Protocol = {
      id: Date.now().toString(),
      ...protoForm,
      tags: tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
    }
    persist([proto, ...protocols], entries)
    setProtoForm(emptyProto)
    setTagsInput('')
    setShowAddProtocol(false)
    toastSuccess(`Protocol "${proto.name}" added`)
  }

  function toggleActive(id: string) {
    persist(
      protocols.map(p => (p.id === id ? { ...p, active: !p.active } : p)),
      entries,
    )
  }

  function deleteProtocol(id: string) {
    persist(
      protocols.filter(p => p.id !== id),
      entries.filter(e => e.protocolId !== id),
    )
  }

  // ── Log ─────────────────────────────────────────────────────────────────
  function initDraft(protocolId: string) {
    if (logDrafts[protocolId]) return
    setLogDrafts(d => ({
      ...d,
      [protocolId]: {
        adherence: 3,
        energyEffect: 0,
        moodEffect: 0,
        sideEffects: '',
        observations: '',
        notes: '',
        date: todayStr(),
      },
    }))
  }

  function saveDraft(protocolId: string) {
    const draft = logDrafts[protocolId]
    if (!draft) return
    const entry: ProtocolEntry = {
      id: Date.now().toString(),
      protocolId,
      date: draft.date,
      adherence: draft.adherence,
      energyEffect: draft.energyEffect,
      moodEffect: draft.moodEffect,
      sideEffects: draft.sideEffects,
      observations: draft.observations,
      notes: draft.notes,
    }
    persist(protocols, [entry, ...entries])
    setLogDrafts(d => {
      const copy = { ...d }
      delete copy[protocolId]
      return copy
    })
    toastSuccess('Protocol logged! 💊')
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const activeProtocols = protocols.filter(p => p.active)

  const stats = useMemo(() => {
    const totalEntries = entries.length
    const activeCount = activeProtocols.length

    const adherenceByProtocol: Record<string, number[]> = {}
    entries.forEach(e => {
      if (!adherenceByProtocol[e.protocolId]) adherenceByProtocol[e.protocolId] = []
      adherenceByProtocol[e.protocolId].push(e.adherence)
    })

    let bestProtocol = ''
    let bestAdh = 0
    Object.entries(adherenceByProtocol).forEach(([pid, vals]) => {
      const a = avg(vals) ?? 0
      if (a > bestAdh) {
        bestAdh = a
        bestProtocol = pid
      }
    })

    const proto = protocols.find(p => p.id === bestProtocol)

    const allEnergy = entries.map(e => e.energyEffect)
    const avgEnergy = avg(allEnergy)

    return {
      activeCount,
      totalEntries,
      bestProtocolName: proto?.name ?? '—',
      avgEnergy: avgEnergy !== null ? avgEnergy.toFixed(1) : '—',
    }
  }, [protocols, entries, activeProtocols])

  const insights = useMemo(() => {
    return protocols
      .map(p => {
        const pEntries = entries.filter(e => e.protocolId === p.id)
        if (pEntries.length < 5) return null
        const adhArr = pEntries.map(e => e.adherence)
        const energyArr = pEntries.map(e => e.energyEffect)
        const moodArr = pEntries.map(e => e.moodEffect)
        return {
          protocol: p,
          count: pEntries.length,
          avgAdherence: avg(adhArr) ?? 0,
          avgEnergy: avg(energyArr) ?? 0,
          avgMood: avg(moodArr) ?? 0,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [protocols, entries])

  // Calendar: 21-day grid for selected protocol
  const calendarDays = useMemo(() => {
    const days: { date: string; adherence: number | null }[] = []
    const today = new Date()
    for (let i = 20; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = entries.find(e => e.protocolId === calendarProtocolId && e.date === dateStr)
      days.push({ date: dateStr, adherence: entry ? entry.adherence : null })
    }
    return days
  }, [calendarProtocolId, entries])

  // ── Calendar protocol default ────────────────────────────────────────────
  useEffect(() => {
    if (!calendarProtocolId && protocols.length > 0) {
      setCalendarProtocolId(protocols[0].id)
    }
  }, [protocols, calendarProtocolId])

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'protocols', label: 'Protocols', icon: <Target className="w-4 h-4" /> },
    { key: 'log', label: 'Log Today', icon: <Save className="w-4 h-4" /> },
    { key: 'insights', label: 'Insights', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Activity className="w-7 h-7 text-emerald-400" />
            Health Protocol Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track health interventions &amp; experiments.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{stats.activeCount}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{stats.totalEntries}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3 col-span-1">
          <div
            className="text-sm font-bold truncate"
            style={{ color: '#f59e0b' }}
            title={stats.bestProtocolName}
          >
            {stats.bestProtocolName.length > 8
              ? stats.bestProtocolName.slice(0, 7) + '…'
              : stats.bestProtocolName}
          </div>
          <div className="text-xs text-slate-500">Best Adhered</div>
        </div>
        <div className="game-card p-3">
          <div
            className="text-xl font-bold"
            style={{ color: Number(stats.avgEnergy) > 0 ? '#22c55e' : Number(stats.avgEnergy) < 0 ? '#ef4444' : '#94a3b8' }}
          >
            {stats.avgEnergy === '—' ? '—' : (Number(stats.avgEnergy) > 0 ? '+' : '') + stats.avgEnergy}
          </div>
          <div className="text-xs text-slate-500">Avg Energy</div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === t.key ? '#059669' : 'transparent',
              color: tab === t.key ? '#ffffff' : '#64748b',
            }}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: PROTOCOLS ─────────────────────────────────────────────────── */}
      {tab === 'protocols' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAddProtocol(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Protocol
          </button>

          {showAddProtocol && (
            <div className="game-card p-4 border border-emerald-500/20 space-y-3">
              <h3 className="text-sm font-semibold text-white">New Protocol</h3>
              <input
                value={protoForm.name}
                onChange={e => setProtoForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Protocol name *"
                className="game-input w-full text-sm"
                autoFocus
              />
              {/* Category chips */}
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setProtoForm(f => ({ ...f, category: cat }))}
                      className="px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all"
                      style={{
                        background: protoForm.category === cat ? CAT_COLOR[cat] + '33' : '#1e293b',
                        border: `1px solid ${protoForm.category === cat ? CAT_COLOR[cat] : '#334155'}`,
                        color: protoForm.category === cat ? CAT_COLOR[cat] : '#475569',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={protoForm.description}
                onChange={e => setProtoForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description"
                className="game-input w-full h-16 resize-none text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={protoForm.frequency}
                  onChange={e => setProtoForm(f => ({ ...f, frequency: e.target.value as Protocol['frequency'] }))}
                  className="game-input text-sm flex-1"
                >
                  {(Object.entries(FREQ_LABELS) as [Protocol['frequency'], string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={protoForm.expectedDuration}
                  onChange={e => setProtoForm(f => ({ ...f, expectedDuration: Number(e.target.value) }))}
                  placeholder="Duration (days)"
                  className="game-input text-sm w-32"
                  min={1}
                />
              </div>
              <input
                value={protoForm.goal}
                onChange={e => setProtoForm(f => ({ ...f, goal: e.target.value }))}
                placeholder="Goal / what you want to achieve"
                className="game-input w-full text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={protoForm.startDate}
                  onChange={e => setProtoForm(f => ({ ...f, startDate: e.target.value }))}
                  className="game-input text-sm flex-1"
                />
                <input
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="game-input text-sm flex-1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addProtocol}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold"
                >
                  Add Protocol
                </button>
                <button
                  onClick={() => setShowAddProtocol(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {protocols.length === 0 && !showAddProtocol && (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Add your first health protocol to begin tracking.</p>
            </div>
          )}

          {/* Active protocols */}
          {activeProtocols.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 uppercase tracking-wider">Active</p>
              {activeProtocols.map(p => (
                <ProtocolCard
                  key={p.id}
                  protocol={p}
                  onToggle={() => toggleActive(p.id)}
                  onDelete={() => deleteProtocol(p.id)}
                />
              ))}
            </div>
          )}

          {/* Inactive protocols */}
          {protocols.filter(p => !p.active).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 uppercase tracking-wider mt-2">Inactive</p>
              {protocols
                .filter(p => !p.active)
                .map(p => (
                  <ProtocolCard
                    key={p.id}
                    protocol={p}
                    onToggle={() => toggleActive(p.id)}
                    onDelete={() => deleteProtocol(p.id)}
                    dimmed
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: LOG TODAY ──────────────────────────────────────────────────── */}
      {tab === 'log' && (
        <div className="space-y-4">
          {activeProtocols.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No active protocols. Add one first.</p>
            </div>
          )}
          {activeProtocols.map(p => {
            const draft = logDrafts[p.id] || {
              adherence: 3 as const,
              energyEffect: 0 as const,
              moodEffect: 0 as const,
              sideEffects: '',
              observations: '',
              notes: '',
              date: todayStr(),
            }
            const isOpen = !!logDrafts[p.id]

            const setDraft = (
              updater: (prev: typeof draft) => typeof draft,
            ) => {
              if (!logDrafts[p.id]) {
                // initialize
                initDraft(p.id)
              }
              setLogDrafts(prev => ({
                ...prev,
                [p.id]: updater(prev[p.id] || draft),
              }))
            }

            return (
              <div
                key={p.id}
                className="game-card border"
                style={{ borderColor: CAT_COLOR[p.category] + '30' }}
              >
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => {
                    if (!isOpen) initDraft(p.id)
                    else {
                      setLogDrafts(prev => {
                        const copy = { ...prev }
                        delete copy[p.id]
                        return copy
                      })
                    }
                  }}
                >
                  <div className="flex items-center gap-2 text-left">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CAT_COLOR[p.category] }}
                    />
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                      style={{ background: CAT_COLOR[p.category] + '20', color: CAT_COLOR[p.category] }}
                    >
                      {p.category}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-700">
                    <div className="pt-3 flex gap-2 items-center">
                      <label className="text-xs text-slate-400">Date</label>
                      <input
                        type="date"
                        value={draft.date}
                        onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                        className="game-input text-xs"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Adherence — how well did you follow it? (current: {draft.adherence}/5)
                      </p>
                      <AdherencePips
                        value={draft.adherence}
                        onChange={v => setDraft(d => ({ ...d, adherence: v }))}
                      />
                    </div>

                    <EffectSlider
                      label="Energy effect"
                      value={draft.energyEffect}
                      onChange={v => setDraft(d => ({ ...d, energyEffect: v }))}
                      color="#f59e0b"
                    />

                    <EffectSlider
                      label="Mood effect"
                      value={draft.moodEffect}
                      onChange={v => setDraft(d => ({ ...d, moodEffect: v }))}
                      color="#8b5cf6"
                    />

                    <input
                      value={draft.sideEffects}
                      onChange={e => setDraft(d => ({ ...d, sideEffects: e.target.value }))}
                      placeholder="Side effects (if any)"
                      className="game-input w-full text-sm"
                    />

                    <textarea
                      value={draft.observations}
                      onChange={e => setDraft(d => ({ ...d, observations: e.target.value }))}
                      placeholder="Observations"
                      className="game-input w-full h-16 resize-none text-sm"
                    />

                    <input
                      value={draft.notes}
                      onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                      placeholder="Notes"
                      className="game-input w-full text-sm"
                    />

                    <button
                      onClick={() => saveDraft(p.id)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Log Entry
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB: INSIGHTS ───────────────────────────────────────────────────── */}
      {tab === 'insights' && (
        <div className="space-y-4">
          {insights.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Need 5+ log entries per protocol to see insights.</p>
            </div>
          )}
          {insights.map(ins => (
            <div
              key={ins.protocol.id}
              className="game-card p-4 space-y-3"
              style={{ borderLeft: `3px solid ${CAT_COLOR[ins.protocol.category]}` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{ins.protocol.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ins.count} entries · {ins.protocol.goal}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{
                    background: CAT_COLOR[ins.protocol.category] + '20',
                    color: CAT_COLOR[ins.protocol.category],
                  }}
                >
                  {ins.protocol.category}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Avg Adherence</span>
                    <span className="text-xs text-slate-300">{ins.avgAdherence.toFixed(1)}/5</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(ins.avgAdherence / 5) * 100}%`,
                        backgroundColor: '#6366f1',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      Avg Energy Effect
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: EFFECT_COLORS[Math.round(ins.avgEnergy)] }}
                    >
                      {ins.avgEnergy > 0 ? '+' : ''}{ins.avgEnergy.toFixed(1)}
                    </span>
                  </div>
                  <TrendBar value={ins.avgEnergy} max={2} color={EFFECT_COLORS[Math.round(ins.avgEnergy)]} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-pink-400" />
                      Avg Mood Effect
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: EFFECT_COLORS[Math.round(ins.avgMood)] }}
                    >
                      {ins.avgMood > 0 ? '+' : ''}{ins.avgMood.toFixed(1)}
                    </span>
                  </div>
                  <TrendBar value={ins.avgMood} max={2} color={EFFECT_COLORS[Math.round(ins.avgMood)]} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: CALENDAR ───────────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div className="space-y-4">
          {protocols.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No protocols yet.</p>
            </div>
          ) : (
            <>
              <select
                value={calendarProtocolId}
                onChange={e => setCalendarProtocolId(e.target.value)}
                className="game-input w-full text-sm"
              >
                {protocols.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {calendarProtocolId && (
                <div className="game-card p-4 space-y-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    21-day adherence — last 3 weeks
                  </p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-center text-xs text-slate-600">
                        {d}
                      </div>
                    ))}
                    {/* pad start of first week */}
                    {(() => {
                      const startDow = new Date(calendarDays[0]?.date + 'T12:00:00').getDay()
                      return Array.from({ length: startDow }).map((_, i) => (
                        <div key={`pad-${i}`} />
                      ))
                    })()}
                    {calendarDays.map(day => {
                      const adh = day.adherence
                      const bg =
                        adh === null
                          ? '#1e293b'
                          : adh >= 4
                          ? '#059669'
                          : adh === 3
                          ? '#d97706'
                          : '#dc2626'
                      const label = day.date.slice(8)
                      return (
                        <div
                          key={day.date}
                          title={
                            adh !== null
                              ? `${day.date}: adherence ${adh}/5`
                              : `${day.date}: not logged`
                          }
                          className="aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-default"
                          style={{ backgroundColor: bg, color: adh !== null ? '#fff' : '#334155' }}
                        >
                          {label}
                        </div>
                      )
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {[
                      { color: '#059669', label: '4-5 (high)' },
                      { color: '#d97706', label: '3 (moderate)' },
                      { color: '#dc2626', label: '1-2 (low)' },
                      { color: '#1e293b', label: 'Not logged' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
                        <span className="text-xs text-slate-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Protocol Card ────────────────────────────────────────────────────────────

function ProtocolCard({
  protocol,
  onToggle,
  onDelete,
  dimmed = false,
}: {
  protocol: Protocol
  onToggle: () => void
  onDelete: () => void
  dimmed?: boolean
}) {
  const color = CAT_COLOR[protocol.category]
  return (
    <div
      className="game-card p-3 flex items-start gap-3"
      style={{
        borderLeft: `3px solid ${color}`,
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{protocol.name}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full capitalize"
            style={{ background: color + '20', color }}
          >
            {protocol.category}
          </span>
          <span className="text-xs text-slate-500">{FREQ_LABELS[protocol.frequency]}</span>
        </div>
        {protocol.goal && (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Target className="w-3 h-3 flex-shrink-0" />
            {protocol.goal}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-slate-600">Started {protocol.startDate}</span>
          {protocol.expectedDuration > 0 && (
            <span className="text-xs text-slate-600">{protocol.expectedDuration}d experiment</span>
          )}
          {protocol.tags.map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-700 rounded-full text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggle}
          className="text-xs px-2 py-1 rounded-lg transition-all"
          style={{
            background: protocol.active ? '#059669' + '20' : '#475569' + '20',
            color: protocol.active ? '#34d399' : '#64748b',
            border: `1px solid ${protocol.active ? '#059669' : '#475569'}`,
          }}
        >
          {protocol.active ? 'Active' : 'Inactive'}
        </button>
        <button onClick={onDelete} className="text-slate-700 hover:text-red-400 p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
