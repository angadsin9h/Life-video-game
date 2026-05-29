import { useState, useEffect, useMemo } from 'react'
import { Apple, Droplets, Plus, Trash2, Save, TrendingUp, Target, ChevronDown, ChevronUp, BarChart3, CheckCircle, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'nutrition_planner_log'

interface FoodEntry {
  id: string
  name: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fat: number
  notes: string
}

interface NutritionGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
}

interface DailyNutrition {
  id: string
  date: string
  entries: FoodEntry[]
  waterGlasses: number
  supplements: string[]
  energyLevel: 1 | 2 | 3 | 4 | 5
  notes: string
  goals: NutritionGoals
}

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  water: 8,
}

const MEAL_LABELS: Record<FoodEntry['meal'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const MEAL_ORDER: FoodEntry['meal'][] = ['breakfast', 'lunch', 'dinner', 'snack']

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function getStoredLogs(): DailyNutrition[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLogs(logs: DailyNutrition[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

function emptyDay(date: string, goals: NutritionGoals): DailyNutrition {
  return {
    id: Date.now().toString(),
    date,
    entries: [],
    waterGlasses: 0,
    supplements: [],
    energyLevel: 3,
    notes: '',
    goals,
  }
}

function totalMacros(entries: FoodEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function MacroBar({
  label,
  value,
  goal,
  color,
  unit = 'g',
}: {
  label: string
  value: number
  goal: number
  color: string
  unit?: string
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span className="font-medium">{label}</span>
        <span>
          {Math.round(value)}/{goal}
          {unit} &nbsp;
          <span className="text-slate-500">{pct}%</span>
        </span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function WaterTracker({
  glasses,
  goal,
  onChange,
}: {
  glasses: number
  goal: number
  onChange: (n: number) => void
}) {
  const total = Math.max(goal, 8)
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < glasses
        return (
          <button
            key={i}
            onClick={() => onChange(filled ? i : i + 1)}
            title={`${i + 1} glass${i + 1 !== 1 ? 'es' : ''}`}
            className={`w-9 h-10 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-105 ${
              filled
                ? 'border-blue-400 bg-blue-900/50'
                : 'border-slate-600 bg-slate-800 opacity-50'
            }`}
          >
            <Droplets className={`w-4 h-4 ${filled ? 'text-blue-400' : 'text-slate-600'}`} />
          </button>
        )
      })}
    </div>
  )
}

type Tab = 'today' | 'history' | 'goals'

export default function NutritionPlanner() {
  const { toastSuccess } = useToast()
  const today = todayStr()

  const [logs, setLogs] = useState<DailyNutrition[]>([])
  const [tab, setTab] = useState<Tab>('today')
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [draftGoals, setDraftGoals] = useState<NutritionGoals>(DEFAULT_GOALS)

  // food entry form
  const [form, setForm] = useState<Omit<FoodEntry, 'id'>>({
    name: '',
    meal: 'breakfast',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    notes: '',
  })

  useEffect(() => {
    const stored = getStoredLogs()
    setLogs(stored)
    const todayLog = stored.find((l) => l.date === today)
    if (todayLog) setDraftGoals(todayLog.goals)
    else {
      const last = stored[0]
      if (last) setDraftGoals(last.goals)
    }
  }, [today])

  const todayLog = useMemo(() => {
    return logs.find((l) => l.date === today) ?? emptyDay(today, draftGoals)
  }, [logs, today, draftGoals])

  function updateToday(updated: DailyNutrition) {
    const next = logs.filter((l) => l.date !== today)
    const sorted = [updated, ...next].sort((a, b) => b.date.localeCompare(a.date))
    setLogs(sorted)
    saveLogs(sorted)
  }

  function addFood() {
    if (!form.name.trim()) return
    const entry: FoodEntry = { id: Date.now().toString(), ...form }
    updateToday({ ...todayLog, entries: [...todayLog.entries, entry] })
    setForm({ name: '', meal: form.meal, calories: 0, protein: 0, carbs: 0, fat: 0, notes: '' })
    toastSuccess('Food entry added!')
  }

  function removeFood(id: string) {
    updateToday({ ...todayLog, entries: todayLog.entries.filter((e) => e.id !== id) })
  }

  function setWater(n: number) {
    updateToday({ ...todayLog, waterGlasses: n })
    if (n >= todayLog.goals.water) toastSuccess('Hydration goal reached!')
  }

  function saveGoals() {
    updateToday({ ...todayLog, goals: draftGoals })
    setGoalsOpen(false)
    toastSuccess('Goals saved!')
  }

  const totals = useMemo(() => totalMacros(todayLog.entries), [todayLog.entries])

  // last 7 days for weekly summary
  const last7 = useMemo(() => {
    const days: { date: string; calories: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const log = logs.find((l) => l.date === ds)
      days.push({ date: ds, calories: log ? totalMacros(log.entries).calories : 0 })
    }
    return days
  }, [logs])

  const weeklyAvg = useMemo(() => {
    const withData = last7.filter((d) => d.calories > 0)
    if (!withData.length) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return logs
      .filter((l) => last7.some((d) => d.date === l.date))
      .reduce(
        (acc, l, _, arr) => {
          const m = totalMacros(l.entries)
          return {
            calories: acc.calories + m.calories / arr.length,
            protein: acc.protein + m.protein / arr.length,
            carbs: acc.carbs + m.carbs / arr.length,
            fat: acc.fat + m.fat / arr.length,
          }
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
  }, [logs, last7])

  const maxCalories = Math.max(...last7.map((d) => d.calories), todayLog.goals.calories, 1)

  const groupedEntries = useMemo(() => {
    const groups: Record<FoodEntry['meal'], FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
    for (const e of todayLog.entries) groups[e.meal].push(e)
    return groups
  }, [todayLog.entries])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          <Apple className="w-7 h-7 text-green-400" />
          Nutrition Planner
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track macros, hydration, and daily nutrition goals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
        {(['today', 'history', 'goals'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
              tab === t
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === 'today' && (
        <div className="space-y-5">
          {/* Macro progress bars */}
          <div className="game-card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Macro Progress</h3>
            </div>
            <MacroBar
              label="Calories"
              value={totals.calories}
              goal={todayLog.goals.calories}
              color="#f97316"
              unit=" kcal"
            />
            <MacroBar label="Protein" value={totals.protein} goal={todayLog.goals.protein} color="#3b82f6" />
            <MacroBar label="Carbs" value={totals.carbs} goal={todayLog.goals.carbs} color="#22c55e" />
            <MacroBar label="Fat" value={totals.fat} goal={todayLog.goals.fat} color="#eab308" />
          </div>

          {/* Water tracker */}
          <div className="game-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-slate-200 text-sm">Hydration</h3>
              </div>
              <span className="text-sm text-blue-400 font-semibold">
                {todayLog.waterGlasses}/{todayLog.goals.water} glasses
              </span>
            </div>
            <WaterTracker
              glasses={todayLog.waterGlasses}
              goal={todayLog.goals.water}
              onChange={setWater}
            />
          </div>

          {/* Add food entry */}
          <div className="game-card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-violet-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Add Food Entry</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="game-input text-sm col-span-2"
                placeholder="Food name (e.g. Chicken breast)"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <select
                className="game-input text-sm"
                value={form.meal}
                onChange={(e) => setForm((f) => ({ ...f, meal: e.target.value as FoodEntry['meal'] }))}
              >
                {MEAL_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {MEAL_LABELS[m]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                className="game-input text-sm"
                placeholder="Calories (kcal)"
                value={form.calories || ''}
                onChange={(e) => setForm((f) => ({ ...f, calories: parseInt(e.target.value) || 0 }))}
              />
              <input
                type="number"
                min="0"
                className="game-input text-sm"
                placeholder="Protein (g)"
                value={form.protein || ''}
                onChange={(e) => setForm((f) => ({ ...f, protein: parseInt(e.target.value) || 0 }))}
              />
              <input
                type="number"
                min="0"
                className="game-input text-sm"
                placeholder="Carbs (g)"
                value={form.carbs || ''}
                onChange={(e) => setForm((f) => ({ ...f, carbs: parseInt(e.target.value) || 0 }))}
              />
              <input
                type="number"
                min="0"
                className="game-input text-sm"
                placeholder="Fat (g)"
                value={form.fat || ''}
                onChange={(e) => setForm((f) => ({ ...f, fat: parseInt(e.target.value) || 0 }))}
              />
              <input
                className="game-input text-sm"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <button
              onClick={addFood}
              disabled={!form.name.trim()}
              className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>

          {/* Entries grouped by meal */}
          {MEAL_ORDER.filter((m) => groupedEntries[m].length > 0).map((meal) => {
            const mealEntries = groupedEntries[meal]
            const mealTotals = totalMacros(mealEntries)
            return (
              <div key={meal} className="game-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-300 text-sm">{MEAL_LABELS[meal]}</h4>
                  <span className="text-xs text-slate-500">
                    {mealTotals.calories} kcal · P {mealTotals.protein}g · C {mealTotals.carbs}g · F {mealTotals.fat}g
                  </span>
                </div>
                <div className="space-y-2">
                  {mealEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-2 py-2 border-b border-slate-700/60 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 font-medium truncate">{entry.name}</div>
                        {entry.notes && (
                          <div className="text-xs text-slate-500 truncate italic">{entry.notes}</div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 text-right shrink-0">
                        <div className="text-orange-400 font-semibold">{entry.calories} kcal</div>
                        <div>P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g</div>
                      </div>
                      <button
                        onClick={() => removeFood(entry.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {todayLog.entries.length === 0 && (
            <div className="text-center py-8 text-slate-600">
              <Apple className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No food logged yet today. Add your first entry above.</p>
            </div>
          )}

          {/* Goals collapsible */}
          <div className="game-card">
            <button
              onClick={() => setGoalsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-400" />
                <span className="font-semibold text-slate-200 text-sm">Daily Goals</span>
              </div>
              {goalsOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {goalsOpen && (
              <div className="px-5 pb-5 space-y-3 border-t border-slate-700 pt-4">
                {(
                  [
                    { key: 'calories', label: 'Calories (kcal)', max: 5000 },
                    { key: 'protein', label: 'Protein (g)', max: 300 },
                    { key: 'carbs', label: 'Carbs (g)', max: 500 },
                    { key: 'fat', label: 'Fat (g)', max: 200 },
                    { key: 'water', label: 'Water (glasses)', max: 20 },
                  ] as { key: keyof NutritionGoals; label: string; max: number }[]
                ).map(({ key, label, max }) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 w-36 shrink-0">{label}</label>
                    <input
                      type="number"
                      min="0"
                      max={max}
                      className="game-input text-sm flex-1"
                      value={draftGoals[key]}
                      onChange={(e) =>
                        setDraftGoals((g) => ({ ...g, [key]: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                ))}
                <button
                  onClick={saveGoals}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Save className="w-4 h-4" />
                  Save Goals
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Weekly SVG bar chart */}
          <div className="game-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <h3 className="font-semibold text-slate-200 text-sm">7-Day Calorie Overview</h3>
            </div>
            <svg viewBox="0 0 280 80" className="w-full" style={{ height: 90 }}>
              {last7.map((d, i) => {
                const barH = maxCalories > 0 ? (d.calories / maxCalories) * 60 : 0
                const x = i * 40 + 10
                const isToday = d.date === today
                const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'narrow',
                })
                return (
                  <g key={d.date}>
                    <rect
                      x={x}
                      y={70 - barH}
                      width={24}
                      height={barH}
                      rx="3"
                      fill={isToday ? '#f97316' : '#3b82f6'}
                      opacity={d.calories === 0 ? 0.2 : 0.8}
                    />
                    <text x={x + 12} y={78} textAnchor="middle" fontSize="7" fill={isToday ? '#f97316' : '#94a3b8'}>
                      {dayLabel}
                    </text>
                    {d.calories > 0 && (
                      <text x={x + 12} y={66 - barH} textAnchor="middle" fontSize="6" fill="#cbd5e1">
                        {d.calories}
                      </text>
                    )}
                  </g>
                )
              })}
              {/* Goal line */}
              <line
                x1="5"
                y1={70 - (todayLog.goals.calories / maxCalories) * 60}
                x2="275"
                y2={70 - (todayLog.goals.calories / maxCalories) * 60}
                stroke="#f9731640"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            </svg>
            <div className="text-xs text-slate-500 text-center mt-1">
              Dashed line = calorie goal ({todayLog.goals.calories} kcal)
            </div>
          </div>

          {/* Weekly average macros */}
          <div className="game-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Weekly Average Macros</h3>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              {(
                [
                  { label: 'Calories', value: weeklyAvg.calories, unit: 'kcal', color: 'text-orange-400' },
                  { label: 'Protein', value: weeklyAvg.protein, unit: 'g', color: 'text-blue-400' },
                  { label: 'Carbs', value: weeklyAvg.carbs, unit: 'g', color: 'text-green-400' },
                  { label: 'Fat', value: weeklyAvg.fat, unit: 'g', color: 'text-yellow-400' },
                ] as { label: string; value: number; unit: string; color: string }[]
              ).map(({ label, value, unit, color }) => (
                <div key={label} className="bg-slate-700/50 rounded-lg p-3">
                  <div className={`text-lg font-bold ${color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {Math.round(value)}
                  </div>
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-xs text-slate-600">{unit}/day</div>
                </div>
              ))}
            </div>
          </div>

          {/* Past days */}
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <Apple className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No history yet. Start logging today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const t = totalMacros(log.entries)
                return (
                  <div key={log.id} className="game-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-300">{log.date}</span>
                      <div className="flex items-center gap-2">
                        {t.calories >= log.goals.calories && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                        <span className="text-xs text-orange-400 font-bold">{t.calories} kcal</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      P {Math.round(t.protein)}g · C {Math.round(t.carbs)}g · F {Math.round(t.fat)}g ·{' '}
                      {log.waterGlasses} glasses · {log.entries.length} items
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* GOALS TAB */}
      {tab === 'goals' && (
        <div className="game-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-slate-200">Daily Nutrition Goals</h3>
          </div>
          {(
            [
              { key: 'calories', label: 'Calories', unit: 'kcal', max: 5000 },
              { key: 'protein', label: 'Protein', unit: 'g', max: 300 },
              { key: 'carbs', label: 'Carbohydrates', unit: 'g', max: 500 },
              { key: 'fat', label: 'Fat', unit: 'g', max: 200 },
              { key: 'water', label: 'Water', unit: 'glasses', max: 20 },
            ] as { key: keyof NutritionGoals; label: string; unit: string; max: number }[]
          ).map(({ key, label, unit, max }) => (
            <div key={key}>
              <label className="text-xs text-slate-400 block mb-1">
                {label} ({unit})
              </label>
              <input
                type="number"
                min="0"
                max={max}
                className="game-input w-full text-sm"
                value={draftGoals[key]}
                onChange={(e) =>
                  setDraftGoals((g) => ({ ...g, [key]: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
          ))}
          <button
            onClick={saveGoals}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 mt-2"
          >
            <Save className="w-4 h-4" />
            Save Goals
          </button>
        </div>
      )}
    </div>
  )
}
