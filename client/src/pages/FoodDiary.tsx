import { useState, useEffect } from 'react'
import { Apple, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink'
type FoodMood = 'energized' | 'satisfied' | 'heavy' | 'light' | 'bloated' | 'nauseous' | 'neutral'

interface FoodEntry {
  id: string
  date: string
  time: string
  meal: MealType
  foods: string
  calories: number
  mood: FoodMood
  hunger: number
  fullness: number
  notes: string
  createdAt: string
}

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', color: '#f59e0b' },
  lunch:     { label: 'Lunch',     emoji: '☀️', color: '#22c55e' },
  dinner:    { label: 'Dinner',    emoji: '🌙', color: '#6366f1' },
  snack:     { label: 'Snack',     emoji: '🍎', color: '#ec4899' },
  drink:     { label: 'Drink',     emoji: '💧', color: '#3b82f6' },
}

const MOOD_CONFIG: Record<FoodMood, { label: string; color: string }> = {
  energized:  { label: 'Energized',  color: '#22c55e' },
  satisfied:  { label: 'Satisfied',  color: '#84cc16' },
  heavy:      { label: 'Heavy',      color: '#f97316' },
  light:      { label: 'Light',      color: '#3b82f6' },
  bloated:    { label: 'Bloated',    color: '#ef4444' },
  nauseous:   { label: 'Nauseous',   color: '#dc2626' },
  neutral:    { label: 'Neutral',    color: '#94a3b8' },
}

const STORAGE_KEY = 'food_diary'

export default function FoodDiary() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState<Omit<FoodEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    meal: 'lunch', foods: '', calories: 0, mood: 'neutral',
    hunger: 7, fullness: 7, notes: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FoodEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.foods.trim()) return
    const e: FoodEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: selectedDate, time: new Date().toTimeString().slice(0, 5), meal: 'lunch', foods: '', calories: 0, mood: 'neutral', hunger: 7, fullness: 7, notes: '' })
    setShowForm(false)
    toastSuccess('Meal logged 🍽️')
  }

  const dayEntries = entries.filter(e => e.date === selectedDate)
  const dayCalories = dayEntries.reduce((s, e) => s + e.calories, 0)
  const totalEntries = entries.length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Apple className="w-7 h-7 text-green-400" />
            Food Diary
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track what you eat and how it makes you feel.</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, date: selectedDate })) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="flex gap-2">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="game-input text-sm flex-1" />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{dayEntries.length}</div>
          <div className="text-xs text-slate-500">Today's Meals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{dayCalories > 0 ? dayCalories : '—'}</div>
          <div className="text-xs text-slate-500">Calories</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{totalEntries}</div>
          <div className="text-xs text-slate-500">Total Logs</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Meal</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="game-input text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(MEAL_CONFIG) as [MealType, typeof MEAL_CONFIG.breakfast][]).map(([k, m]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, meal: k }))}
                className={`px-2.5 py-1 rounded-xl text-xs ${form.meal === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.meal === k ? { background: m.color + '30', color: m.color } : {}}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <textarea value={form.foods} onChange={e => setForm(f => ({ ...f, foods: e.target.value }))}
            placeholder="What did you eat? *" className="game-input w-full h-14 resize-none" autoFocus />
          <div className="flex gap-2">
            <input type="number" value={form.calories || ''} min={0}
              onChange={e => setForm(f => ({ ...f, calories: Number(e.target.value) }))}
              placeholder="Calories" className="game-input w-28 text-sm" />
            <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value as FoodMood }))} className="game-input text-sm flex-1">
              {(Object.entries(MOOD_CONFIG) as [FoodMood, typeof MOOD_CONFIG.neutral][]).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Hunger before: {form.hunger}/10</p>
              <input type="range" min={1} max={10} value={form.hunger}
                onChange={e => setForm(f => ({ ...f, hunger: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Fullness after: {form.fullness}/10</p>
              <input type="range" min={1} max={10} value={form.fullness}
                onChange={e => setForm(f => ({ ...f, fullness: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {dayEntries.map(e => {
          const m = MEAL_CONFIG[e.meal]
          const mood = MOOD_CONFIG[e.mood]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${m.color}` }}>
              <span className="text-xl">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{m.label}</span>
                  <span className="text-xs text-slate-500">{e.time}</span>
                  {e.calories > 0 && <span className="text-xs text-yellow-400">{e.calories} cal</span>}
                </div>
                <p className="text-xs text-slate-300 truncate">{e.foods}</p>
                <span className="text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: mood.color + '20', color: mood.color }}>{mood.label}</span>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {dayEntries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Apple className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log your meals to understand your food patterns.</p>
          </div>
        )}
      </div>
    </div>
  )
}
