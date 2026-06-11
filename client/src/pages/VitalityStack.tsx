import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, Zap, Flame, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type VitalityItem = {
  id: string
  name: string
  category: 'sleep' | 'nutrition' | 'movement' | 'mind' | 'social' | 'environment' | 'supplement'
  description: string
  targetDose: string
  timing: 'morning' | 'afternoon' | 'evening' | 'any'
  priority: 'essential' | 'high' | 'medium' | 'optional'
  active: boolean
}

type VitalityLog = {
  id: string
  date: string
  completedIds: string[]
  overallVitality: number
  energyPeak: number
  notes: string
}

const STORAGE_KEY = 'lq-vitalitystack'

type StoredData = {
  items: VitalityItem[]
  logs: VitalityLog[]
}

const CATEGORY_CONFIG: Record<VitalityItem['category'], { label: string; color: string }> = {
  sleep:       { label: 'Sleep',       color: '#6366f1' },
  nutrition:   { label: 'Nutrition',   color: '#10b981' },
  movement:    { label: 'Movement',    color: '#f59e0b' },
  mind:        { label: 'Mind',        color: '#8b5cf6' },
  social:      { label: 'Social',      color: '#ec4899' },
  environment: { label: 'Environment', color: '#06b6d4' },
  supplement:  { label: 'Supplement',  color: '#84cc16' },
}

const PRIORITY_CONFIG: Record<VitalityItem['priority'], { label: string; color: string; bg: string }> = {
  essential: { label: 'Essential', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  high:      { label: 'High',      color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  medium:    { label: 'Medium',    color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  optional:  { label: 'Optional',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

const DEFAULT_ITEMS: Omit<VitalityItem, 'id'>[] = [
  { name: 'Deep Sleep', category: 'sleep', description: 'Consistent 7-9 hours in a dark, cool room', targetDose: '7-9 hours', timing: 'evening', priority: 'essential', active: true },
  { name: 'Cold Shower', category: 'environment', description: 'End shower with 2 min cold water for alertness', targetDose: '2 min', timing: 'morning', priority: 'high', active: true },
  { name: 'Protein Breakfast', category: 'nutrition', description: 'High protein meal within 1hr of waking', targetDose: '30-50g protein', timing: 'morning', priority: 'high', active: true },
  { name: 'Morning Walk', category: 'movement', description: 'Brisk walk outdoors for sunlight and movement', targetDose: '20-30 min', timing: 'morning', priority: 'high', active: true },
  { name: 'Meditation', category: 'mind', description: 'Mindful breathing or body scan practice', targetDose: '10-20 min', timing: 'morning', priority: 'medium', active: true },
  { name: 'Morning Sunlight', category: 'environment', description: 'Direct sunlight exposure to set circadian rhythm', targetDose: '10 min', timing: 'morning', priority: 'essential', active: true },
  { name: 'No Screens Before Bed', category: 'sleep', description: 'Avoid all screens 60 min before sleep', targetDose: '60 min before bed', timing: 'evening', priority: 'essential', active: true },
  { name: 'Weekly Social Connection', category: 'social', description: 'Meaningful in-person time with friends or family', targetDose: '1-2 hours', timing: 'any', priority: 'medium', active: true },
]

const EMPTY_ITEM: Omit<VitalityItem, 'id'> = {
  name: '',
  category: 'movement',
  description: '',
  targetDose: '',
  timing: 'morning',
  priority: 'medium',
  active: true,
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function last30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

type ItemFormProps = {
  initial: Omit<VitalityItem, 'id'>
  onSave: (data: Omit<VitalityItem, 'id'>) => void
  onCancel: () => void
}

function ItemForm({ initial, onSave, onCancel }: ItemFormProps) {
  const [form, setForm] = useState<Omit<VitalityItem, 'id'>>(initial)

  function set<K extends keyof Omit<VitalityItem, 'id'>>(key: K, value: Omit<VitalityItem, 'id'>[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="game-card p-5 space-y-4" style={{ background: 'rgba(2,20,10,0.98)', border: '1px solid #065f46' }}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-green-400 mb-1">Name</label>
          <input className="game-input w-full" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cold Shower" />
        </div>
        <div>
          <label className="block text-xs text-green-400 mb-1">Target Dose</label>
          <input className="game-input w-full" value={form.targetDose} onChange={e => set('targetDose', e.target.value)} placeholder="e.g. 20 min" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-green-400 mb-1">Description</label>
        <input className="game-input w-full" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description..." />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-green-400 mb-1">Category</label>
          <select className="game-input w-full" value={form.category} onChange={e => set('category', e.target.value as VitalityItem['category'])}>
            {(Object.keys(CATEGORY_CONFIG) as VitalityItem['category'][]).map(c => (
              <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-green-400 mb-1">Timing</label>
          <select className="game-input w-full" value={form.timing} onChange={e => set('timing', e.target.value as VitalityItem['timing'])}>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="any">Any Time</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-green-400 mb-1">Priority</label>
          <select className="game-input w-full" value={form.priority} onChange={e => set('priority', e.target.value as VitalityItem['priority'])}>
            {(Object.keys(PRIORITY_CONFIG) as VitalityItem['priority'][]).map(p => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#065f46', color: '#d1fae5' }}
        >
          <Check style={{ width: 14, height: 14 }} /> Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function VitalityStack() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<VitalityItem[]>([])
  const [logs, setLogs] = useState<VitalityLog[]>([])
  const [activeTab, setActiveTab] = useState<'today' | 'stack' | 'trends'>('today')
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [todayLog, setTodayLog] = useState<VitalityLog>({
    id: '',
    date: todayString(),
    completedIds: [],
    overallVitality: 5,
    energyPeak: 5,
    notes: '',
  })

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as StoredData
      setItems(data.items ?? [])
      const loadedLogs = data.logs ?? []
      setLogs(loadedLogs)
      const existing = loadedLogs.find(l => l.date === todayString())
      if (existing) setTodayLog(existing)
    } else {
      const seeded = DEFAULT_ITEMS.map(item => ({ ...item, id: crypto.randomUUID() }))
      setItems(seeded)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: seeded, logs: [] }))
    }
  }, [])

  function save(newItems: VitalityItem[], newLogs: VitalityLog[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: newItems, logs: newLogs }))
    setItems(newItems)
    setLogs(newLogs)
  }

  function addItem(data: Omit<VitalityItem, 'id'>) {
    const item: VitalityItem = { ...data, id: crypto.randomUUID() }
    save([...items, item], logs)
    setShowItemForm(false)
    toastSuccess('Vitality item added', data.name)
  }

  function updateItem(id: string, data: Omit<VitalityItem, 'id'>) {
    save(items.map(it => it.id === id ? { ...data, id } : it), logs)
    setEditingItemId(null)
    toastSuccess('Item updated')
  }

  function deleteItem(id: string) {
    save(items.filter(it => it.id !== id), logs)
    toastSuccess('Item removed')
  }

  function toggleItemActive(id: string) {
    save(items.map(it => it.id === id ? { ...it, active: !it.active } : it), logs)
  }

  function toggleCompleted(itemId: string) {
    setTodayLog(prev => ({
      ...prev,
      completedIds: prev.completedIds.includes(itemId)
        ? prev.completedIds.filter(id => id !== itemId)
        : [...prev.completedIds, itemId],
    }))
  }

  function saveCheckIn() {
    const logEntry: VitalityLog = {
      ...todayLog,
      id: todayLog.id || crypto.randomUUID(),
    }
    const updated = logs.filter(l => l.date !== todayString())
    save(items, [...updated, logEntry])
    setTodayLog(logEntry)
    toastSuccess('Check-in saved', `Vitality: ${logEntry.overallVitality}/10`)
  }

  const activeItems = items.filter(it => it.active)
  const essentialItems = activeItems.filter(it => it.priority === 'essential')
  const completionPct = activeItems.length > 0
    ? Math.round((todayLog.completedIds.filter(id => activeItems.some(it => it.id === id)).length / activeItems.length) * 100)
    : 0

  const days30 = last30Days()

  function getLogForDay(date: string): VitalityLog | undefined {
    return logs.find(l => l.date === date)
  }

  function perfectEssentialStreak(): number {
    let streak = 0
    for (let i = days30.length - 1; i >= 0; i--) {
      const date = days30[i]
      if (date === todayString()) continue
      const log = getLogForDay(date)
      if (!log) break
      const allEssential = essentialItems.every(it => log.completedIds.includes(it.id))
      if (allEssential) streak++
      else break
    }
    return streak
  }

  function correlationData(): { item: VitalityItem; withAvg: number; withoutAvg: number; impact: number; days: number }[] {
    return items.filter(it => {
      const daysWithItem = logs.filter(l => l.completedIds.includes(it.id))
      return daysWithItem.length >= 5
    }).map(it => {
      const withLogs = logs.filter(l => l.completedIds.includes(it.id))
      const withoutLogs = logs.filter(l => !l.completedIds.includes(it.id))
      const withAvg = withLogs.reduce((s, l) => s + l.overallVitality, 0) / withLogs.length
      const withoutAvg = withoutLogs.length > 0
        ? withoutLogs.reduce((s, l) => s + l.overallVitality, 0) / withoutLogs.length
        : 0
      return { item: it, withAvg: Math.round(withAvg * 10) / 10, withoutAvg: Math.round(withoutAvg * 10) / 10, impact: withAvg - withoutAvg, days: withLogs.length }
    }).sort((a, b) => b.impact - a.impact)
  }

  const svgW = 600
  const svgH = 100
  const padX = 20
  const padY = 12
  const chartW = svgW - padX * 2
  const chartH = svgH - padY * 2

  function toY(score: number) {
    return padY + chartH - ((score - 1) / 9) * chartH
  }

  const trendPoints = days30.map((date, i) => {
    const log = getLogForDay(date)
    return { x: padX + (i / (days30.length - 1)) * chartW, y: log ? log.overallVitality : null, date }
  })

  const trendPath = trendPoints
    .filter(p => p.y !== null)
    .map((p, i, arr) => {
      const sy = toY(p.y as number)
      return i === 0 || trendPoints.findIndex(t => t.x === p.x) === trendPoints.findIndex(t => t.y !== null) ? `M ${p.x} ${sy}` : `L ${p.x} ${sy}`
    }).join(' ')

  const correlation = correlationData()
  const top3 = correlation.slice(0, 3)

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: 'linear-gradient(135deg, #010f07 0%, #052e16 50%, #010f07 100%)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-300" style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 20px #10b98155' }}>
            Vitality Stack
          </h1>
          <p className="text-green-800 text-sm mt-1">Design and track your personal vitality protocol</p>
        </div>
        <Zap style={{ width: 40, height: 40, color: '#065f46' }} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="game-card p-4 text-center" style={{ border: '1px solid #065f4633' }}>
          <div className="text-2xl font-bold text-green-400">{completionPct}%</div>
          <div className="text-xs text-slate-400 mt-1">Today's Completion</div>
        </div>
        <div className="game-card p-4 text-center" style={{ border: '1px solid #06b6d433' }}>
          <div className="text-2xl font-bold text-cyan-400">{perfectEssentialStreak()}</div>
          <div className="text-xs text-slate-400 mt-1">Essential Streak (days)</div>
        </div>
        <div className="game-card p-4 text-center" style={{ border: '1px solid #10b98133' }}>
          <div className="text-2xl font-bold text-emerald-400">{logs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Days Logged</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['today', 'stack', 'trends'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
            style={{
              background: activeTab === tab ? '#065f46' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#d1fae5' : '#94a3b8',
            }}
          >
            {tab === 'today' ? "Today's Stack" : tab === 'stack' ? 'My Stack' : 'Trends'}
          </button>
        ))}
      </div>

      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="game-card p-5" style={{ background: 'rgba(2,20,10,0.9)', border: '1px solid #065f46' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-200">Today's Stack</h2>
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-400">{todayLog.completedIds.filter(id => activeItems.some(it => it.id === id)).length}/{activeItems.length}</div>
                <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: '#1a2e1a' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${completionPct}%`, background: completionPct === 100 ? '#f59e0b' : '#10b981' }}
                  />
                </div>
              </div>
            </div>

            {activeItems.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No active items. Add some to your stack.</p>
            ) : (
              <div className="space-y-2">
                {(['morning', 'afternoon', 'evening', 'any'] as VitalityItem['timing'][]).map(timing => {
                  const timingItems = activeItems.filter(it => it.timing === timing)
                  if (timingItems.length === 0) return null
                  const timingLabel = timing === 'any' ? 'Any Time' : timing.charAt(0).toUpperCase() + timing.slice(1)
                  return (
                    <div key={timing}>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 mt-3">{timingLabel}</div>
                      {timingItems.map(item => {
                        const done = todayLog.completedIds.includes(item.id)
                        const catCfg = CATEGORY_CONFIG[item.category]
                        const priCfg = PRIORITY_CONFIG[item.priority]
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-lg mb-1 cursor-pointer transition-all"
                            style={{
                              background: done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${done ? '#10b98133' : '#ffffff0a'}`,
                            }}
                            onClick={() => toggleCompleted(item.id)}
                          >
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                              style={{ background: done ? '#10b981' : 'rgba(255,255,255,0.08)', border: done ? 'none' : '1px solid #374151' }}
                            >
                              {done && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{item.name}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${catCfg.color}22`, color: catCfg.color }}>{catCfg.label}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: priCfg.bg, color: priCfg.color }}>{priCfg.label}</span>
                              </div>
                              {item.targetDose && <div className="text-xs text-slate-500">{item.targetDose}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="game-card p-5 space-y-4" style={{ background: 'rgba(2,20,10,0.9)', border: '1px solid #065f4644' }}>
            <h3 className="font-semibold text-green-200">Daily Check-In</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-green-400 mb-2">Overall Vitality: <span className="text-white font-bold">{todayLog.overallVitality}</span>/10</label>
                <input
                  type="range" min={1} max={10} value={todayLog.overallVitality}
                  onChange={e => setTodayLog(prev => ({ ...prev, overallVitality: parseInt(e.target.value, 10) }))}
                  className="w-full accent-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-400 mb-2">Peak Energy: <span className="text-white font-bold">{todayLog.energyPeak}</span>/10</label>
                <input
                  type="range" min={1} max={10} value={todayLog.energyPeak}
                  onChange={e => setTodayLog(prev => ({ ...prev, energyPeak: parseInt(e.target.value, 10) }))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-green-400 mb-1">Notes</label>
              <textarea
                className="game-input w-full"
                rows={2}
                value={todayLog.notes}
                onChange={e => setTodayLog(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="How did you feel? What worked?"
              />
            </div>
            <button
              onClick={saveCheckIn}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#065f46', color: '#d1fae5' }}
            >
              <Flame style={{ width: 14, height: 14 }} /> Save Check-In
            </button>
          </div>
        </div>
      )}

      {activeTab === 'stack' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-200">My Vitality Stack</h2>
            <button
              onClick={() => setShowItemForm(s => !s)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#065f46', color: '#d1fae5' }}
            >
              <Plus style={{ width: 14, height: 14 }} /> Add Item
            </button>
          </div>

          {showItemForm && (
            <ItemForm initial={EMPTY_ITEM} onSave={addItem} onCancel={() => setShowItemForm(false)} />
          )}

          {(Object.keys(CATEGORY_CONFIG) as VitalityItem['category'][]).map(cat => {
            const catItems = items.filter(it => it.category === cat)
            if (catItems.length === 0) return null
            const catCfg = CATEGORY_CONFIG[cat]
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: catCfg.color }} />
                  <h3 className="text-sm font-semibold" style={{ color: catCfg.color }}>{catCfg.label}</h3>
                </div>
                <div className="space-y-2 pl-4">
                  {catItems.map(item =>
                    editingItemId === item.id ? (
                      <ItemForm
                        key={item.id}
                        initial={item}
                        onSave={data => updateItem(item.id, data)}
                        onCancel={() => setEditingItemId(null)}
                      />
                    ) : (
                      <div
                        key={item.id}
                        className="game-card p-3 flex items-center gap-3"
                        style={{ opacity: item.active ? 1 : 0.45, border: `1px solid ${catCfg.color}22` }}
                      >
                        <button
                          onClick={() => toggleItemActive(item.id)}
                          className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
                          style={{
                            background: item.active ? catCfg.color : 'rgba(255,255,255,0.08)',
                            border: item.active ? 'none' : '1px solid #374151',
                          }}
                        >
                          {item.active && <Check style={{ width: 11, height: 11, color: '#fff' }} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-200">{item.name}</span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{ background: PRIORITY_CONFIG[item.priority].bg, color: PRIORITY_CONFIG[item.priority].color }}
                            >
                              {PRIORITY_CONFIG[item.priority].label}
                            </span>
                            <span className="text-xs text-slate-500">{item.timing}</span>
                          </div>
                          {item.targetDose && <div className="text-xs text-slate-500">{item.targetDose}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingItemId(item.id)} className="p-1.5 rounded text-slate-500 hover:text-green-400" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <Edit2 style={{ width: 12, height: 12 }} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded text-slate-500 hover:text-red-400" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="game-card p-5" style={{ background: 'rgba(2,20,10,0.9)', border: '1px solid #065f4644' }}>
            <h2 className="text-sm font-semibold text-green-200 mb-4">30-Day Vitality Trend</h2>
            <div className="overflow-x-auto">
              <svg width={svgW} height={svgH} style={{ display: 'block', minWidth: '100%' }}>
                <defs>
                  <linearGradient id="trendGold" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect x={padX} y={toY(10)} width={chartW} height={toY(8) - toY(10)} fill="#f59e0b08" />
                <rect x={padX} y={toY(8)} width={chartW} height={toY(5) - toY(8)} fill="#3b82f608" />
                <rect x={padX} y={toY(5)} width={chartW} height={toY(1) - toY(5)} fill="#ef444408" />
                {[2, 5, 8, 10].map(v => (
                  <g key={v}>
                    <line x1={padX} x2={svgW - padX} y1={toY(v)} y2={toY(v)} stroke="#ffffff0a" strokeWidth={1} />
                    <text x={padX - 4} y={toY(v) + 3} fontSize={8} fill="#475569" textAnchor="end">{v}</text>
                  </g>
                ))}
                {trendPath && <path d={trendPath} fill="none" stroke="#10b981" strokeWidth={2} strokeLinejoin="round" />}
                {trendPoints.filter(p => p.y !== null).map((p, i) => {
                  const score = p.y as number
                  const dotColor = score >= 8 ? '#f59e0b' : score >= 5 ? '#3b82f6' : '#ef4444'
                  return <circle key={i} cx={p.x} cy={toY(score)} r={3} fill={dotColor} />
                })}
                <text x={padX} y={svgH - 2} fontSize={8} fill="#475569">30 days ago</text>
                <text x={svgW - padX} y={svgH - 2} fontSize={8} fill="#475569" textAnchor="end">Today</text>
              </svg>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#f59e0b' }} />≥8 Gold Zone</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#3b82f6' }} />5-7 Flow Zone</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#ef4444' }} />&lt;5 Recovery Zone</span>
            </div>
          </div>

          <div className="game-card p-5" style={{ background: 'rgba(2,20,10,0.9)', border: '1px solid #065f4644' }}>
            <h2 className="text-sm font-semibold text-green-200 mb-4">Stack Correlation</h2>
            {correlation.length === 0 ? (
              <p className="text-slate-500 text-sm">Log at least 5 days with each item to see correlations.</p>
            ) : (
              <div className="space-y-3">
                {correlation.map((c, i) => {
                  const isTop = top3.some(t => t.item.id === c.item.id)
                  const catCfg = CATEGORY_CONFIG[c.item.category]
                  return (
                    <div
                      key={c.item.id}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: isTop ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: isTop ? '1px solid #10b98133' : '1px solid transparent' }}
                    >
                      {isTop && <Star style={{ width: 14, height: 14, color: '#f59e0b', flexShrink: 0 }} />}
                      {!isTop && <div style={{ width: 14, flexShrink: 0 }} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-200">{c.item.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${catCfg.color}22`, color: catCfg.color }}>{catCfg.label}</span>
                          {isTop && i === 0 && <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>Top Impact</span>}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{c.days} days logged</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm">
                          <span className="text-green-400 font-bold">{c.withAvg}</span>
                          <span className="text-slate-600 mx-1">vs</span>
                          <span className="text-slate-400">{c.withoutAvg}</span>
                        </div>
                        <div className="text-xs" style={{ color: c.impact >= 0 ? '#10b981' : '#ef4444' }}>
                          {c.impact >= 0 ? '+' : ''}{c.impact.toFixed(1)} impact
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
