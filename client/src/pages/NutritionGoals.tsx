import { useState, useEffect } from 'react'
import { Apple, Target, TrendingUp, Plus, Droplets, BarChart3, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ── Types ──────────────────────────────────────────────────────────────────

interface NutritionTargets {
  protein: number   // grams
  carbs: number     // grams
  fat: number       // grams
  calories: number  // kcal
  water: number     // oz
}

interface NutritionLog {
  date: string
  protein: number
  carbs: number
  fat: number
  calories: number
  water: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const TARGETS_KEY = 'nutrition_targets'

const DEFAULT_TARGETS: NutritionTargets = {
  protein: 150,
  carbs: 200,
  fat: 65,
  calories: 2000,
  water: 80,
}

const DEFAULT_LOG: Omit<NutritionLog, 'date'> = {
  protein: 0,
  carbs: 0,
  fat: 0,
  calories: 0,
  water: 0,
}

type MacroKey = 'protein' | 'carbs' | 'fat' | 'calories' | 'water'

interface MacroMeta {
  key: MacroKey
  label: string
  unit: string
  color: string
  barColor: string
  icon: React.ReactNode
  quickAdds: { label: string; amount: number }[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function logKey(date: string): string {
  return `nutrition_log_${date}`
}

function getLast7Dates(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()
}

function loadTargets(): NutritionTargets {
  try {
    const raw = localStorage.getItem(TARGETS_KEY)
    return raw ? { ...DEFAULT_TARGETS, ...JSON.parse(raw) } : { ...DEFAULT_TARGETS }
  } catch {
    return { ...DEFAULT_TARGETS }
  }
}

function loadLog(date: string): NutritionLog {
  try {
    const raw = localStorage.getItem(logKey(date))
    return raw ? { ...DEFAULT_LOG, date, ...JSON.parse(raw) } : { ...DEFAULT_LOG, date }
  } catch {
    return { ...DEFAULT_LOG, date }
  }
}

function clamp(val: number, min = 0, max = 99999): number {
  return Math.max(min, Math.min(max, val))
}

// ── Progress Bar ───────────────────────────────────────────────────────────

function MacroBar({
  label,
  value,
  target,
  unit,
  barColor,
}: {
  label: string
  value: number
  target: number
  unit: string
  barColor: string
}) {
  const pct = target > 0 ? Math.min(1, value / target) : 0
  const over = value > target

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className={over ? 'text-orange-400 font-semibold' : 'text-slate-300'}>
          {value}
          <span className="text-slate-500">/{target}{unit}</span>
          {over && <span className="text-orange-400"> (+{value - target})</span>}
        </span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct * 100}%`,
            backgroundColor: barColor,
            opacity: over ? 0.6 : 1,
          }}
        />
      </div>
      <div className="text-right text-[10px] text-slate-600">
        {Math.round(pct * 100)}%
      </div>
    </div>
  )
}

// ── Macro Ratio Bar ────────────────────────────────────────────────────────

function MacroRatioBar({
  protein,
  carbs,
  fat,
}: {
  protein: number
  carbs: number
  fat: number
}) {
  const pCal = protein * 4
  const cCal = carbs * 4
  const fCal = fat * 9
  const total = pCal + cCal + fCal

  if (total === 0) {
    return (
      <div className="h-6 rounded-full bg-slate-800 flex items-center justify-center">
        <span className="text-xs text-slate-600">Log macros to see ratio</span>
      </div>
    )
  }

  const pPct = (pCal / total) * 100
  const cPct = (cCal / total) * 100
  const fPct = (fCal / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
        {pPct > 0 && (
          <div
            className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
            style={{ width: `${pPct}%`, backgroundColor: '#3b82f6' }}
            title={`Protein ${Math.round(pPct)}%`}>
            {pPct > 12 ? `${Math.round(pPct)}%` : ''}
          </div>
        )}
        {cPct > 0 && (
          <div
            className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
            style={{ width: `${cPct}%`, backgroundColor: '#f59e0b' }}
            title={`Carbs ${Math.round(cPct)}%`}>
            {cPct > 12 ? `${Math.round(cPct)}%` : ''}
          </div>
        )}
        {fPct > 0 && (
          <div
            className="flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
            style={{ width: `${fPct}%`, backgroundColor: '#f97316' }}
            title={`Fat ${Math.round(fPct)}%`}>
            {fPct > 12 ? `${Math.round(fPct)}%` : ''}
          </div>
        )}
      </div>
      <div className="flex gap-4 justify-center text-[11px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#3b82f6' }} />
          <span className="text-slate-400">Protein {Math.round(pPct)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#f59e0b' }} />
          <span className="text-slate-400">Carbs {Math.round(cPct)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#f97316' }} />
          <span className="text-slate-400">Fat {Math.round(fPct)}%</span>
        </span>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function NutritionGoals() {
  const { toastSuccess } = useToast()
  const today = todayKey()

  const [targets, setTargets]         = useState<NutritionTargets>(DEFAULT_TARGETS)
  const [log, setLog]                 = useState<NutritionLog>({ ...DEFAULT_LOG, date: today })
  const [activeTab, setActiveTab]     = useState<'today' | 'targets' | 'weekly'>('today')
  const [editTargets, setEditTargets] = useState<NutritionTargets>(DEFAULT_TARGETS)
  const [weeklyLogs, setWeeklyLogs]   = useState<NutritionLog[]>([])

  // ── Load ──

  useEffect(() => {
    const t = loadTargets()
    setTargets(t)
    setEditTargets(t)
    setLog(loadLog(today))
    setWeeklyLogs(getLast7Dates().map(d => loadLog(d)))
  }, [today])

  // ── Persist ──

  const saveLog = (updated: NutritionLog) => {
    setLog(updated)
    localStorage.setItem(logKey(today), JSON.stringify(updated))
  }

  const saveTargets = () => {
    setTargets(editTargets)
    localStorage.setItem(TARGETS_KEY, JSON.stringify(editTargets))
    toastSuccess('Goals updated!', 'Your nutrition targets have been saved.')
  }

  // ── Quick-add ──

  const quickAdd = (key: MacroKey, amount: number) => {
    const updated = { ...log, [key]: clamp(log[key] + amount) }
    saveLog(updated)
    if (log[key] < targets[key] && updated[key] >= targets[key]) {
      const labels: Record<MacroKey, string> = {
        protein: 'Protein goal',
        carbs: 'Carbs goal',
        fat: 'Fat goal',
        calories: 'Calorie goal',
        water: 'Water goal',
      }
      toastSuccess(`${labels[key]} reached!`)
    }
  }

  const setMacro = (key: MacroKey, val: number) => {
    saveLog({ ...log, [key]: clamp(val) })
  }

  // ── Macro definitions ──

  const MACROS: MacroMeta[] = [
    {
      key: 'protein',
      label: 'Protein',
      unit: 'g',
      color: 'text-blue-400',
      barColor: '#3b82f6',
      icon: <Target className="w-4 h-4 text-blue-400" />,
      quickAdds: [
        { label: '+10g', amount: 10 },
        { label: '+25g', amount: 25 },
        { label: '+50g', amount: 50 },
      ],
    },
    {
      key: 'carbs',
      label: 'Carbs',
      unit: 'g',
      color: 'text-amber-400',
      barColor: '#f59e0b',
      icon: <Apple className="w-4 h-4 text-amber-400" />,
      quickAdds: [
        { label: '+10g', amount: 10 },
        { label: '+30g', amount: 30 },
        { label: '+50g', amount: 50 },
      ],
    },
    {
      key: 'fat',
      label: 'Fat',
      unit: 'g',
      color: 'text-orange-400',
      barColor: '#f97316',
      icon: <TrendingUp className="w-4 h-4 text-orange-400" />,
      quickAdds: [
        { label: '+10g', amount: 10 },
        { label: '+20g', amount: 20 },
        { label: '+30g', amount: 30 },
      ],
    },
    {
      key: 'calories',
      label: 'Calories',
      unit: 'kcal',
      color: 'text-red-400',
      barColor: '#ef4444',
      icon: <BarChart3 className="w-4 h-4 text-red-400" />,
      quickAdds: [
        { label: '+100', amount: 100 },
        { label: '+250', amount: 250 },
        { label: '+500', amount: 500 },
      ],
    },
    {
      key: 'water',
      label: 'Water',
      unit: 'oz',
      color: 'text-cyan-400',
      barColor: '#06b6d4',
      icon: <Droplets className="w-4 h-4 text-cyan-400" />,
      quickAdds: [
        { label: '+8oz', amount: 8 },
        { label: '+16oz', amount: 16 },
        { label: '+32oz', amount: 32 },
      ],
    },
  ]

  // ── Weekly averages ──

  const weeklyAvg = (key: MacroKey): number => {
    const filled = weeklyLogs.filter(l => l[key] > 0)
    if (filled.length === 0) return 0
    return Math.round(filled.reduce((s, l) => s + l[key], 0) / filled.length)
  }

  // ── Overall daily score ──

  const dailyScore = (() => {
    const scores = MACROS.map(m => {
      const t = targets[m.key]
      if (t === 0) return 1
      return Math.min(1, log[m.key] / t)
    })
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
  })()

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}>
            <Apple className="w-7 h-7 text-green-400" />
            Nutrition Goals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your daily macro targets</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400"
            style={{ fontFamily: 'Orbitron, monospace' }}>
            {dailyScore}%
          </div>
          <div className="text-xs text-slate-500">today's score</div>
        </div>
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-5 gap-2">
        {MACROS.map(m => {
          const pct = targets[m.key] > 0 ? Math.min(1, log[m.key] / targets[m.key]) : 0
          return (
            <div key={m.key} className="game-card p-2 text-center">
              <div className={`text-base font-bold ${m.color}`}
                style={{ fontFamily: 'Orbitron, monospace' }}>
                {log[m.key]}
              </div>
              <div className="text-[9px] text-slate-500 mb-1">{m.unit}</div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct * 100}%`, backgroundColor: m.barColor }}
                />
              </div>
              <div className="text-[9px] text-slate-600 mt-0.5">{m.label}</div>
            </div>
          )
        })}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-xl">
        {(['today', 'targets', 'weekly'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-green-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}>
            {tab === 'today' ? "Today's Log" : tab === 'targets' ? 'My Goals' : 'Weekly'}
          </button>
        ))}
      </div>

      {/* ── TODAY tab ── */}
      {activeTab === 'today' && (
        <div className="space-y-4">

          {/* Macro ratio bar */}
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-slate-400">Macro Ratio (by calories)</span>
            </div>
            <MacroRatioBar
              protein={log.protein}
              carbs={log.carbs}
              fat={log.fat}
            />
          </div>

          {/* Progress bars */}
          <div className="game-card p-5 space-y-5">
            {MACROS.map(m => (
              <MacroBar
                key={m.key}
                label={m.label}
                value={log[m.key]}
                target={targets[m.key]}
                unit={m.unit}
                barColor={m.barColor}
              />
            ))}
          </div>

          {/* Quick-add section */}
          <div className="space-y-3">
            {MACROS.map(m => (
              <div key={m.key} className="game-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  {m.icon}
                  <span className={`text-sm font-semibold ${m.color}`}>{m.label}</span>
                  <span className="text-xs text-slate-600 ml-auto">
                    {log[m.key]} / {targets[m.key]}{m.unit}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Direct input */}
                  <input
                    type="number"
                    min="0"
                    value={log[m.key] === 0 ? '' : log[m.key]}
                    onChange={e => setMacro(m.key, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="game-input w-20 text-sm text-center"
                  />

                  {/* Quick-add buttons */}
                  <div className="flex gap-1.5 flex-wrap">
                    {m.quickAdds.map(qa => (
                      <button
                        key={qa.label}
                        onClick={() => quickAdd(m.key, qa.amount)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-xs transition-colors">
                        <Plus className="w-3 h-3" />
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TARGETS tab ── */}
      {activeTab === 'targets' && (
        <div className="space-y-4">
          <div className="game-card p-5 space-y-4 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-400" />
              <h3 className="font-semibold text-slate-200">Daily Nutrition Goals</h3>
            </div>

            {MACROS.map(m => (
              <div key={m.key}>
                <label className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  {m.icon}
                  {m.label} ({m.unit})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    value={editTargets[m.key]}
                    onChange={e =>
                      setEditTargets(t => ({
                        ...t,
                        [m.key]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="game-input flex-1"
                  />
                  <span className="text-xs text-slate-500 w-12 flex-shrink-0">{m.unit}/day</span>
                </div>
                <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (editTargets[m.key] / (DEFAULT_TARGETS[m.key] * 2)) * 100)}%`,
                      backgroundColor: m.barColor,
                      opacity: 0.5,
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={saveTargets}
              className="w-full py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-2">
              <Target className="w-4 h-4" /> Save Goals
            </button>
          </div>

          {/* Calorie estimation hint */}
          <div className="game-card p-4 bg-slate-800/40">
            <p className="text-xs text-slate-500 font-semibold mb-2">Calorie estimation from macros</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Protein {editTargets.protein}g × 4 = {editTargets.protein * 4} kcal
              &nbsp;·&nbsp;
              Carbs {editTargets.carbs}g × 4 = {editTargets.carbs * 4} kcal
              &nbsp;·&nbsp;
              Fat {editTargets.fat}g × 9 = {editTargets.fat * 9} kcal
              &nbsp;·&nbsp;
              <span className="text-slate-400 font-semibold">
                Total: {editTargets.protein * 4 + editTargets.carbs * 4 + editTargets.fat * 9} kcal
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ── WEEKLY tab ── */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">

          {/* Weekly summary table */}
          <div className="game-card p-4 overflow-x-auto">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-green-400" />
              <h3 className="font-semibold text-slate-200 text-sm">7-Day Summary vs. Goals</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-1.5 pr-2">Macro</th>
                  <th className="text-right py-1.5 px-2">7-day avg</th>
                  <th className="text-right py-1.5 px-2">Goal</th>
                  <th className="text-right py-1.5 pl-2">%</th>
                  <th className="text-right py-1.5 pl-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {MACROS.map(m => {
                  const avg = weeklyAvg(m.key)
                  const pct = targets[m.key] > 0 ? (avg / targets[m.key]) : 0
                  const pass = pct >= 0.8
                  return (
                    <tr key={m.key} className="border-b border-slate-800/50">
                      <td className={`py-2 pr-2 font-medium ${m.color}`}>{m.label}</td>
                      <td className="text-right py-2 px-2 text-slate-300 font-mono">
                        {avg}{m.unit}
                      </td>
                      <td className="text-right py-2 px-2 text-slate-500 font-mono">
                        {targets[m.key]}{m.unit}
                      </td>
                      <td className="text-right py-2 pl-2 font-mono"
                        style={{ color: pct >= 1 ? '#f97316' : pct >= 0.8 ? '#22c55e' : '#ef4444' }}>
                        {Math.round(pct * 100)}%
                      </td>
                      <td className="text-right py-2 pl-2">
                        {pass
                          ? <span className="inline-flex items-center justify-center"><Check className="w-3.5 h-3.5 text-green-400" /></span>
                          : <span className="text-red-400 font-bold">✗</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 7-day avg vs goals bars */}
          <div className="game-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h3 className="font-semibold text-slate-200 text-sm">7-Day Averages vs. Goals</h3>
            </div>

            {MACROS.map(m => {
              const avg = weeklyAvg(m.key)
              const pct = targets[m.key] > 0 ? Math.min(1, avg / targets[m.key]) : 0
              const over = avg > targets[m.key]
              return (
                <div key={m.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${m.color}`}>{m.label}</span>
                    <span className="text-slate-300">
                      avg {avg}{m.unit}
                      <span className="text-slate-600"> / goal {targets[m.key]}{m.unit}</span>
                      {over && <span className="text-orange-400"> (+{avg - targets[m.key]})</span>}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct * 100}%`,
                        backgroundColor: m.barColor,
                        opacity: over ? 0.6 : 1,
                      }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-slate-600">
                    {Math.round(pct * 100)}% of goal
                  </div>
                </div>
              )
            })}
          </div>

          {/* Daily protein chart */}
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Apple className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-slate-400">Daily Protein (7 days)</span>
            </div>
            <div className="flex items-end gap-1.5" style={{ height: 56 }}>
              {weeklyLogs.map((l, i) => {
                const pct = targets.protein > 0 ? Math.min(1, l.protein / targets.protein) : 0
                const isToday = l.date === today
                const label = new Date(l.date + 'T12:00:00')
                  .toLocaleDateString('en-US', { weekday: 'narrow' })
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: 44 }}>
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: Math.max(3, pct * 44),
                          backgroundColor: isToday ? '#3b82f6' : pct >= 0.9 ? '#22c55e' : '#334155',
                        }}
                      />
                    </div>
                    <span className={`text-[9px] ${isToday ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Daily calories chart */}
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-slate-400">Daily Calories (7 days)</span>
            </div>
            <div className="flex items-end gap-1.5" style={{ height: 56 }}>
              {weeklyLogs.map((l, i) => {
                const pct = targets.calories > 0 ? Math.min(1.2, l.calories / targets.calories) : 0
                const isToday = l.date === today
                const over = l.calories > targets.calories
                const label = new Date(l.date + 'T12:00:00')
                  .toLocaleDateString('en-US', { weekday: 'narrow' })
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: 44 }}>
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: Math.max(3, Math.min(1, pct) * 44),
                          backgroundColor: isToday
                            ? '#ef4444'
                            : over
                            ? '#f97316'
                            : pct >= 0.8
                            ? '#22c55e'
                            : '#334155',
                        }}
                      />
                    </div>
                    <span className={`text-[9px] ${isToday ? 'text-red-400 font-bold' : 'text-slate-600'}`}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 border-t border-dashed border-green-500/40" />
              <span className="text-[10px] text-slate-600">Goal: {targets.calories} kcal</span>
            </div>
          </div>

          {/* Daily water chart */}
          <div className="game-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-slate-400">Daily Water (7 days)</span>
            </div>
            <div className="flex items-end gap-1.5" style={{ height: 56 }}>
              {weeklyLogs.map((l, i) => {
                const pct = targets.water > 0 ? Math.min(1, l.water / targets.water) : 0
                const isToday = l.date === today
                const label = new Date(l.date + 'T12:00:00')
                  .toLocaleDateString('en-US', { weekday: 'narrow' })
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: 44 }}>
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: Math.max(3, pct * 44),
                          backgroundColor: isToday ? '#06b6d4' : pct >= 0.9 ? '#22c55e' : '#334155',
                        }}
                      />
                    </div>
                    <span className={`text-[9px] ${isToday ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
