import { useState, useEffect } from 'react'
import { Apple, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
type EatEmotion = 'hungry' | 'bored' | 'stressed' | 'social' | 'habit' | 'reward' | 'tired' | 'happy'
type Speed = 'slow' | 'normal' | 'fast'

interface MealEntry {
  id: string
  date: string
  time: string
  mealType: MealType
  foods: string
  hungerBefore: number
  fullnessAfter: number
  emotions: EatEmotion[]
  distractions: boolean
  speed: Speed
  enjoyment: number
  notes: string
  createdAt: string
}

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', color: '#f59e0b' },
  lunch:     { label: 'Lunch',     emoji: '☀️', color: '#22c55e' },
  dinner:    { label: 'Dinner',    emoji: '🌙', color: '#6366f1' },
  snack:     { label: 'Snack',     emoji: '🍎', color: '#f97316' },
}

const EMOTION_CONFIG: Record<EatEmotion, { label: string; color: string }> = {
  hungry:   { label: 'Actually Hungry', color: '#22c55e' },
  bored:    { label: 'Bored',           color: '#94a3b8' },
  stressed: { label: 'Stressed',        color: '#ef4444' },
  social:   { label: 'Social',          color: '#3b82f6' },
  habit:    { label: 'Habit',           color: '#f59e0b' },
  reward:   { label: 'Reward',          color: '#a855f7' },
  tired:    { label: 'Tired',           color: '#64748b' },
  happy:    { label: 'Celebratory',     color: '#ec4899' },
}

const STORAGE_KEY = 'mindful_eating'

function HungerScale({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>1 Starving</span><span>{label}: {value}</span><span>10 Stuffed</span>
      </div>
      <input type="range" min={1} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-green-400" />
    </div>
  )
}

export default function MindfulEating() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MealEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState<Omit<MealEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    mealType: 'lunch', foods: '', hungerBefore: 4, fullnessAfter: 7,
    emotions: [], distractions: false, speed: 'normal', enjoyment: 7, notes: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MealEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const toggleEmotion = (em: EatEmotion) => {
    setForm(f => ({
      ...f, emotions: f.emotions.includes(em) ? f.emotions.filter(e => e !== em) : [...f.emotions, em],
    }))
  }

  const submit = () => {
    if (!form.foods.trim()) return
    const e: MealEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), mealType: 'lunch', foods: '', hungerBefore: 4, fullnessAfter: 7, emotions: [], distractions: false, speed: 'normal', enjoyment: 7, notes: '' })
    setShowForm(false)
    toastSuccess('Meal logged 🌱')
  }

  const dayEntries = entries.filter(e => e.date === selectedDate)
  const avgEnjoyment = entries.length
    ? (entries.reduce((s, e) => s + e.enjoyment, 0) / entries.length).toFixed(1) : '—'
  const emotionalCount = entries.filter(e => !e.emotions.includes('hungry') && e.emotions.length > 0).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Apple className="w-7 h-7 text-green-400" />
            Mindful Eating
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Eat with awareness — hunger, emotion, enjoyment.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Meals Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgEnjoyment}</div>
          <div className="text-xs text-slate-500">Avg Enjoyment</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{emotionalCount}</div>
          <div className="text-xs text-slate-500">Emotional Eats</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="game-input text-sm flex-1" />
        <span className="text-xs text-slate-500">{dayEntries.length} meals</span>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Meal</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="game-input text-sm" />
            <select value={form.mealType} onChange={e => setForm(f => ({ ...f, mealType: e.target.value as MealType }))} className="game-input text-sm flex-1">
              {(Object.entries(MEAL_CONFIG) as [MealType, typeof MEAL_CONFIG.lunch][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.foods} onChange={e => setForm(f => ({ ...f, foods: e.target.value }))}
            placeholder="What did you eat? *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <HungerScale value={form.hungerBefore} onChange={v => setForm(f => ({ ...f, hungerBefore: v }))} label="Hunger before" />
          <HungerScale value={form.fullnessAfter} onChange={v => setForm(f => ({ ...f, fullnessAfter: v }))} label="Fullness after" />
          <div>
            <p className="text-xs text-slate-500 mb-2">Why were you eating?</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(EMOTION_CONFIG) as [EatEmotion, typeof EMOTION_CONFIG.hungry][]).map(([k, em]) => (
                <button key={k} onClick={() => toggleEmotion(k)}
                  className={`px-2.5 py-1 rounded-full text-xs ${form.emotions.includes(k) ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                  style={form.emotions.includes(k) ? { background: em.color + '30', color: em.color } : {}}>
                  {em.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            {(['slow', 'normal', 'fast'] as Speed[]).map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, speed: s }))}
                className={`flex-1 py-1.5 rounded-xl text-xs capitalize ${form.speed === s ? 'bg-green-700/30 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                {s}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.distractions} onChange={e => setForm(f => ({ ...f, distractions: e.target.checked }))} className="accent-yellow-400" />
            Eating with distractions (phone, TV, work)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-32">Enjoyment: {form.enjoyment}/10</span>
            <input type="range" min={1} max={10} value={form.enjoyment}
              onChange={e => setForm(f => ({ ...f, enjoyment: Number(e.target.value) }))}
              className="flex-1 h-1 accent-yellow-400" />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {dayEntries.map(e => {
          const m = MEAL_CONFIG[e.mealType]
          const overate = e.fullnessAfter >= 9
          const underate = e.fullnessAfter <= 4
          return (
            <div key={e.id} className="game-card p-3 flex gap-3" style={{ borderLeft: `3px solid ${m.color}` }}>
              <span className="text-2xl">{m.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{e.time} · {m.label}</span>
                  {overate && <span className="text-[10px] px-1.5 rounded bg-red-500/10 text-red-400">overate</span>}
                  {underate && <span className="text-[10px] px-1.5 rounded bg-blue-500/10 text-blue-400">underate</span>}
                  {e.distractions && <span className="text-[10px] text-yellow-500">📱</span>}
                </div>
                <p className="text-xs text-slate-400 truncate">{e.foods}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-600">
                  <span>Hunger: {e.hungerBefore}→{e.fullnessAfter}</span>
                  <span>Enjoy: {e.enjoyment}/10</span>
                  {e.emotions.length > 0 && <span>{e.emotions[0]}</span>}
                </div>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {dayEntries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Apple className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log meals to build awareness around eating habits.</p>
          </div>
        )}
      </div>
    </div>
  )
}
