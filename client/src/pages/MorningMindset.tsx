import { useState, useEffect } from 'react'
import { Sun, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MindsetEntry {
  id: string
  date: string
  wakeTime: string
  energyLevel: number
  mood: number
  todayMantra: string
  morningThought: string
  gratitude1: string
  gratitude2: string
  gratitude3: string
  topPriority: string
  intention: string
  challenge: string
  affirmation: string
  createdAt: string
}

const STORAGE_KEY = 'morning_mindset'

const PROMPTS = [
  "Today I choose to...",
  "I am grateful for...",
  "My superpower today is...",
  "One thing that will make today great...",
  "I release the need to...",
  "I am becoming someone who...",
]

export default function MorningMindset() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindsetEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [todayEntry, setTodayEntry] = useState<MindsetEntry | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState<Omit<MindsetEntry, 'id' | 'createdAt'>>({
    date: today, wakeTime: '', energyLevel: 7, mood: 7,
    todayMantra: '', morningThought: '', gratitude1: '', gratitude2: '', gratitude3: '',
    topPriority: '', intention: '', challenge: '', affirmation: '',
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setEntries(stored)
      const todayE = stored.find((e: MindsetEntry) => e.date === today)
      if (todayE) setTodayEntry(todayE)
    } catch { /**/ }
  }, [])

  const save = (u: MindsetEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.intention.trim() && !form.todayMantra.trim()) return
    const e: MindsetEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    const updated = [e, ...entries.filter(x => x.date !== form.date)]
    save(updated)
    setTodayEntry(e)
    setShowForm(false)
    toastSuccess('Morning mindset set! ☀️')
  }

  const streak = (() => {
    let count = 0
    const d = new Date()
    while (true) {
      const dateStr = d.toISOString().split('T')[0]
      if (entries.some(e => e.date === dateStr)) { count++; d.setDate(d.getDate() - 1) }
      else break
    }
    return count
  })()

  const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Morning Mindset
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Start each day with intention and gratitude.</p>
        </div>
        {!todayEntry && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> Today
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{todayEntry ? '✓' : '—'}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
      </div>

      {/* Today's entry card */}
      {todayEntry && !showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">☀️ Today's Mindset</span>
            <button onClick={() => { setForm({ ...todayEntry }); setShowForm(true) }} className="text-xs text-slate-500 hover:text-slate-300">Edit</button>
          </div>
          {todayEntry.todayMantra && (
            <p className="text-base text-yellow-300 font-medium text-center italic">"{todayEntry.todayMantra}"</p>
          )}
          {todayEntry.intention && <p className="text-sm text-slate-300">🎯 {todayEntry.intention}</p>}
          {todayEntry.topPriority && <p className="text-sm text-blue-400">📌 {todayEntry.topPriority}</p>}
          {(todayEntry.gratitude1 || todayEntry.gratitude2 || todayEntry.gratitude3) && (
            <div className="text-xs text-slate-400 space-y-0.5">
              {todayEntry.gratitude1 && <p>🙏 {todayEntry.gratitude1}</p>}
              {todayEntry.gratitude2 && <p>🙏 {todayEntry.gratitude2}</p>}
              {todayEntry.gratitude3 && <p>🙏 {todayEntry.gratitude3}</p>}
            </div>
          )}
          <div className="flex gap-4 text-xs text-slate-500">
            <span>Energy: {todayEntry.energyLevel}/10</span>
            <span>Mood: {todayEntry.mood}/10</span>
            {todayEntry.wakeTime && <span>Woke: {todayEntry.wakeTime}</span>}
          </div>
        </div>
      )}

      {!todayEntry && !showForm && (
        <div className="game-card p-4 border border-yellow-500/20 text-center cursor-pointer" onClick={() => setShowForm(true)}>
          <p className="text-sm text-slate-400 mb-2">Today's mindset not set yet.</p>
          <p className="text-xs text-slate-600 italic">"{randomPrompt}"</p>
          <button className="mt-3 px-4 py-2 bg-yellow-700/30 text-yellow-400 rounded-xl text-sm hover:bg-yellow-700/50">
            Set Morning Mindset →
          </button>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Morning Mindset</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
            <input type="time" value={form.wakeTime} onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))} className="game-input text-sm" placeholder="Wake time" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-28">Energy: {form.energyLevel}/10</span>
              <input type="range" min={1} max={10} value={form.energyLevel} onChange={e => setForm(f => ({ ...f, energyLevel: Number(e.target.value) }))} className="flex-1 h-1 accent-yellow-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-28">Mood: {form.mood}/10</span>
              <input type="range" min={1} max={10} value={form.mood} onChange={e => setForm(f => ({ ...f, mood: Number(e.target.value) }))} className="flex-1 h-1 accent-green-400" />
            </div>
          </div>
          <input value={form.todayMantra} onChange={e => setForm(f => ({ ...f, todayMantra: e.target.value }))}
            placeholder="Today's mantra..." className="game-input w-full" autoFocus />
          <input value={form.intention} onChange={e => setForm(f => ({ ...f, intention: e.target.value }))}
            placeholder="My intention for today..." className="game-input w-full text-sm" />
          <input value={form.topPriority} onChange={e => setForm(f => ({ ...f, topPriority: e.target.value }))}
            placeholder="Top priority today..." className="game-input w-full text-sm" />
          <div className="space-y-2">
            <p className="text-xs text-slate-500">I am grateful for...</p>
            <input value={form.gratitude1} onChange={e => setForm(f => ({ ...f, gratitude1: e.target.value }))} placeholder="1." className="game-input w-full text-sm" />
            <input value={form.gratitude2} onChange={e => setForm(f => ({ ...f, gratitude2: e.target.value }))} placeholder="2." className="game-input w-full text-sm" />
            <input value={form.gratitude3} onChange={e => setForm(f => ({ ...f, gratitude3: e.target.value }))} placeholder="3." className="game-input w-full text-sm" />
          </div>
          <input value={form.affirmation} onChange={e => setForm(f => ({ ...f, affirmation: e.target.value }))}
            placeholder="Daily affirmation..." className="game-input w-full text-sm" />
          <textarea value={form.morningThought} onChange={e => setForm(f => ({ ...f, morningThought: e.target.value }))}
            placeholder="Morning thought / brain dump..." className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.filter(e => e.date !== today).map(e => {
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden">
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">☀️</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{e.date}</div>
                  {e.todayMantra && <p className="text-xs text-yellow-400 italic truncate">"{e.todayMantra}"</p>}
                </div>
                <div className="text-xs text-slate-600">⚡{e.energyLevel} 😊{e.mood}</div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.intention && <p className="text-xs text-slate-300">🎯 {e.intention}</p>}
                  {e.gratitude1 && <p className="text-xs text-slate-400">🙏 {e.gratitude1}</p>}
                  {e.affirmation && <p className="text-xs text-blue-400 italic">{e.affirmation}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">Delete</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
