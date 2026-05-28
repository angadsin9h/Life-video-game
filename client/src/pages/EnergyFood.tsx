import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FoodEffect = 'energizing' | 'neutral' | 'draining' | 'brain-fog' | 'crash' | 'focus'
type MealTime = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'pre-workout' | 'post-workout'

interface EnergyFoodEntry {
  id: string
  mealTime: MealTime
  effect: FoodEffect
  foods: string
  energyBefore: number
  energyAfter: number
  focusAfter: number
  crashTime: number
  notes: string
  date: string
  createdAt: string
}

const EFFECT_CONFIG: Record<FoodEffect, { label: string; emoji: string; color: string }> = {
  energizing: { label: 'Energizing',  emoji: '⚡', color: '#22c55e' },
  neutral:    { label: 'Neutral',     emoji: '➖', color: '#94a3b8' },
  draining:   { label: 'Draining',    emoji: '🔋', color: '#f97316' },
  'brain-fog':{ label: 'Brain Fog',   emoji: '🌫️', color: '#6366f1' },
  crash:      { label: 'Energy Crash',emoji: '📉', color: '#ef4444' },
  focus:      { label: 'Focus Boost', emoji: '🎯', color: '#3b82f6' },
}

const MEAL_TIME_CONFIG: Record<MealTime, { label: string; emoji: string }> = {
  morning:       { label: 'Morning',      emoji: '🌅' },
  midday:        { label: 'Midday',       emoji: '☀️' },
  afternoon:     { label: 'Afternoon',    emoji: '🕒' },
  evening:       { label: 'Evening',      emoji: '🌆' },
  night:         { label: 'Night',        emoji: '🌙' },
  'pre-workout': { label: 'Pre-Workout',  emoji: '🏃' },
  'post-workout':{ label: 'Post-Workout', emoji: '💪' },
}

const POWER_FOODS = ['Eggs', 'Oatmeal', 'Salmon', 'Avocado', 'Blueberries', 'Nuts', 'Green tea', 'Dark chocolate', 'Spinach', 'Quinoa']

const STORAGE_KEY = 'energy_food_log'

export default function EnergyFood() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EnergyFoodEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EnergyFoodEntry, 'id' | 'createdAt'>>({
    mealTime: 'morning', effect: 'energizing', foods: '', energyBefore: 5,
    energyAfter: 8, focusAfter: 7, crashTime: 0, notes: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: EnergyFoodEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.foods.trim()) return
    const e: EnergyFoodEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, foods: '', notes: '' }))
    setShowForm(false)
    toastSuccess('Food-energy entry logged ⚡')
  }

  const bestFoods = entries.filter(e => e.effect === 'energizing' || e.effect === 'focus')
  const crashFoods = entries.filter(e => e.effect === 'crash' || e.effect === 'brain-fog')
  const avgLift = entries.length ? Math.round(entries.reduce((s, e) => s + (e.energyAfter - e.energyBefore), 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Energy Food Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track how different foods affect your energy and focus levels.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{bestFoods.length}</div>
          <div className="text-xs text-slate-500">Power Foods</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{crashFoods.length}</div>
          <div className="text-xs text-slate-500">Crash Foods</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgLift > 0 ? '+' : ''}{avgLift}</div>
          <div className="text-xs text-slate-500">Avg Energy Δ</div>
        </div>
      </div>

      {bestFoods.length > 0 && (
        <div className="game-card p-3">
          <p className="text-xs text-green-400 font-medium mb-1">⚡ Your Power Foods:</p>
          <p className="text-xs text-slate-400">{[...new Set(bestFoods.map(e => e.foods))].slice(0, 5).join(' · ')}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <p className="text-xs text-slate-500 w-full">Known power foods:</p>
        {POWER_FOODS.map(f => (
          <button key={f} onClick={() => setForm(fo => ({ ...fo, foods: fo.foods ? `${fo.foods}, ${f}` : f }))}
            className="px-2 py-1 bg-green-900/20 text-green-400 rounded-lg text-xs">{f}</button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Food-Energy Entry</h3>
          <div className="flex gap-2">
            <select value={form.mealTime} onChange={e => setForm(f => ({ ...f, mealTime: e.target.value as MealTime }))} className="game-input text-sm flex-1">
              {(Object.entries(MEAL_TIME_CONFIG) as [MealTime, typeof MEAL_TIME_CONFIG.morning][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
            <select value={form.effect} onChange={e => setForm(f => ({ ...f, effect: e.target.value as FoodEffect }))} className="game-input text-sm flex-1">
              {(Object.entries(EFFECT_CONFIG) as [FoodEffect, typeof EFFECT_CONFIG.energizing][]).map(([k, ef]) => (
                <option key={k} value={k}>{ef.emoji} {ef.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.foods} onChange={e => setForm(f => ({ ...f, foods: e.target.value }))}
            placeholder="What did you eat? *" className="game-input w-full h-12 resize-none" autoFocus />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Energy before</p>
              <input type="range" min={1} max={10} value={form.energyBefore}
                onChange={e => setForm(f => ({ ...f, energyBefore: Number(e.target.value) }))}
                className="w-full h-1 accent-slate-400" />
              <p className="text-xs text-center text-slate-500">{form.energyBefore}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Energy after</p>
              <input type="range" min={1} max={10} value={form.energyAfter}
                onChange={e => setForm(f => ({ ...f, energyAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
              <p className="text-xs text-center text-slate-500">{form.energyAfter}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Focus after</p>
              <input type="range" min={1} max={10} value={form.focusAfter}
                onChange={e => setForm(f => ({ ...f, focusAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
              <p className="text-xs text-center text-slate-500">{form.focusAfter}</p>
            </div>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any other notes..." className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const ef = EFFECT_CONFIG[e.effect]
          const mt = MEAL_TIME_CONFIG[e.mealTime]
          const lift = e.energyAfter - e.energyBefore
          return (
            <div key={e.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${ef.color}` }}>
              <span className="text-2xl">{ef.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{e.foods}</span>
                  <span className="text-xs" style={{ color: lift >= 0 ? '#22c55e' : '#ef4444' }}>{lift >= 0 ? '+' : ''}{lift}⚡</span>
                </div>
                <p className="text-xs text-slate-500">{mt.emoji} {mt.label} · {ef.label} · {e.date}</p>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Food is fuel. Track what powers you and what drains you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
