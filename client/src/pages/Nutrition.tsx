import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Apple, Plus, Trash2, ChevronLeft, ChevronRight, Settings2, X, Search } from 'lucide-react'

interface NutritionEntry {
  id: number
  date: string
  meal_type: string
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  quantity: number
  unit: string
  notes?: string
}

interface Totals { calories: number; protein_g: number; carbs_g: number; fat_g: number }
interface Goals { calories: number; protein_g: number; carbs_g: number; fat_g: number }
interface WeekDay { date: string; calories: number; protein_g: number; count: number }
interface CommonFood {
  name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; unit: string
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
const MEAL_COLORS: Record<string, string> = {
  breakfast: 'border-yellow-500/30 bg-yellow-900/5',
  lunch: 'border-orange-500/30 bg-orange-900/5',
  dinner: 'border-indigo-500/30 bg-indigo-900/5',
  snack: 'border-green-500/30 bg-green-900/5',
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  const over = goal > 0 && value > goal
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-semibold ${over ? 'text-red-400' : 'text-slate-200'}`}>
          {Math.round(value)}g <span className="text-slate-600">/ {goal}g</span>
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function dateStr(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

export default function Nutrition() {
  const today = dateStr(0)
  const [date, setDate] = useState(today)
  const [entries, setEntries] = useState<NutritionEntry[]>([])
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })
  const [goals, setGoals] = useState<Goals>({ calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65 })
  const [weekData, setWeekData] = useState<WeekDay[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [commonFoods, setCommonFoods] = useState<CommonFood[]>([])
  const [foodSearch, setFoodSearch] = useState('')
  const [selectedFood, setSelectedFood] = useState<CommonFood | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    meal_type: 'snack',
    food_name: '',
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    quantity: 1,
    unit: 'serving',
    notes: '',
  })
  const [goalForm, setGoalForm] = useState({ calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65 })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [dayRes, weekRes] = await Promise.all([
        axios.get<{ entries: NutritionEntry[]; totals: Totals; goals: Goals }>(`/api/nutrition/${date}`),
        axios.get<WeekDay[]>('/api/nutrition/history/week'),
      ])
      setEntries(dayRes.data.entries)
      setTotals(dayRes.data.totals)
      setGoals(dayRes.data.goals)
      setGoalForm(dayRes.data.goals)
      setWeekData(weekRes.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [date])

  const loadFoods = async (q: string) => {
    const res = await axios.get<CommonFood[]>(`/api/nutrition/foods/common${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    setCommonFoods(res.data)
  }

  useEffect(() => {
    if (showForm) loadFoods(foodSearch)
  }, [showForm, foodSearch])

  const selectFood = (food: CommonFood) => {
    setSelectedFood(food)
    setForm(f => ({
      ...f,
      food_name: food.name,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      unit: food.unit,
      quantity: 1,
    }))
    setFoodSearch('')
  }

  const submit = async () => {
    if (!form.food_name.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/nutrition', { date, ...form })
      setForm({ meal_type: 'snack', food_name: '', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, quantity: 1, unit: 'serving', notes: '' })
      setSelectedFood(null)
      setFoodSearch('')
      setShowForm(false)
      load()
    } finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    await axios.delete(`/api/nutrition/${id}`)
    load()
  }

  const saveGoals = async () => {
    await axios.put('/api/nutrition/goals', goalForm)
    setGoals(goalForm)
    setShowGoals(false)
    load()
  }

  const calPct = goals.calories > 0 ? Math.min(100, (totals.calories / goals.calories) * 100) : 0
  const calOver = totals.calories > goals.calories
  const remaining = Math.max(0, goals.calories - totals.calories)

  const byMeal: Record<string, NutritionEntry[]> = {}
  for (const e of entries) {
    if (!byMeal[e.meal_type]) byMeal[e.meal_type] = []
    byMeal[e.meal_type].push(e)
  }

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const isToday = date === today

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Apple className="w-7 h-7 text-green-400" />
          Nutrition
        </h1>
        <button onClick={() => setShowGoals(true)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between game-card px-4 py-3">
        <button onClick={() => setDate(d => { const dt = new Date(d); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0] })}
          className="text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="font-semibold text-slate-200">{displayDate}</div>
          {isToday && <div className="text-xs text-violet-400">Today</div>}
        </div>
        <button onClick={() => setDate(d => { const dt = new Date(d); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0] })}
          disabled={date >= today}
          className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calorie ring + macros */}
      <div className="game-card p-5">
        <div className="flex items-center gap-6">
          {/* Calorie ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none"
                stroke={calOver ? '#ef4444' : calPct > 80 ? '#f59e0b' : '#22c55e'}
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 * (1 - calPct / 100)}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                {totals.calories}
              </div>
              <div className="text-xs text-slate-500">kcal</div>
            </div>
          </div>
          {/* Calorie numbers */}
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Eaten</span>
              <span className="font-bold text-slate-200">{totals.calories} / {goals.calories} kcal</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ${calOver ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${calPct}%` }}
              />
            </div>
            <div className="text-xs text-slate-500">
              {calOver
                ? <span className="text-red-400">+{totals.calories - goals.calories} over goal</span>
                : <span className="text-green-400">{remaining} kcal remaining</span>
              }
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="mt-4 space-y-3">
          <MacroBar label="Protein" value={totals.protein_g} goal={goals.protein_g} color="bg-blue-500" />
          <MacroBar label="Carbs" value={totals.carbs_g} goal={goals.carbs_g} color="bg-yellow-500" />
          <MacroBar label="Fat" value={totals.fat_g} goal={goals.fat_g} color="bg-orange-500" />
        </div>

        {/* Macro % breakdown */}
        {totals.calories > 0 && (
          <div className="mt-4 flex gap-2 text-xs">
            {[
              { label: 'P', grams: totals.protein_g, cal: totals.protein_g * 4, color: 'bg-blue-500' },
              { label: 'C', grams: totals.carbs_g, cal: totals.carbs_g * 4, color: 'bg-yellow-500' },
              { label: 'F', grams: totals.fat_g, cal: totals.fat_g * 9, color: 'bg-orange-500' },
            ].map(m => {
              const pct = Math.round((m.cal / totals.calories) * 100)
              return (
                <div key={m.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${m.color}`} />
                  <span className="text-slate-400">{m.label} {pct}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Week bars */}
      {weekData.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">7-Day Overview</h3>
          <div className="flex items-end gap-1 h-16">
            {weekData.map(d => {
              const pct = goals.calories > 0 ? Math.min(100, (d.calories / goals.calories) * 100) : 0
              const isSelected = d.date === date
              return (
                <button key={d.date} onClick={() => setDate(d.date)}
                  className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex-1 relative flex items-end">
                    <div
                      className={`w-full rounded-t transition-all ${isSelected ? 'bg-green-400' : pct > 100 ? 'bg-red-500/60' : pct > 0 ? 'bg-green-500/60 group-hover:bg-green-500/80' : 'bg-slate-700'}`}
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <div className={`text-[9px] ${isSelected ? 'text-green-400' : 'text-slate-600'}`}>
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add food button */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-600 text-slate-500 hover:border-green-500/50 hover:text-green-400 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Food
      </button>

      {/* Add food form */}
      {showForm && (
        <div className="game-card p-5 border border-green-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Log Food</h3>
            <button onClick={() => { setShowForm(false); setSelectedFood(null); setFoodSearch('') }} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Food search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                ref={searchRef}
                autoFocus
                type="text"
                placeholder="Search common foods…"
                value={foodSearch}
                onChange={e => setFoodSearch(e.target.value)}
                className="game-input w-full pl-9"
              />
            </div>
            {commonFoods.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800">
                {commonFoods.slice(0, 8).map(food => (
                  <button key={food.name} onClick={() => selectFood(food)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700 text-left transition-colors border-b border-slate-700 last:border-0">
                    <span className="text-sm text-slate-200 truncate flex-1">{food.name}</span>
                    <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{food.calories} kcal</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Meal type */}
            <div className="flex gap-2 flex-wrap">
              {MEAL_TYPES.map(mt => (
                <button key={mt} onClick={() => setForm(f => ({ ...f, meal_type: mt }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.meal_type === mt ? 'bg-green-600/30 text-green-400 border border-green-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{MEAL_ICONS[mt]}</span> {mt}
                </button>
              ))}
            </div>

            <input type="text" placeholder="Food name *" value={form.food_name}
              onChange={e => setForm(f => ({ ...f, food_name: e.target.value }))}
              className="game-input w-full" />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Quantity</label>
                <input type="number" min="0.1" step="0.1" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 1 }))}
                  className="game-input w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Unit</label>
                <input type="text" value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="game-input w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Calories (per unit)</label>
                <input type="number" min="0" value={form.calories}
                  onChange={e => setForm(f => ({ ...f, calories: parseFloat(e.target.value) || 0 }))}
                  className="game-input w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Protein (g)</label>
                <input type="number" min="0" step="0.1" value={form.protein_g}
                  onChange={e => setForm(f => ({ ...f, protein_g: parseFloat(e.target.value) || 0 }))}
                  className="game-input w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Carbs (g)</label>
                <input type="number" min="0" step="0.1" value={form.carbs_g}
                  onChange={e => setForm(f => ({ ...f, carbs_g: parseFloat(e.target.value) || 0 }))}
                  className="game-input w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Fat (g)</label>
                <input type="number" min="0" step="0.1" value={form.fat_g}
                  onChange={e => setForm(f => ({ ...f, fat_g: parseFloat(e.target.value) || 0 }))}
                  className="game-input w-full" />
              </div>
            </div>

            {form.quantity !== 1 && (
              <div className="text-xs text-slate-500 bg-slate-800 rounded-lg p-2">
                Total: {Math.round(form.calories * form.quantity)} kcal · P: {(form.protein_g * form.quantity).toFixed(1)}g · C: {(form.carbs_g * form.quantity).toFixed(1)}g · F: {(form.fat_g * form.quantity).toFixed(1)}g
              </div>
            )}

            <button onClick={submit} disabled={saving || !form.food_name.trim()}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Adding…' : 'Add to Log'}
            </button>
          </div>
        </div>
      )}

      {/* Meal groups */}
      {MEAL_TYPES.map(mt => {
        const mealEntries = byMeal[mt] || []
        if (!mealEntries.length) return null
        const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0)
        const mealProt = mealEntries.reduce((s, e) => s + e.protein_g, 0)
        return (
          <div key={mt} className={`game-card p-4 border ${MEAL_COLORS[mt]}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <span>{MEAL_ICONS[mt]}</span>
                <span className="capitalize">{mt}</span>
              </h3>
              <div className="text-xs text-slate-500">
                {mealCals} kcal · {mealProt.toFixed(0)}g P
              </div>
            </div>
            <div className="space-y-2">
              {mealEntries.map(e => (
                <div key={e.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{e.food_name}</div>
                    <div className="text-xs text-slate-500">
                      {e.quantity !== 1 ? `${e.quantity} ${e.unit} · ` : ''}{e.calories} kcal · P:{e.protein_g}g C:{e.carbs_g}g F:{e.fat_g}g
                    </div>
                  </div>
                  <button onClick={() => remove(e.id)} className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-10 text-slate-600">
          <Apple className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No meals logged yet today</p>
          <p className="text-xs mt-1">Hit "Add Food" to start tracking</p>
        </div>
      )}

      {/* Goals modal */}
      {showGoals && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowGoals(false)}>
          <div className="game-card p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-200">Daily Goals</h3>
              <button onClick={() => setShowGoals(false)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'calories', label: 'Calories (kcal)' },
                { key: 'protein_g', label: 'Protein (g)' },
                { key: 'carbs_g', label: 'Carbs (g)' },
                { key: 'fat_g', label: 'Fat (g)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-slate-500 block mb-1">{label}</label>
                  <input type="number" min="0"
                    value={goalForm[key as keyof typeof goalForm]}
                    onChange={e => setGoalForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                    className="game-input w-full" />
                </div>
              ))}
            </div>
            <button onClick={saveGoals} className="w-full mt-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors">
              Save Goals
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
