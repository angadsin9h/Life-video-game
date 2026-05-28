import { useState } from 'react'
import { Brain, Zap, Target, BarChart3, CheckCircle2, Circle, TrendingUp, Clock, Plus, Award } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'deep_work_log'

interface DeepWorkEntry {
  id: string
  project: string
  task: string
  plannedDuration: number
  actualDuration: number
  focusDepth: number
  distractions: number
  outputQuality: number
  energyBefore: number
  energyAfter: number
  mainBreakthrough: string
  whatHelped: string[]
  whatHurt: string[]
  deepWorkScore: number
  date: string
  createdAt: string
}

const WHAT_HELPED_OPTIONS = [
  'Phone off', 'Door closed', 'Music', 'Timer', 'Clear goal',
  'Pre-planned', 'Well-rested', 'Caffeine', 'Morning slot', 'Evening slot',
]

const WHAT_HURT_OPTIONS = [
  'Notifications', 'Noise', 'Fatigue', 'Unclear goal',
  'Social media', 'Hunger', 'Stress',
]

function calcDeepWorkScore(focusDepth: number, outputQuality: number, distractions: number): number {
  const raw = (focusDepth * 0.4 + outputQuality * 0.4 + (10 - distractions / 2) * 0.2) * 10
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function loadEntries(): DeepWorkEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DeepWorkEntry[]
  } catch { /* ignore */ }
  return []
}

function saveEntries(entries: DeepWorkEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* ignore */ }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const DEFAULT_FORM = {
  project: '',
  task: '',
  plannedDuration: 60,
  actualDuration: 55,
  focusDepth: 7,
  distractions: 2,
  outputQuality: 7,
  energyBefore: 7,
  energyAfter: 6,
  mainBreakthrough: '',
  whatHelped: [] as string[],
  whatHurt: [] as string[],
}

function CheckboxGroup({ options, selected, onChange, accentColor }: {
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
  accentColor: string
}) {
  function toggle(item: string) {
    if (selected.includes(item)) {
      onChange(selected.filter(s => s !== item))
    } else {
      onChange([...selected, item])
    }
  }
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${active ? `${accentColor} text-white border-transparent` : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}
          >
            {active ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <Circle className="w-3 h-3 inline mr-1" />}
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function DeepWorkLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DeepWorkEntry[]>(loadEntries)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...DEFAULT_FORM })

  const last7Days = getLast7Days()
  const today = todayStr()

  // Today's deep work time
  const todayMinutes = entries
    .filter(e => e.date === today)
    .reduce((s, e) => s + e.actualDuration, 0)

  // Weekly bar data
  const weeklyData = last7Days.map(day => {
    const dayMin = entries.filter(e => e.date === day).reduce((s, e) => s + e.actualDuration, 0)
    return { day, minutes: dayMin }
  })
  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1)

  // Deep work ratio
  const totalPlanned = entries.reduce((s, e) => s + e.plannedDuration, 0)
  const totalActual = entries.reduce((s, e) => s + e.actualDuration, 0)
  const dwRatio = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0

  // Best conditions
  const helpCounts: Record<string, number> = {}
  entries.forEach(e => {
    e.whatHelped.forEach(h => {
      helpCounts[h] = (helpCounts[h] ?? 0) + 1
    })
  })
  const bestConditions = Object.entries(helpCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Last 5 sessions
  const last5 = [...entries].reverse().slice(0, 5)

  const liveScore = calcDeepWorkScore(form.focusDepth, form.outputQuality, form.distractions)

  function handleSubmit() {
    const entry: DeepWorkEntry = {
      id: Date.now().toString(),
      project: form.project,
      task: form.task,
      plannedDuration: form.plannedDuration,
      actualDuration: form.actualDuration,
      focusDepth: form.focusDepth,
      distractions: form.distractions,
      outputQuality: form.outputQuality,
      energyBefore: form.energyBefore,
      energyAfter: form.energyAfter,
      mainBreakthrough: form.mainBreakthrough,
      whatHelped: form.whatHelped,
      whatHurt: form.whatHurt,
      deepWorkScore: liveScore,
      date: today,
      createdAt: new Date().toISOString(),
    }
    const updated = [...entries, entry]
    setEntries(updated)
    saveEntries(updated)
    toastSuccess('Deep work logged', `${form.project} — Score ${liveScore}/100`)
    setForm({ ...DEFAULT_FORM })
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Brain className="w-6 h-6 text-violet-400" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
          Deep Work Log
        </h1>
      </div>
      <p className="text-slate-400 text-sm mb-6">Track focus sessions with quality and output.</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="game-card text-center p-3">
          <Clock className="w-4 h-4 text-violet-400 mx-auto mb-1" />
          <div className="text-xl font-black text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {todayMinutes}m
          </div>
          <div className="text-xs text-slate-400">Today</div>
        </div>
        <div className="game-card text-center p-3">
          <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-black text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {dwRatio}%
          </div>
          <div className="text-xs text-slate-400">DW Ratio</div>
        </div>
        <div className="game-card text-center p-3">
          <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-black text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {entries.length}
          </div>
          <div className="text-xs text-slate-400">Sessions</div>
        </div>
      </div>

      {/* Weekly SVG Bar Chart */}
      <div className="game-card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">Weekly Deep Work (minutes)</span>
        </div>
        <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none">
          {weeklyData.map((d, i) => {
            const barH = maxMinutes > 0 ? (d.minutes / maxMinutes) * 60 : 0
            const x = i * 40 + 4
            const y = 60 - barH
            const isToday = d.day === today
            return (
              <g key={d.day}>
                <rect x={x} y={y} width={32} height={barH} rx={4}
                  fill={isToday ? '#7c3aed' : '#334155'} />
                <text x={x + 16} y={76} textAnchor="middle" fontSize={9} fill="#64748b">
                  {new Date(d.day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                </text>
                {d.minutes > 0 && (
                  <text x={x + 16} y={y - 2} textAnchor="middle" fontSize={8} fill="#a78bfa">
                    {d.minutes}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Log Button */}
      {!showForm && (
        <button className="w-full game-btn-primary mb-4 flex items-center justify-center gap-2"
          onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Log Deep Work Session
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="game-card mb-4 border border-violet-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-violet-300">New Deep Work Session</h3>
            <div className="text-sm text-violet-400 font-bold">Score: {liveScore}/100</div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Project</label>
                <input className="game-input w-full mt-1" placeholder="Project name..."
                  value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Specific Task</label>
                <input className="game-input w-full mt-1" placeholder="Task..."
                  value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Planned (min)</label>
                <input type="number" className="game-input w-full mt-1" min={1}
                  value={form.plannedDuration}
                  onChange={e => setForm(f => ({ ...f, plannedDuration: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Actual (min)</label>
                <input type="number" className="game-input w-full mt-1" min={1}
                  value={form.actualDuration}
                  onChange={e => setForm(f => ({ ...f, actualDuration: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Focus Depth: {form.focusDepth}/10</label>
              <input type="range" min={1} max={10} value={form.focusDepth}
                onChange={e => setForm(f => ({ ...f, focusDepth: Number(e.target.value) }))}
                className="w-full accent-violet-500 mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Distractions: {form.distractions} interruptions</label>
              <input type="range" min={0} max={20} value={form.distractions}
                onChange={e => setForm(f => ({ ...f, distractions: Number(e.target.value) }))}
                className="w-full accent-red-500 mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Output Quality: {form.outputQuality}/10</label>
              <input type="range" min={1} max={10} value={form.outputQuality}
                onChange={e => setForm(f => ({ ...f, outputQuality: Number(e.target.value) }))}
                className="w-full accent-violet-500 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Energy Before: {form.energyBefore}/10</label>
                <input type="range" min={1} max={10} value={form.energyBefore}
                  onChange={e => setForm(f => ({ ...f, energyBefore: Number(e.target.value) }))}
                  className="w-full accent-blue-500 mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Energy After: {form.energyAfter}/10</label>
                <input type="range" min={1} max={10} value={form.energyAfter}
                  onChange={e => setForm(f => ({ ...f, energyAfter: Number(e.target.value) }))}
                  className="w-full accent-blue-500 mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">Main Breakthrough</label>
              <input className="game-input w-full mt-1" placeholder="Biggest insight or progress..."
                value={form.mainBreakthrough} onChange={e => setForm(f => ({ ...f, mainBreakthrough: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400">What Helped</label>
              <CheckboxGroup
                options={WHAT_HELPED_OPTIONS}
                selected={form.whatHelped}
                onChange={val => setForm(f => ({ ...f, whatHelped: val }))}
                accentColor="bg-green-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">What Hurt</label>
              <CheckboxGroup
                options={WHAT_HURT_OPTIONS}
                selected={form.whatHurt}
                onChange={val => setForm(f => ({ ...f, whatHurt: val }))}
                accentColor="bg-red-600"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg font-semibold"
                onClick={handleSubmit}>Log Session</button>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg"
                onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Best Conditions */}
      {bestConditions.length > 0 && (
        <div className="game-card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold">Best Conditions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {bestConditions.map(([cond, count]) => (
              <div key={cond} className="flex items-center gap-1 bg-green-600/20 border border-green-500/30 rounded-lg px-2.5 py-1">
                <span className="text-xs text-green-300 font-medium">{cond}</span>
                <span className="text-xs text-green-500">×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last 5 Sessions */}
      {last5.length > 0 && (
        <div className="game-card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold">Last 5 Sessions</span>
          </div>
          <div className="space-y-2">
            {last5.map(e => (
              <div key={e.id} className="flex items-start justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{e.project || 'Untitled'}</div>
                  {e.task && <div className="text-xs text-slate-400 truncate">{e.task}</div>}
                  <div className="text-xs text-slate-500 mt-0.5">{e.date} · {e.actualDuration}min actual / {e.plannedDuration}min planned</div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-sm font-bold text-violet-400">{e.deepWorkScore}/100</div>
                  <div className="text-xs text-slate-500">Focus: {e.focusDepth}/10</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center text-slate-500 py-12">
          <Brain className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">No sessions yet. Start your first deep work block.</p>
        </div>
      )}
    </div>
  )
}
