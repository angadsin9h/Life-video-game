import React, { useState, useEffect } from 'react'
import {
  Brain, BookOpen, Zap, BarChart2, Users, Heart,
  Plus, Edit2, Trash2, Check, X, Star, ChevronDown,
  Award, Calendar, TrendingUp
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-wealth-ritual'

type RitualCategory = 'mindset' | 'education' | 'action' | 'review' | 'network' | 'health'
type Frequency = 'daily' | 'weekly' | 'monthly'

type WealthRitual = {
  id: string
  name: string
  category: RitualCategory
  description: string
  frequency: Frequency
  active: boolean
}

type RitualLog = {
  id: string
  ritualId: string
  date: string
  completed: boolean
  quality: number
  insight: string
}

const CATEGORY_CONFIG: Record<RitualCategory, {
  label: string
  color: string
  bg: string
  ring: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  mindset:   { label: 'Mindset',   color: 'text-purple-400',  bg: 'bg-purple-900/40',  ring: 'ring-purple-500/50',  Icon: Brain },
  education: { label: 'Education', color: 'text-cyan-400',    bg: 'bg-cyan-900/40',    ring: 'ring-cyan-500/50',    Icon: BookOpen },
  action:    { label: 'Action',    color: 'text-yellow-400',  bg: 'bg-yellow-900/40',  ring: 'ring-yellow-500/50',  Icon: Zap },
  review:    { label: 'Review',    color: 'text-blue-400',    bg: 'bg-blue-900/40',    ring: 'ring-blue-500/50',    Icon: BarChart2 },
  network:   { label: 'Network',   color: 'text-emerald-400', bg: 'bg-emerald-900/40', ring: 'ring-emerald-500/50', Icon: Users },
  health:    { label: 'Health',    color: 'text-pink-400',    bg: 'bg-pink-900/40',    ring: 'ring-pink-500/50',    Icon: Heart },
}

const DEFAULT_RITUALS: WealthRitual[] = [
  { id: 'r1', name: 'Morning financial review',   category: 'review',    description: 'Check accounts, review budget, set money intention for the day.', frequency: 'daily',   active: true },
  { id: 'r2', name: 'Read 10 pages on finance',   category: 'education', description: 'Daily reading from a finance, investing, or entrepreneurship book.', frequency: 'daily',   active: true },
  { id: 'r3', name: 'Network outreach',           category: 'network',   description: 'Reach out to one valuable connection or potential collaborator.',     frequency: 'weekly',  active: true },
  { id: 'r4', name: 'Investment research hour',   category: 'action',    description: 'Research one investment opportunity, sector, or asset class.',       frequency: 'weekly',  active: true },
  { id: 'r5', name: 'Gratitude for abundance',    category: 'mindset',   description: 'Journal 3 things you are grateful for financially.',                 frequency: 'daily',   active: true },
  { id: 'r6', name: 'Physical energy optimization', category: 'health', description: 'Exercise, sleep hygiene, or nutrition habit to sustain high performance.', frequency: 'daily', active: true },
]

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getLast30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function computeWealthLevel(logs: RitualLog[], rituals: WealthRitual[]): number {
  if (logs.length === 0) return 1
  const completed = logs.filter(l => l.completed)
  const total = logs.length
  const completionRate = completed.length / Math.max(total, 1)
  const avgQuality = completed.length === 0
    ? 0
    : completed.reduce((s, l) => s + l.quality, 0) / completed.length
  const insightDepth = completed.length === 0
    ? 0
    : Math.min(1, completed.reduce((s, l) => s + Math.min(l.insight.length, 200), 0) / (completed.length * 100))
  const score = (completionRate * 0.5 + (avgQuality / 5) * 0.3 + insightDepth * 0.2) * 100
  return Math.max(1, Math.floor(score / 10) + 1)
}

const blankRitual = (): Omit<WealthRitual, 'id'> => ({
  name: '',
  category: 'mindset',
  description: '',
  frequency: 'daily',
  active: true,
})

export default function WealthRitualLog() {
  const { toastSuccess } = useToast()
  const [rituals, setRituals] = useState<WealthRitual[]>(DEFAULT_RITUALS)
  const [logs, setLogs] = useState<RitualLog[]>([])
  const [activeTab, setActiveTab] = useState<'checkin' | 'library' | 'calendar' | 'score'>('checkin')
  const [showAddRitual, setShowAddRitual] = useState(false)
  const [editingRitual, setEditingRitual] = useState<WealthRitual | null>(null)
  const [ritualForm, setRitualForm] = useState<Omit<WealthRitual, 'id'>>(blankRitual())
  const [insightMap, setInsightMap] = useState<Record<string, string>>({})
  const [qualityMap, setQualityMap] = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { rituals: WealthRitual[]; logs: RitualLog[] }
        if (parsed.rituals) setRituals(parsed.rituals)
        if (parsed.logs) setLogs(parsed.logs)
      }
    } catch { /* ignore */ }
  }, [])

  function persist(nextRituals: WealthRitual[], nextLogs: RitualLog[]) {
    setRituals(nextRituals)
    setLogs(nextLogs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rituals: nextRituals, logs: nextLogs }))
  }

  const today = todayStr()
  const todayLogs = logs.filter(l => l.date === today)

  function getTodayLog(ritualId: string): RitualLog | undefined {
    return todayLogs.find(l => l.ritualId === ritualId)
  }

  function toggleComplete(ritual: WealthRitual) {
    const existing = getTodayLog(ritual.id)
    if (existing) {
      const nextLogs = logs.filter(l => l.id !== existing.id)
      persist(rituals, nextLogs)
    } else {
      const newLog: RitualLog = {
        id: generateId(),
        ritualId: ritual.id,
        date: today,
        completed: true,
        quality: qualityMap[ritual.id] ?? 3,
        insight: insightMap[ritual.id] ?? '',
      }
      persist(rituals, [...logs, newLog])
      toastSuccess('Ritual completed!', ritual.name)
    }
  }

  function saveLogDetails(ritualId: string) {
    const existing = getTodayLog(ritualId)
    if (!existing) return
    const updated: RitualLog = {
      ...existing,
      quality: qualityMap[ritualId] ?? existing.quality,
      insight: insightMap[ritualId] ?? existing.insight,
    }
    const nextLogs = logs.map(l => l.id === existing.id ? updated : l)
    persist(rituals, nextLogs)
    toastSuccess('Log updated')
  }

  function handleAddRitual() {
    if (!ritualForm.name.trim()) return
    const next = [...rituals, { ...ritualForm, id: generateId() }]
    persist(next, logs)
    toastSuccess('Ritual added', ritualForm.name)
    setRitualForm(blankRitual())
    setShowAddRitual(false)
  }

  function handleUpdateRitual() {
    if (!editingRitual || !ritualForm.name.trim()) return
    const next = rituals.map(r => r.id === editingRitual.id ? { ...editingRitual, ...ritualForm } : r)
    persist(next, logs)
    toastSuccess('Ritual updated')
    setEditingRitual(null)
    setRitualForm(blankRitual())
  }

  function handleDeleteRitual(id: string) {
    persist(rituals.filter(r => r.id !== id), logs.filter(l => l.ritualId !== id))
  }

  function startEdit(r: WealthRitual) {
    setEditingRitual(r)
    setRitualForm({ name: r.name, category: r.category, description: r.description, frequency: r.frequency, active: r.active })
  }

  const activeRituals = rituals.filter(r => r.active)
  const wealthLevel = computeWealthLevel(logs, rituals)
  const last30 = getLast30Days()

  const completionByDay: Record<string, number> = {}
  const ritualsByDay: Record<string, number> = {}
  for (const day of last30) {
    const dayLogs = logs.filter(l => l.date === day && l.completed)
    completionByDay[day] = dayLogs.length
    ritualsByDay[day] = activeRituals.filter(r => {
      if (r.frequency === 'daily') return true
      if (r.frequency === 'weekly') {
        const d = new Date(day)
        return d.getDay() === 1
      }
      if (r.frequency === 'monthly') {
        return day.endsWith('-01')
      }
      return false
    }).length
  }

  const todayComplete = todayLogs.length
  const todayTotal = activeRituals.length
  const streakDays = (() => {
    let streak = 0
    for (let i = last30.length - 1; i >= 0; i--) {
      const day = last30[i]
      if (completionByDay[day] > 0) streak++
      else break
    }
    return streak
  })()

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 50%, #0d1130 100%)' }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #ca8a04, #1e3a5f)' }}>
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
                Wealth Rituals
              </h1>
              <p className="text-sm text-yellow-400/70">Daily habits that compound into wealth</p>
            </div>
          </div>

          {/* Wealth Level Badge */}
          <div className="flex flex-col items-center px-4 py-2 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(202,138,4,0.3), rgba(30,58,95,0.6))', border: '1px solid rgba(202,138,4,0.5)' }}>
            <Award className="w-5 h-5 text-yellow-400 mb-0.5" />
            <div className="text-xs text-yellow-500/70 uppercase tracking-wider">Wealth Lv.</div>
            <div className="text-2xl font-black text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {wealthLevel}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today's Progress", value: `${todayComplete}/${todayTotal}`, color: 'text-yellow-400', sub: 'rituals done' },
            { label: 'Current Streak',   value: `${streakDays}d`,               color: 'text-emerald-400', sub: 'active days' },
            { label: 'Total Logged',      value: logs.filter(l => l.completed).length.toString(), color: 'text-blue-400', sub: 'completions' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="game-card p-3 text-center"
              style={{ border: '1px solid rgba(202,138,4,0.2)' }}>
              <div className="text-xs text-slate-400 mb-1">{label}</div>
              <div className={`text-xl font-bold ${color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{value}</div>
              <div className="text-xs text-slate-500">{sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['checkin', 'library', 'calendar', 'score'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab
                ? 'bg-yellow-900/50 text-yellow-300 ring-1 ring-yellow-500/40'
                : 'bg-slate-800/40 text-slate-400 hover:text-white'}`}
            >
              {tab === 'checkin' ? 'Daily Check-in' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Daily Check-in */}
        {activeTab === 'checkin' && (
          <div className="space-y-3">
            {activeRituals.length === 0 && (
              <div className="game-card p-8 text-center text-slate-500">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No active rituals. Add some in the Library tab.</p>
              </div>
            )}
            {activeRituals.map(ritual => {
              const logEntry = getTodayLog(ritual.id)
              const done = !!logEntry
              const cfg = CATEGORY_CONFIG[ritual.category]
              const quality = qualityMap[ritual.id] ?? logEntry?.quality ?? 3
              const insight = insightMap[ritual.id] ?? logEntry?.insight ?? ''
              return (
                <div key={ritual.id} className={`game-card p-4 transition-all ${done ? 'opacity-100' : 'opacity-80'}`}
                  style={{ border: done ? '1px solid rgba(202,138,4,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleComplete(ritual)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${done
                        ? 'bg-yellow-500 border-yellow-500'
                        : 'border-slate-600 hover:border-yellow-500'}`}
                    >
                      {done && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${done ? 'text-yellow-300' : 'text-white'}`}>{ritual.name}</span>
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${cfg.bg} ${cfg.color}`}>
                          <cfg.Icon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">{ritual.frequency}</span>
                      </div>
                      {ritual.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{ritual.description}</p>
                      )}

                      {done && (
                        <div className="mt-3 space-y-2">
                          <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Quality</span>
                              <span className="text-yellow-400 font-semibold">{quality}/5</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              step={1}
                              value={quality}
                              onChange={e => setQualityMap(m => ({ ...m, [ritual.id]: parseInt(e.target.value) }))}
                              className="w-full accent-yellow-500"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={insight}
                              onChange={e => setInsightMap(m => ({ ...m, [ritual.id]: e.target.value }))}
                              className="game-input w-full text-xs"
                              placeholder="Key insight from this ritual..."
                            />
                          </div>
                          <button
                            onClick={() => saveLogDetails(ritual.id)}
                            className="text-xs px-3 py-1 rounded-lg bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/60 transition-all"
                          >
                            Save details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Library */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => { setShowAddRitual(!showAddRitual); setEditingRitual(null); setRitualForm(blankRitual()) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #ca8a04, #1e3a5f)', color: '#fff' }}
              >
                <Plus className="w-4 h-4" />
                Add Ritual
              </button>
            </div>

            {(showAddRitual || editingRitual) && (
              <div className="game-card p-5 space-y-4"
                style={{ border: '1px solid rgba(202,138,4,0.4)', background: 'rgba(202,138,4,0.05)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">{editingRitual ? 'Edit Ritual' : 'New Ritual'}</h3>
                  <button onClick={() => { setShowAddRitual(false); setEditingRitual(null) }} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Name</label>
                    <input
                      type="text"
                      value={ritualForm.name}
                      onChange={e => setRitualForm(f => ({ ...f, name: e.target.value }))}
                      className="game-input w-full"
                      placeholder="Ritual name..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Category</label>
                    <div className="relative">
                      <select
                        value={ritualForm.category}
                        onChange={e => setRitualForm(f => ({ ...f, category: e.target.value as RitualCategory }))}
                        className="game-input w-full appearance-none pr-8"
                      >
                        {(Object.keys(CATEGORY_CONFIG) as RitualCategory[]).map(c => (
                          <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
                    <div className="relative">
                      <select
                        value={ritualForm.frequency}
                        onChange={e => setRitualForm(f => ({ ...f, frequency: e.target.value as Frequency }))}
                        className="game-input w-full appearance-none pr-8"
                      >
                        {(['daily', 'weekly', 'monthly'] as Frequency[]).map(freq => (
                          <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Description</label>
                    <textarea
                      value={ritualForm.description}
                      onChange={e => setRitualForm(f => ({ ...f, description: e.target.value }))}
                      className="game-input w-full resize-none"
                      rows={2}
                      placeholder="What does this ritual involve?"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={ritualForm.active}
                        onChange={e => setRitualForm(f => ({ ...f, active: e.target.checked }))}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                      <span className="text-sm text-slate-300">Active</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={editingRitual ? handleUpdateRitual : handleAddRitual}
                  disabled={!ritualForm.name.trim()}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #ca8a04, #1e3a5f)', color: '#fff' }}
                >
                  {editingRitual ? 'Update Ritual' : 'Add to Library'}
                </button>
              </div>
            )}

            {rituals.map(ritual => {
              const cfg = CATEGORY_CONFIG[ritual.category]
              const timesCompleted = logs.filter(l => l.ritualId === ritual.id && l.completed).length
              return (
                <div key={ritual.id} className={`game-card p-4 flex items-start gap-3 ${!ritual.active ? 'opacity-50' : ''}`}
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className={`flex-shrink-0 p-2 rounded-lg ${cfg.bg}`}>
                    <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-white text-sm">{ritual.name}</span>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs bg-slate-700/60 text-slate-400 capitalize">{ritual.frequency}</span>
                          {!ritual.active && <span className="px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-500">paused</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-slate-500">{timesCompleted}x</span>
                        <button onClick={() => startEdit(ritual)} className="text-slate-500 hover:text-yellow-400 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteRitual(ritual.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {ritual.description && <p className="text-xs text-slate-500 mt-1">{ritual.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Calendar */}
        {activeTab === 'calendar' && (
          <div className="game-card p-5" style={{ border: '1px solid rgba(202,138,4,0.2)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Last 30 Days</h3>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {last30.map(day => {
                const count = completionByDay[day] ?? 0
                const isToday = day === today
                const opacity = count === 0 ? 0.15 : Math.min(1, 0.3 + (count / Math.max(activeRituals.length, 1)) * 0.7)
                return (
                  <div
                    key={day}
                    title={`${day}: ${count} completed`}
                    className={`aspect-square rounded-md transition-all ${isToday ? 'ring-1 ring-yellow-400' : ''}`}
                    style={{ background: `rgba(202, 138, 4, ${opacity})` }}
                  />
                )
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'rgba(202,138,4,0.15)' }} />
                None
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'rgba(202,138,4,0.5)' }} />
                Partial
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'rgba(202,138,4,1)' }} />
                Full
              </div>
            </div>

            {/* Per-ritual streaks */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">Per-ritual completions (last 30 days)</h4>
              {activeRituals.map(ritual => {
                const cfg = CATEGORY_CONFIG[ritual.category]
                const totalDone = logs.filter(l => l.ritualId === ritual.id && l.completed && last30.includes(l.date)).length
                const maxDone = last30.length
                const pct = (totalDone / maxDone) * 100
                return (
                  <div key={ritual.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`${cfg.color} flex items-center gap-1`}>
                        <cfg.Icon className="w-3 h-3" />
                        {ritual.name}
                      </span>
                      <span className="text-slate-500">{totalDone}/{maxDone}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: 'rgba(202,138,4,0.8)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Score */}
        {activeTab === 'score' && (
          <div className="space-y-5">
            <div className="game-card p-6 text-center"
              style={{ border: '1px solid rgba(202,138,4,0.5)', background: 'linear-gradient(135deg, rgba(202,138,4,0.1), rgba(30,58,95,0.3))' }}>
              <div className="text-xs uppercase tracking-widest text-yellow-500/70 mb-2">Current Wealth Level</div>
              <div className="flex items-center justify-center gap-3">
                <Award className="w-10 h-10 text-yellow-400" />
                <span className="text-6xl font-black text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {wealthLevel}
                </span>
              </div>
              <div className="text-sm text-slate-400 mt-2">
                {wealthLevel < 3 ? 'Wealth Apprentice' :
                  wealthLevel < 5 ? 'Rising Investor' :
                  wealthLevel < 7 ? 'Wealth Builder' :
                  wealthLevel < 9 ? 'Financial Master' : 'Abundance Champion'}
              </div>
              <div className="mt-4 mx-auto max-w-xs">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (wealthLevel / 10) * 100)}%`, background: 'linear-gradient(90deg, #ca8a04, #fbbf24)' }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">Level {wealthLevel} of 10</div>
              </div>
            </div>

            <div className="game-card p-5" style={{ border: '1px solid rgba(202,138,4,0.2)' }}>
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-400" />
                Score Breakdown
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: 'Completion Rate',
                    value: logs.length === 0 ? 0 : Math.round((logs.filter(l => l.completed).length / logs.length) * 100),
                    suffix: '%',
                    color: '#10b981',
                  },
                  {
                    label: 'Average Quality',
                    value: logs.filter(l => l.completed).length === 0
                      ? 0
                      : parseFloat((logs.filter(l => l.completed).reduce((s, l) => s + l.quality, 0) / logs.filter(l => l.completed).length).toFixed(1)),
                    suffix: '/5',
                    color: '#f59e0b',
                  },
                  {
                    label: 'Insights Captured',
                    value: logs.filter(l => l.completed && l.insight.trim().length > 0).length,
                    suffix: '',
                    color: '#3b82f6',
                  },
                ].map(({ label, value, suffix, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/40">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="font-bold text-lg" style={{ color, fontFamily: 'Orbitron, monospace' }}>
                      {value}{suffix}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="game-card p-5" style={{ border: '1px solid rgba(202,138,4,0.2)' }}>
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Category Mastery</h3>
              <div className="space-y-2">
                {(Object.keys(CATEGORY_CONFIG) as RitualCategory[]).map(cat => {
                  const cfg = CATEGORY_CONFIG[cat]
                  const catRituals = rituals.filter(r => r.category === cat)
                  const catLogs = logs.filter(l => catRituals.some(r => r.id === l.ritualId) && l.completed)
                  const pct = catRituals.length === 0 ? 0 : Math.min(100, (catLogs.length / Math.max(catRituals.length * 10, 1)) * 100)
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`${cfg.color} flex items-center gap-1`}>
                          <cfg.Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        <span className="text-slate-500">{catLogs.length} completions</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${cfg.bg.replace('/40', '')}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
