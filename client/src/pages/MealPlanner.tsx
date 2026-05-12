import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Apple, Plus, Trash2, Check, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Meal {
  id: number
  date: string
  meal_type: string
  name: string
  calories: number
  prep_minutes: number
  ingredients: string | null
  notes: string | null
  completed: number
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅', time: '7-9am' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️', time: '12-2pm' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙', time: '6-8pm' },
  { id: 'snack', label: 'Snack', emoji: '🍎', time: 'Anytime' },
]

const MEAL_TEMPLATES: Record<string, string[]> = {
  breakfast: ['Oatmeal with berries', 'Scrambled eggs + toast', 'Greek yogurt + granola', 'Smoothie bowl', 'Avocado toast'],
  lunch: ['Grilled chicken salad', 'Buddha bowl', 'Turkey wrap', 'Lentil soup', 'Salmon + quinoa'],
  dinner: ['Stir-fried vegetables + rice', 'Pasta with marinara', 'Grilled salmon + veggies', 'Chicken curry', 'Beef tacos'],
  snack: ['Apple + almond butter', 'Mixed nuts', 'Hummus + veggies', 'Protein bar', 'Greek yogurt'],
}

function getDayLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function MealPlanner() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()
  const [days, setDays] = useState<string[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [selectedDay, setSelectedDay] = useState(today)
  const [showAdd, setShowAdd] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', calories: '', prep_minutes: '', ingredients: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await axios.get<{ days: string[]; meals: Meal[] }>('/api/meal-plan/week')
    setDays(res.data.days)
    setMeals(res.data.meals)
    if (!res.data.days.includes(selectedDay)) {
      setSelectedDay(res.data.days[0] || today)
    }
  }, [today])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const dayMeals = meals.filter(m => m.date === selectedDay)
  const dayCalories = dayMeals.reduce((s, m) => s + m.calories, 0)
  const dayCompleted = dayMeals.filter(m => m.completed).length

  const addMeal = async (mealType: string) => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await axios.post('/api/meal-plan', {
        date: selectedDay,
        meal_type: mealType,
        name: form.name,
        calories: parseInt(form.calories) || 0,
        prep_minutes: parseInt(form.prep_minutes) || 0,
        ingredients: form.ingredients || null,
        notes: form.notes || null,
      })
      setForm({ name: '', calories: '', prep_minutes: '', ingredients: '', notes: '' })
      setShowAdd(null)
      await load()
      toastSuccess('Meal added!')
    } finally { setSaving(false) }
  }

  const toggleComplete = async (meal: Meal) => {
    await axios.patch(`/api/meal-plan/${meal.id}/complete`, { completed: !meal.completed })
    setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, completed: m.completed ? 0 : 1 } : m))
  }

  const deleteMeal = async (id: number) => {
    await axios.delete(`/api/meal-plan/${id}`)
    setMeals(prev => prev.filter(m => m.id !== id))
  }

  const selectedDayIdx = days.indexOf(selectedDay)
  const prevDay = () => { if (selectedDayIdx > 0) setSelectedDay(days[selectedDayIdx - 1]) }
  const nextDay = () => { if (selectedDayIdx < days.length - 1) setSelectedDay(days[selectedDayIdx + 1]) }

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Apple className="w-7 h-7 text-green-400" />
          Meal Planner
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Plan your meals for the week</p>
      </div>

      {/* Day navigation */}
      <div className="game-card p-3">
        <div className="flex items-center gap-3">
          <button onClick={prevDay} disabled={selectedDayIdx <= 0}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none">
            {days.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  d === selectedDay ? 'bg-green-600/30 text-green-400 border border-green-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                }`}>
                {d === today ? 'Today' : new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
              </button>
            ))}
          </div>
          <button onClick={nextDay} disabled={selectedDayIdx >= days.length - 1}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day summary */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-200">{getDayLabel(selectedDay)}</h2>
        <div className="flex gap-3 text-xs text-slate-500">
          {dayCalories > 0 && <span>{dayCalories} kcal planned</span>}
          {dayMeals.length > 0 && <span>{dayCompleted}/{dayMeals.length} eaten</span>}
        </div>
      </div>

      {/* Meal slots */}
      <div className="space-y-4">
        {MEAL_TYPES.map(mt => {
          const meal = dayMeals.find(m => m.meal_type === mt.id)
          const isAdding = showAdd === mt.id
          return (
            <div key={mt.id} className="game-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{mt.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-300">{mt.label}</div>
                    <div className="text-xs text-slate-600">{mt.time}</div>
                  </div>
                </div>
                {!meal && !isAdding && (
                  <button onClick={() => setShowAdd(mt.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>

              {meal ? (
                <div className={`flex items-center gap-3 ${meal.completed ? 'opacity-60' : ''}`}>
                  <button onClick={() => toggleComplete(meal)}
                    className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      meal.completed ? 'bg-green-600 border-green-500' : 'border-slate-600 hover:border-green-500'
                    }`}>
                    {meal.completed && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${meal.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {meal.name}
                    </div>
                    <div className="flex gap-3 mt-0.5">
                      {meal.calories > 0 && <span className="text-xs text-slate-600">{meal.calories} kcal</span>}
                      {meal.prep_minutes > 0 && (
                        <span className="text-xs text-slate-600 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />{meal.prep_minutes}m prep
                        </span>
                      )}
                    </div>
                    {meal.ingredients && <div className="text-xs text-slate-600 mt-0.5">{meal.ingredients}</div>}
                  </div>
                  <button onClick={() => deleteMeal(meal.id)} className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : isAdding ? (
                <div className="space-y-2 mt-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(MEAL_TEMPLATES[mt.id] || []).map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, name: t }))}
                        className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700 transition-colors">
                        {t}
                      </button>
                    ))}
                  </div>
                  <input autoFocus placeholder="Meal name…" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="game-input w-full text-sm" />
                  <div className="flex gap-2">
                    <input placeholder="Calories" type="number" value={form.calories}
                      onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
                      className="game-input w-24 text-sm" />
                    <input placeholder="Prep min" type="number" value={form.prep_minutes}
                      onChange={e => setForm(f => ({ ...f, prep_minutes: e.target.value }))}
                      className="game-input w-24 text-sm" />
                    <input placeholder="Ingredients…" value={form.ingredients}
                      onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                      className="game-input flex-1 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addMeal(mt.id)} disabled={saving || !form.name.trim()}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                      Add
                    </button>
                    <button onClick={() => { setShowAdd(null); setForm({ name: '', calories: '', prep_minutes: '', ingredients: '', notes: '' }) }}
                      className="px-3 py-2 bg-slate-700 text-slate-400 rounded-xl hover:bg-slate-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-700 italic">Not planned</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
