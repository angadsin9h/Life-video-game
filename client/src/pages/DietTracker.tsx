import { useState, useEffect } from 'react'
import { Apple, Plus, Trash2, TrendingUp, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface FoodEntry {
  id: string
  date: string
  meal: MealType
  food: string
  calories: number
  protein: number
  carbs: number
  fat: number
  notes: string
}

interface MacroGoal {
  calories: number
  protein: number
  carbs: number
  fat: number
}

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', color: '#f59e0b' },
  lunch:     { label: 'Lunch',     emoji: '☀️', color: '#22c55e' },
  dinner:    { label: 'Dinner',    emoji: '🌙', color: '#6366f1' },
  snack:     { label: 'Snack',     emoji: '🍎', color: '#ec4899' },
}

const STORAGE_KEY = 'diet_tracker'
const GOALS_KEY = 'diet_goals'
const DEFAULT_GOALS: MacroGoal = { calories: 2000, protein: 150, carbs: 200, fat: 65 }

export default function DietTracker() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [goals, setGoals] = useState<MacroGoal>(DEFAULT_GOALS)
  const [date, setDate] = useState(today)
  const [showForm, setShowForm] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [form, setForm] = useState({ meal: 'breakfast' as MealType, food: '', calories: 0, protein: 0, carbs: 0, fat: 0, notes: '' })
  const [goalForm, setGoalForm] = useState(DEFAULT_GOALS)

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      const g = JSON.parse(localStorage.getItem(GOALS_KEY) || 'null')
      if (g) { setGoals(g); setGoalForm(g) }
    } catch { /**/ }
  }, [])

  const save = (u: FoodEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.food.trim()) return
    const e: FoodEntry = { id: Date.now().toString(), date, ...form }
    save([e, ...entries])
    setForm({ meal: form.meal, food: '', calories: 0, protein: 0, carbs: 0, fat: 0, notes: '' })
    toastSuccess(`${form.food} logged!`)
  }

  const saveGoals = () => {
    setGoals(goalForm)
    localStorage.setItem(GOALS_KEY, JSON.stringify(goalForm))
    setShowGoals(false)
    toastSuccess('Goals updated')
  }

  const dayEntries = entries.filter(e => e.date === date)
  const totals = dayEntries.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    protein: acc.protein + e.protein,
    carbs: acc.carbs + e.carbs,
    fat: acc.fat + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const MacroBar = ({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) => (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }}>{value}g / {goal}g</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / goal) * 100)}%`, background: color }} />
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Apple className="w-7 h-7 text-green-400" />
            Diet Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track calories and macros daily.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGoals(true)} className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">Goals</button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-2">
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0]) }}
          className="px-3 py-1 bg-slate-800 rounded-lg text-slate-400 hover:text-white text-sm">←</button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="game-input text-sm flex-1 text-center" />
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0]) }}
          className="px-3 py-1 bg-slate-800 rounded-lg text-slate-400 hover:text-white text-sm">→</button>
      </div>

      {/* Macro summary */}
      <div className="game-card p-4 border border-green-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-white">{totals.calories}</span>
            <span className="text-slate-500 text-sm"> / {goals.calories} kcal</span>
          </div>
          <div className={`text-sm font-semibold ${totals.calories > goals.calories ? 'text-red-400' : 'text-green-400'}`}>
            {totals.calories > goals.calories ? `+${totals.calories - goals.calories} over` : `${goals.calories - totals.calories} left`}
          </div>
        </div>
        <div className="h-3 bg-slate-800 rounded-full mb-4">
          <div className="h-full rounded-full transition-all bg-green-500" style={{ width: `${Math.min(100, (totals.calories / goals.calories) * 100)}%` }} />
        </div>
        <div className="space-y-2">
          <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="#3b82f6" />
          <MacroBar label="Carbs"   value={totals.carbs}   goal={goals.carbs}   color="#f59e0b" />
          <MacroBar label="Fat"     value={totals.fat}     goal={goals.fat}     color="#ec4899" />
        </div>
      </div>

      {showGoals && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Daily Goals</h3>
          {(['calories', 'protein', 'carbs', 'fat'] as const).map(k => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-sm text-slate-400 w-20 capitalize">{k}</span>
              <input type="number" value={goalForm[k]} min={0}
                onChange={e => setGoalForm(f => ({ ...f, [k]: Number(e.target.value) }))}
                className="game-input flex-1 text-sm text-center" />
              <span className="text-xs text-slate-500">{k === 'calories' ? 'kcal' : 'g'}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={saveGoals} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowGoals(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Food</h3>
          <div className="flex gap-1.5 flex-wrap">
            {(Object.entries(MEAL_CONFIG) as [MealType, typeof MEAL_CONFIG.breakfast][]).map(([k, m]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, meal: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.meal === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.meal === k ? { background: m.color + '30', color: m.color } : {}}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <input value={form.food} onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
            placeholder="Food name *" className="game-input w-full" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 w-16">Calories</span>
              <input type="number" value={form.calories} min={0}
                onChange={e => setForm(f => ({ ...f, calories: Number(e.target.value) }))}
                className="game-input flex-1 text-sm text-center" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 w-16">Protein</span>
              <input type="number" value={form.protein} min={0}
                onChange={e => setForm(f => ({ ...f, protein: Number(e.target.value) }))}
                className="game-input flex-1 text-sm text-center" />
              <span className="text-xs text-slate-600">g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 w-16">Carbs</span>
              <input type="number" value={form.carbs} min={0}
                onChange={e => setForm(f => ({ ...f, carbs: Number(e.target.value) }))}
                className="game-input flex-1 text-sm text-center" />
              <span className="text-xs text-slate-600">g</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 w-16">Fat</span>
              <input type="number" value={form.fat} min={0}
                onChange={e => setForm(f => ({ ...f, fat: Number(e.target.value) }))}
                className="game-input flex-1 text-sm text-center" />
              <span className="text-xs text-slate-600">g</span>
            </div>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Log Food</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Day entries by meal */}
      {(Object.keys(MEAL_CONFIG) as MealType[]).map(meal => {
        const mealEntries = dayEntries.filter(e => e.meal === meal)
        if (mealEntries.length === 0) return null
        const m = MEAL_CONFIG[meal]
        const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0)
        return (
          <div key={meal}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium" style={{ color: m.color }}>{m.emoji} {m.label}</span>
              <span className="text-xs text-slate-600">{mealCals} kcal</span>
            </div>
            <div className="space-y-1.5">
              {mealEntries.map(e => (
                <div key={e.id} className="game-card p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-sm text-white">{e.food}</span>
                    <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                      <span>{e.calories} kcal</span>
                      {e.protein > 0 && <span className="text-blue-400">P: {e.protein}g</span>}
                      {e.carbs > 0 && <span className="text-yellow-400">C: {e.carbs}g</span>}
                      {e.fat > 0 && <span className="text-pink-400">F: {e.fat}g</span>}
                    </div>
                    {e.notes && <p className="text-xs text-slate-600 mt-0.5 italic">{e.notes}</p>}
                  </div>
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {dayEntries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Apple className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No meals logged for {date === today ? 'today' : date}.</p>
        </div>
      )}
    </div>
  )
}
