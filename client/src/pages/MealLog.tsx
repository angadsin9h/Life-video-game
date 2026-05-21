import { useState, useEffect } from 'react'
import { Utensils, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout' | 'late-night'
type MealRating = 'excellent' | 'good' | 'okay' | 'poor'
type MealGoal = 'muscle' | 'fat-loss' | 'maintenance' | 'performance' | 'gut-health' | 'energy' | 'other'

interface MealEntry {
  id: string
  mealType: MealType
  foods: string
  calories: number
  protein: number
  carbs: number
  fats: number
  rating: MealRating
  goal: MealGoal
  howIFeel: string
  date: string
  time: string
  createdAt: string
}

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast:      { label: 'Breakfast',    emoji: '🌅', color: '#f59e0b' },
  lunch:          { label: 'Lunch',        emoji: '☀️', color: '#22c55e' },
  dinner:         { label: 'Dinner',       emoji: '🌙', color: '#3b82f6' },
  snack:          { label: 'Snack',        emoji: '🍎', color: '#ec4899' },
  'pre-workout':  { label: 'Pre-Workout',  emoji: '⚡', color: '#f97316' },
  'post-workout': { label: 'Post-Workout', emoji: '💪', color: '#a855f7' },
  'late-night':   { label: 'Late Night',   emoji: '🦉', color: '#6366f1' },
}

const RATING_CONFIG: Record<MealRating, { label: string; color: string; emoji: string }> = {
  excellent: { label: 'Excellent', color: '#22c55e', emoji: '🌟' },
  good:      { label: 'Good',      color: '#84cc16', emoji: '✅' },
  okay:      { label: 'Okay',      color: '#f59e0b', emoji: '😐' },
  poor:      { label: 'Poor',      color: '#ef4444', emoji: '❌' },
}

const GOAL_CONFIG: Record<MealGoal, { label: string }> = {
  muscle:      { label: 'Muscle Gain'  },
  'fat-loss':  { label: 'Fat Loss'     },
  maintenance: { label: 'Maintenance'  },
  performance: { label: 'Performance'  },
  'gut-health':{ label: 'Gut Health'   },
  energy:      { label: 'Energy'       },
  other:       { label: 'Other'        },
}

const STORAGE_KEY = 'meal_log'

function todayStr() { return new Date().toISOString().split('T')[0] }
function nowTime() { return new Date().toTimeString().slice(0, 5) }

export default function MealLog() {
  const { toastSuccess } = useToast()
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MealEntry, 'id' | 'createdAt'>>({
    mealType: 'lunch', foods: '', calories: 0, protein: 0, carbs: 0, fats: 0,
    rating: 'good', goal: 'maintenance', howIFeel: '',
    date: todayStr(), time: nowTime(),
  })

  useEffect(() => {
    try { setMeals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MealEntry[]) => { setMeals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.foods.trim()) return
    const m: MealEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([m, ...meals])
    setForm(f => ({ ...f, foods: '', calories: 0, protein: 0, carbs: 0, fats: 0, howIFeel: '', date: todayStr(), time: nowTime() }))
    setShowForm(false)
    toastSuccess('Meal logged 🍽️')
  }

  const today = todayStr()
  const todayMeals = meals.filter(m => m.date === today)
  const todayCalories = todayMeals.reduce((s, m) => s + m.calories, 0)
  const todayProtein = todayMeals.reduce((s, m) => s + m.protein, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Utensils className="w-7 h-7 text-green-400" />
            Meal Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track every meal — nutrition, quality, and how it makes you feel.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{todayMeals.length}</div>
          <div className="text-xs text-slate-500">Today's Meals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{todayCalories}</div>
          <div className="text-xs text-slate-500">Today's kcal</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{todayProtein}g</div>
          <div className="text-xs text-slate-500">Protein Today</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Meal</h3>
          <div className="flex gap-2">
            <select value={form.mealType} onChange={e => setForm(f => ({ ...f, mealType: e.target.value as MealType }))} className="game-input text-sm flex-1">
              {(Object.entries(MEAL_CONFIG) as [MealType, typeof MEAL_CONFIG.breakfast][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
            <select value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value as MealGoal }))} className="game-input text-sm flex-1">
              {(Object.entries(GOAL_CONFIG) as [MealGoal, typeof GOAL_CONFIG.muscle][]).map(([k, g]) => (
                <option key={k} value={k}>{g.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.foods} onChange={e => setForm(f => ({ ...f, foods: e.target.value }))}
            placeholder="What did you eat? *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <div className="grid grid-cols-4 gap-2">
            {(['calories', 'protein', 'carbs', 'fats'] as const).map(k => (
              <div key={k}>
                <p className="text-xs text-slate-500 mb-1 capitalize">{k === 'calories' ? 'kcal' : k + 'g'}</p>
                <input type="number" min={0} value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: Number(e.target.value) }))}
                  className="game-input w-full text-sm" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value as MealRating }))} className="game-input text-sm flex-1">
              {(Object.entries(RATING_CONFIG) as [MealRating, typeof RATING_CONFIG.good][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <input value={form.howIFeel} onChange={e => setForm(f => ({ ...f, howIFeel: e.target.value }))}
            placeholder="How do you feel after eating this?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Log Meal</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {meals.map(m => {
          const mt = MEAL_CONFIG[m.mealType]
          const r = RATING_CONFIG[m.rating]
          return (
            <div key={m.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${mt.color}` }}>
              <span className="text-2xl">{mt.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium" style={{ color: mt.color }}>{mt.label}</span>
                  <span className="text-xs">{r.emoji}</span>
                  <span className="text-xs text-slate-500">{m.time} · {m.date}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{m.foods}</p>
                {m.calories > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m.calories} kcal{m.protein > 0 ? ` · P: ${m.protein}g` : ''}{m.carbs > 0 ? ` · C: ${m.carbs}g` : ''}{m.fats > 0 ? ` · F: ${m.fats}g` : ''}
                  </p>
                )}
                {m.howIFeel && <p className="text-xs text-green-300/70 mt-0.5">→ {m.howIFeel}</p>}
              </div>
              <button onClick={() => save(meals.filter(x => x.id !== m.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {meals.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Utensils className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You are what you eat. Start logging every meal.</p>
          </div>
        )}
      </div>
    </div>
  )
}
