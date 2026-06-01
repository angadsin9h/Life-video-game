import { useState, useEffect, useCallback } from 'react'
import { Moon, Sun, Plus, Trash2, Save, Star, Clock, Target, TrendingUp, CheckCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'sleep_ritual_designer'

interface WindDownStep {
  id: string
  name: string
  duration: number
  category: 'body' | 'mind' | 'environment' | 'digital' | 'spiritual'
  description: string
  isDefault: boolean
  active: boolean
}

interface SleepRitualLog {
  id: string
  date: string
  completedSteps: string[]
  startTime: string
  bedtime: string
  qualityScore: 1 | 2 | 3 | 4 | 5
  stressLevel: 1 | 2 | 3 | 4 | 5
  relaxationLevel: 1 | 2 | 3 | 4 | 5
  notes: string
}

interface StorageData {
  steps: WindDownStep[]
  logs: SleepRitualLog[]
}

const DEFAULT_STEPS: Omit<WindDownStep, 'id' | 'active'>[] = [
  { name: 'Phone away', duration: 0, category: 'digital', description: 'Put phone in another room or airplane mode', isDefault: true },
  { name: 'Dim lights', duration: 5, category: 'environment', description: 'Reduce all light sources', isDefault: true },
  { name: 'Light stretching', duration: 10, category: 'body', description: 'Gentle neck/shoulder/hip stretches', isDefault: true },
  { name: 'Gratitude journaling', duration: 5, category: 'mind', description: 'Write 3 things grateful for', isDefault: true },
  { name: 'Reading', duration: 20, category: 'mind', description: 'Physical book, nothing stimulating', isDefault: true },
  { name: 'Deep breathing', duration: 5, category: 'body', description: '4-7-8 breathing technique', isDefault: true },
  { name: 'Room temperature', duration: 2, category: 'environment', description: 'Set to 65-68°F / 18-20°C', isDefault: true },
]

const CAT_EMOJI: Record<WindDownStep['category'], string> = {
  body: '🧘',
  mind: '📖',
  environment: '🏠',
  digital: '📵',
  spiritual: '🙏',
}

const CAT_COLOR: Record<WindDownStep['category'], string> = {
  body: 'text-green-400',
  mind: 'text-violet-400',
  environment: 'text-blue-400',
  digital: 'text-orange-400',
  spiritual: 'text-cyan-400',
}

const QUALITY_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-cyan-500']

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StorageData
  } catch { /* ignore */ }
  return {
    steps: DEFAULT_STEPS.map((s, i) => ({ ...s, id: `default_${i}`, active: true })),
    logs: [],
  }
}

function saveData(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function calcStreak(logs: SleepRitualLog[], steps: WindDownStep[]): number {
  let streak = 0
  const d = new Date()
  const activeCount = steps.filter(s => s.active).length
  while (true) {
    const ds = d.toISOString().slice(0, 10)
    const log = logs.find(l => l.date === ds)
    if (log && activeCount > 0 && log.completedSteps.length >= activeCount * 0.5) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function getLast21Days(): string[] {
  const days: string[] = []
  const d = new Date()
  for (let i = 20; i >= 0; i--) {
    const dd = new Date(d)
    dd.setDate(dd.getDate() - i)
    days.push(dd.toISOString().slice(0, 10))
  }
  return days
}

function getLast30Logs(logs: SleepRitualLog[]): SleepRitualLog[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return logs.filter(l => l.date >= cutoffStr)
}

type Tab = 'ritual' | 'tonight' | 'history'

export default function SleepRitualDesigner() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<StorageData>(loadData)
  const [activeTab, setActiveTab] = useState<Tab>('ritual')

  // My Ritual tab
  const [newStep, setNewStep] = useState({
    name: '',
    duration: 5,
    category: 'mind' as WindDownStep['category'],
    description: '',
  })

  // Tonight tab
  const [tonightCompleted, setTonightCompleted] = useState<string[]>([])
  const [startTime, setStartTime] = useState('')
  const [bedtime, setBedtime] = useState('')
  const [qualityScore, setQualityScore] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [stressLevel, setStressLevel] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [relaxationLevel, setRelaxationLevel] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [tonightNotes, setTonightNotes] = useState('')
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    const existing = data.logs.find(l => l.date === todayStr())
    if (existing) {
      setTonightCompleted(existing.completedSteps)
      setStartTime(existing.startTime)
      setBedtime(existing.bedtime)
      setQualityScore(existing.qualityScore)
      setStressLevel(existing.stressLevel)
      setRelaxationLevel(existing.relaxationLevel)
      setTonightNotes(existing.notes)
    }
  }, [])

  const updateData = useCallback((updated: StorageData) => {
    setData(updated)
    saveData(updated)
  }, [])

  const activeSteps = data.steps.filter(s => s.active)
  const totalDuration = data.steps.filter(s => s.active).reduce((sum, s) => sum + s.duration, 0)
  const streak = calcStreak(data.logs, data.steps)
  const completionPct = activeSteps.length > 0
    ? Math.round((tonightCompleted.length / activeSteps.length) * 100)
    : 0

  function addStep() {
    if (!newStep.name.trim()) return
    const step: WindDownStep = {
      ...newStep,
      id: Date.now().toString(),
      isDefault: false,
      active: true,
    }
    updateData({ ...data, steps: [...data.steps, step] })
    setNewStep({ name: '', duration: 5, category: 'mind', description: '' })
    toastSuccess('Step added!')
  }

  function deleteStep(id: string) {
    updateData({ ...data, steps: data.steps.filter(s => s.id !== id) })
  }

  function toggleStepActive(id: string) {
    updateData({
      ...data,
      steps: data.steps.map(s => s.id === id ? { ...s, active: !s.active } : s),
    })
  }

  function toggleTonightStep(id: string) {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const nowStr = `${hh}:${mm}`

    let updated: string[]
    if (tonightCompleted.includes(id)) {
      updated = tonightCompleted.filter(s => s !== id)
    } else {
      updated = [...tonightCompleted, id]
      if (!startTime) setStartTime(nowStr)
    }
    setTonightCompleted(updated)

    if (updated.length === activeSteps.length && activeSteps.length > 0) {
      setAllDone(true)
    }
  }

  function saveTonightLog() {
    const log: SleepRitualLog = {
      id: Date.now().toString(),
      date: todayStr(),
      completedSteps: tonightCompleted,
      startTime,
      bedtime,
      qualityScore,
      stressLevel,
      relaxationLevel,
      notes: tonightNotes,
    }
    const filtered = data.logs.filter(l => l.date !== todayStr())
    updateData({ ...data, logs: [...filtered, log] })
    toastSuccess('Ritual complete! 🌙')
  }

  // History stats
  const last30 = getLast30Logs(data.logs)
  const completionRate = last30.length > 0
    ? Math.round((last30.filter(l => activeSteps.length > 0 && l.completedSteps.length >= activeSteps.length * 0.8).length / 30) * 100)
    : 0
  const avgRelaxation = last30.length > 0
    ? (last30.reduce((s, l) => s + l.relaxationLevel, 0) / last30.length).toFixed(1)
    : '—'
  const avgStressBefore = last30.length > 0
    ? (last30.reduce((s, l) => s + l.stressLevel, 0) / last30.length).toFixed(1)
    : '—'

  // Best steps
  const stepCompletionCounts = data.steps.map(step => ({
    step,
    count: data.logs.filter(l => l.completedSteps.includes(step.id)).length,
  })).sort((a, b) => b.count - a.count).slice(0, 5)

  const last21Days = getLast21Days()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Sleep Ritual Designer
          </h1>
          <p className="text-slate-400 text-sm mt-1">Design and track your perfect wind-down ritual</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-400">🌙 {streak}d</div>
          <div className="text-xs text-slate-500">streak</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['ritual', 'tonight', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {t === 'ritual' ? 'My Ritual' : t === 'tonight' ? 'Tonight' : 'History'}
          </button>
        ))}
      </div>

      {/* MY RITUAL TAB */}
      {activeTab === 'ritual' && (
        <div className="space-y-4">
          <div className="game-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Total ritual time:</span>
            </div>
            <span className="text-lg font-bold text-indigo-400">{totalDuration} min</span>
          </div>

          {/* Steps list */}
          <div className="space-y-2">
            {data.steps.map(step => (
              <div
                key={step.id}
                className={`game-card p-3 flex items-center gap-3 transition-opacity ${step.active ? '' : 'opacity-50'}`}
              >
                <span className="text-2xl">{CAT_EMOJI[step.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${step.active ? 'text-white' : 'text-slate-500'}`}>
                      {step.name}
                    </span>
                    <span className={`text-xs ${CAT_COLOR[step.category]}`}>{step.category}</span>
                    {step.duration > 0 && (
                      <span className="text-xs text-slate-500">{step.duration}m</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{step.description}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleStepActive(step.id)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${step.active ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30' : 'bg-slate-700 text-slate-500 hover:bg-slate-600'}`}
                  >
                    {step.active ? 'ON' : 'OFF'}
                  </button>
                  {!step.isDefault && (
                    <button onClick={() => deleteStep(step.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add custom step */}
          <div className="game-card p-4 space-y-3 border border-indigo-500/20">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Add Custom Step
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="game-input w-full"
                placeholder="Step name"
                value={newStep.name}
                onChange={e => setNewStep(s => ({ ...s, name: e.target.value }))}
              />
              <select
                className="game-input w-full"
                value={newStep.category}
                onChange={e => setNewStep(s => ({ ...s, category: e.target.value as WindDownStep['category'] }))}
              >
                {(Object.keys(CAT_EMOJI) as WindDownStep['category'][]).map(c => (
                  <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Duration (minutes)</label>
                <input
                  type="number"
                  className="game-input w-full"
                  min={0}
                  value={newStep.duration}
                  onChange={e => setNewStep(s => ({ ...s, duration: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <input
                  className="game-input w-full"
                  placeholder="Brief description"
                  value={newStep.description}
                  onChange={e => setNewStep(s => ({ ...s, description: e.target.value }))}
                />
              </div>
            </div>
            <button
              onClick={addStep}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>
        </div>
      )}

      {/* TONIGHT TAB */}
      {activeTab === 'tonight' && (
        <div className="space-y-4">
          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">
                Tonight — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <div className="text-right">
                <div className={`text-lg font-bold ${completionPct >= 80 ? 'text-green-400' : completionPct >= 50 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {completionPct}%
                </div>
                <div className="text-xs text-slate-500">{tonightCompleted.length}/{activeSteps.length}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>

            {startTime && (
              <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Started at {startTime}
              </div>
            )}

            {/* Step checklist */}
            <div className="space-y-2">
              {activeSteps.map(step => {
                const done = tonightCompleted.includes(step.id)
                return (
                  <button
                    key={step.id}
                    onClick={() => toggleTonightStep(step.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${done ? 'bg-indigo-900/30 border border-indigo-700/40' : 'bg-slate-800 border border-slate-700 hover:border-slate-600'}`}
                  >
                    <span className="text-xl">{CAT_EMOJI[step.category]}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${done ? 'text-indigo-300 line-through' : 'text-white'}`}>{step.name}</div>
                      <div className="text-xs text-slate-500">{step.description}{step.duration > 0 ? ` · ${step.duration}m` : ''}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                      {done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                )
              })}
              {activeSteps.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <Moon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No active steps. Enable steps in the My Ritual tab.
                </div>
              )}
            </div>

            {/* Completion form */}
            {(allDone || tonightCompleted.length > 0) && (
              <div className="mt-4 space-y-4 border-t border-slate-700 pt-4">
                <h4 className="text-sm font-semibold text-slate-300">Log Tonight's Ritual</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Lights out (bedtime)</label>
                    <input
                      type="time"
                      className="game-input w-full"
                      value={bedtime}
                      onChange={e => setBedtime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Start time</label>
                    <input
                      type="time"
                      className="game-input w-full"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Sleep quality (1-5)</label>
                  <div className="flex gap-1.5">
                    {([1, 2, 3, 4, 5] as const).map(n => (
                      <button
                        key={n}
                        onClick={() => setQualityScore(n)}
                        className={`flex-1 py-2 rounded-lg text-sm transition-colors flex items-center justify-center ${qualityScore >= n ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-500 hover:bg-slate-600'}`}
                      >
                        <Star className={`w-4 h-4 ${qualityScore >= n ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Stress before ritual (1-5)</label>
                    <div className="flex gap-1">
                      {([1, 2, 3, 4, 5] as const).map(n => (
                        <button
                          key={n}
                          onClick={() => setStressLevel(n)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${stressLevel >= n ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-600 hover:bg-slate-600'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Relaxation after (1-5)</label>
                    <div className="flex gap-1">
                      {([1, 2, 3, 4, 5] as const).map(n => (
                        <button
                          key={n}
                          onClick={() => setRelaxationLevel(n)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${relaxationLevel >= n ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-600 hover:bg-slate-600'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  className="game-input w-full text-sm"
                  rows={2}
                  placeholder="Any notes for tonight?"
                  value={tonightNotes}
                  onChange={e => setTonightNotes(e.target.value)}
                />

                <button
                  onClick={saveTonightLog}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Ritual Log
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-indigo-400">{streak}</div>
              <div className="text-xs text-slate-500 mt-1">Day streak</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{completionRate}%</div>
              <div className="text-xs text-slate-500 mt-1">30d completion</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-violet-400">{data.logs.length}</div>
              <div className="text-xs text-slate-500 mt-1">Total nights</div>
            </div>
          </div>

          {/* 21-day heatmap */}
          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> 21-Day Quality Heatmap
            </h3>
            <div className="grid grid-cols-7 gap-1.5">
              {last21Days.map(day => {
                const log = data.logs.find(l => l.date === day)
                const quality = log?.qualityScore
                const isToday = day === todayStr()
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-full aspect-square rounded-md transition-all ${quality ? `${QUALITY_COLORS[quality]} opacity-80` : 'bg-slate-700'} ${isToday ? 'ring-2 ring-white/30' : ''}`}
                      title={`${day}: ${quality ? `Quality ${quality}/5` : 'No log'}`}
                    />
                    <span className="text-xs text-slate-600">
                      {new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'narrow' })}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-2 justify-end">
              <span className="text-xs text-slate-500">Quality:</span>
              {[1, 2, 3, 4, 5].map(q => (
                <div key={q} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-sm ${QUALITY_COLORS[q]}`} />
                  <span className="text-xs text-slate-500">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stress vs Relaxation */}
          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" /> Ritual Effectiveness (30d avg)
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Stress Before</span>
                  <span className="text-sm font-bold text-red-400">{avgStressBefore}/5</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500/60 rounded-full transition-all"
                    style={{ width: avgStressBefore !== '—' ? `${(parseFloat(avgStressBefore) / 5) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Relaxation After</span>
                  <span className="text-sm font-bold text-green-400">{avgRelaxation}/5</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500/60 rounded-full transition-all"
                    style={{ width: avgRelaxation !== '—' ? `${(parseFloat(avgRelaxation) / 5) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              {avgStressBefore !== '—' && avgRelaxation !== '—' && (
                <div className={`text-xs text-center py-1.5 rounded-lg ${parseFloat(avgRelaxation) > parseFloat(avgStressBefore) ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'}`}>
                  {parseFloat(avgRelaxation) > parseFloat(avgStressBefore)
                    ? '✓ Ritual is working — relaxation higher than stress before'
                    : '⚠ Ritual may need adjustment — stress not reducing enough'}
                </div>
              )}
            </div>
          </div>

          {/* Best performing steps */}
          {stepCompletionCounts.some(s => s.count > 0) && (
            <div className="game-card p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" /> Most Completed Steps
              </h3>
              <div className="space-y-2">
                {stepCompletionCounts.filter(s => s.count > 0).map(({ step, count }) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <span className="text-lg">{CAT_EMOJI[step.category]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm text-white">{step.name}</span>
                        <span className="text-xs text-slate-400">{count}x</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500/70 rounded-full"
                          style={{ width: `${Math.min((count / Math.max(...stepCompletionCounts.map(s => s.count), 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent logs */}
          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Recent Nights</h3>
            <div className="space-y-2">
              {[...data.logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center gap-3 p-2.5 bg-slate-700/50 rounded-xl">
                  <div className="text-sm text-slate-400 w-24 flex-shrink-0">{log.date}</div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${activeSteps.length > 0 ? Math.round((log.completedSteps.length / activeSteps.length) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {log.completedSteps.length} steps{log.bedtime ? ` · 💤 ${log.bedtime}` : ''}
                      {log.startTime ? ` · ▶ ${log.startTime}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3 h-3 ${n <= log.qualityScore ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                    ))}
                  </div>
                </div>
              ))}
              {data.logs.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No ritual logs yet. Complete tonight's ritual!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
