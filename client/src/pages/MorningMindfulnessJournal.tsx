import { useState, useEffect } from 'react'
import { Sun, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MorningMood = 'groggy' | 'neutral' | 'okay' | 'good' | 'energized' | 'excellent'
type MorningIntention = 'growth' | 'rest' | 'creation' | 'connection' | 'service' | 'learning' | 'focus' | 'balance' | 'joy' | 'healing'

interface MorningEntry {
  id: string
  mood: MorningMood
  intention: MorningIntention
  gratitude1: string
  gratitude2: string
  gratitude3: string
  mainFocus: string
  affirmation: string
  challenge: string
  energyLevel: number
  sleepQuality: number
  date: string
  createdAt: string
}

const MOOD_CONFIG: Record<MorningMood, { label: string; emoji: string; color: string }> = {
  groggy:    { label: 'Groggy',    emoji: '😴', color: '#94a3b8' },
  neutral:   { label: 'Neutral',   emoji: '😐', color: '#6366f1' },
  okay:      { label: 'Okay',      emoji: '🙂', color: '#3b82f6' },
  good:      { label: 'Good',      emoji: '😊', color: '#22c55e' },
  energized: { label: 'Energized', emoji: '⚡', color: '#f59e0b' },
  excellent: { label: 'Excellent', emoji: '🚀', color: '#a855f7' },
}

const INTENTION_CONFIG: Record<MorningIntention, { label: string; emoji: string }> = {
  growth:     { label: 'Growth',     emoji: '🌱' },
  rest:       { label: 'Rest',       emoji: '😌' },
  creation:   { label: 'Creation',   emoji: '🎨' },
  connection: { label: 'Connection', emoji: '❤️' },
  service:    { label: 'Service',    emoji: '🤝' },
  learning:   { label: 'Learning',   emoji: '📚' },
  focus:      { label: 'Focus',      emoji: '🎯' },
  balance:    { label: 'Balance',    emoji: '⚖️' },
  joy:        { label: 'Joy',        emoji: '✨' },
  healing:    { label: 'Healing',    emoji: '🌿' },
}

const STORAGE_KEY = 'morning_mindfulness_journal'

export default function MorningMindfulnessJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MorningEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MorningEntry, 'id' | 'createdAt'>>({
    mood: 'good', intention: 'growth', gratitude1: '', gratitude2: '', gratitude3: '',
    mainFocus: '', affirmation: '', challenge: '', energyLevel: 7, sleepQuality: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MorningEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.gratitude1.trim() && !form.mainFocus.trim()) return
    const e: MorningEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, gratitude1: '', gratitude2: '', gratitude3: '', mainFocus: '', affirmation: '', challenge: '' }))
    setShowForm(false)
    toastSuccess('Morning journal complete — own the day ☀️')
  }

  const streak = (() => {
    let count = 0
    const today = new Date().toISOString().split('T')[0]
    const dates = entries.map(e => e.date).sort((a, b) => b.localeCompare(a))
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      if (dates[i] === expected.toISOString().split('T')[0]) count++
      else break
    }
    return count
  })()

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-amber-400" />
            Morning Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Start each day with intention, gratitude, and focus.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Morning
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">
            {entries.length ? Math.round(entries.reduce((s, e) => s + e.energyLevel, 0) / entries.length) : 0}/10
          </div>
          <div className="text-xs text-slate-500">Avg Energy</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Good morning ☀️</h3>
          <div className="flex gap-2">
            <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value as MorningMood }))} className="game-input text-sm flex-1">
              {(Object.entries(MOOD_CONFIG) as [MorningMood, typeof MOOD_CONFIG.good][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
            <select value={form.intention} onChange={e => setForm(f => ({ ...f, intention: e.target.value as MorningIntention }))} className="game-input text-sm flex-1">
              {(Object.entries(INTENTION_CONFIG) as [MorningIntention, typeof INTENTION_CONFIG.growth][]).map(([k, i]) => (
                <option key={k} value={k}>{i.emoji} {i.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-amber-400 font-medium">3 Gratitudes</p>
          <input value={form.gratitude1} onChange={e => setForm(f => ({ ...f, gratitude1: e.target.value }))}
            placeholder="I'm grateful for..." className="game-input w-full text-sm" autoFocus />
          <input value={form.gratitude2} onChange={e => setForm(f => ({ ...f, gratitude2: e.target.value }))}
            placeholder="I'm grateful for..." className="game-input w-full text-sm" />
          <input value={form.gratitude3} onChange={e => setForm(f => ({ ...f, gratitude3: e.target.value }))}
            placeholder="I'm grateful for..." className="game-input w-full text-sm" />
          <input value={form.mainFocus} onChange={e => setForm(f => ({ ...f, mainFocus: e.target.value }))}
            placeholder="My main focus today is..." className="game-input w-full text-sm" />
          <input value={form.affirmation} onChange={e => setForm(f => ({ ...f, affirmation: e.target.value }))}
            placeholder="Today's affirmation" className="game-input w-full text-sm" />
          <input value={form.challenge} onChange={e => setForm(f => ({ ...f, challenge: e.target.value }))}
            placeholder="Challenge I'll face today and how I'll handle it" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy: {form.energyLevel}/10</p>
              <input type="range" min={1} max={10} value={form.energyLevel}
                onChange={e => setForm(f => ({ ...f, energyLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Sleep: {form.sleepQuality}/10</p>
              <input type="range" min={1} max={10} value={form.sleepQuality}
                onChange={e => setForm(f => ({ ...f, sleepQuality: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Own the Day</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const m = MOOD_CONFIG[e.mood]
          const i = INTENTION_CONFIG[e.intention]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${m.color}` }}>
              <span className="text-2xl">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">{e.date}</span>
                  <span className="text-xs">{i.emoji} {i.label}</span>
                  <span className="text-xs text-amber-400">⚡ {e.energyLevel}/10</span>
                  <span className="text-xs text-blue-400">😴 {e.sleepQuality}/10</span>
                </div>
                {e.mainFocus && <p className="text-xs font-medium text-white mt-1">Focus: {e.mainFocus}</p>}
                {e.gratitude1 && <p className="text-xs text-yellow-300/80 mt-0.5">💛 {e.gratitude1}</p>}
                {e.affirmation && <p className="text-xs text-green-300/70 mt-0.5 italic">"{e.affirmation}"</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Win the morning, win the day.</p>
          </div>
        )}
      </div>
    </div>
  )
}
