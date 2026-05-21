import { useState, useEffect } from 'react'
import { Moon, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EveningMood = 'drained' | 'tired' | 'neutral' | 'content' | 'peaceful' | 'fulfilled'
type DayRating = 'rough' | 'okay' | 'decent' | 'good' | 'great' | 'perfect'

interface EveningEntry {
  id: string
  mood: EveningMood
  dayRating: DayRating
  biggestWin: string
  gratitude: string
  lessonLearned: string
  tomorrowFocus: string
  whatToLetGo: string
  bodyFeel: string
  mindState: number
  productivityScore: number
  date: string
  createdAt: string
}

const MOOD_CONFIG: Record<EveningMood, { label: string; emoji: string; color: string }> = {
  drained:   { label: 'Drained',   emoji: '😮‍💨', color: '#ef4444' },
  tired:     { label: 'Tired',     emoji: '😪',  color: '#f97316' },
  neutral:   { label: 'Neutral',   emoji: '😐',  color: '#94a3b8' },
  content:   { label: 'Content',   emoji: '🙂',  color: '#3b82f6' },
  peaceful:  { label: 'Peaceful',  emoji: '😌',  color: '#22c55e' },
  fulfilled: { label: 'Fulfilled', emoji: '🌟',  color: '#a855f7' },
}

const DAY_CONFIG: Record<DayRating, { label: string; color: string }> = {
  rough:   { label: 'Rough',   color: '#ef4444' },
  okay:    { label: 'Okay',    color: '#f97316' },
  decent:  { label: 'Decent',  color: '#f59e0b' },
  good:    { label: 'Good',    color: '#22c55e' },
  great:   { label: 'Great',   color: '#3b82f6' },
  perfect: { label: 'Perfect', color: '#a855f7' },
}

const STORAGE_KEY = 'evening_wind_down'

export default function EveningWindDown() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EveningEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EveningEntry, 'id' | 'createdAt'>>({
    mood: 'content', dayRating: 'good', biggestWin: '', gratitude: '',
    lessonLearned: '', tomorrowFocus: '', whatToLetGo: '', bodyFeel: '',
    mindState: 7, productivityScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: EveningEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.biggestWin.trim() && !form.gratitude.trim()) return
    const e: EveningEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, biggestWin: '', gratitude: '', lessonLearned: '', tomorrowFocus: '', whatToLetGo: '', bodyFeel: '' }))
    setShowForm(false)
    toastSuccess('Evening review complete — rest well 🌙')
  }

  const avgProductivity = entries.length ? Math.round(entries.reduce((s, e) => s + e.productivityScore, 0) / entries.length) : 0
  const greatDays = entries.filter(e => e.dayRating === 'great' || e.dayRating === 'perfect').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Evening Wind Down
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Close the day consciously. Reflect, release, prepare.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Close Day
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Nights</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgProductivity}/10</div>
          <div className="text-xs text-slate-500">Avg Productivity</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{greatDays}</div>
          <div className="text-xs text-slate-500">Great Days</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Close your day 🌙</h3>
          <div className="flex gap-2">
            <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value as EveningMood }))} className="game-input text-sm flex-1">
              {(Object.entries(MOOD_CONFIG) as [EveningMood, typeof MOOD_CONFIG.content][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
            <select value={form.dayRating} onChange={e => setForm(f => ({ ...f, dayRating: e.target.value as DayRating }))} className="game-input text-sm flex-1">
              {(Object.entries(DAY_CONFIG) as [DayRating, typeof DAY_CONFIG.good][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.biggestWin} onChange={e => setForm(f => ({ ...f, biggestWin: e.target.value }))}
            placeholder="Biggest win of the day" className="game-input w-full text-sm" autoFocus />
          <input value={form.gratitude} onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
            placeholder="What are you grateful for today?" className="game-input w-full text-sm" />
          <input value={form.lessonLearned} onChange={e => setForm(f => ({ ...f, lessonLearned: e.target.value }))}
            placeholder="Lesson or insight from today" className="game-input w-full text-sm" />
          <input value={form.tomorrowFocus} onChange={e => setForm(f => ({ ...f, tomorrowFocus: e.target.value }))}
            placeholder="Top focus for tomorrow" className="game-input w-full text-sm" />
          <input value={form.whatToLetGo} onChange={e => setForm(f => ({ ...f, whatToLetGo: e.target.value }))}
            placeholder="What are you releasing / letting go of?" className="game-input w-full text-sm" />
          <input value={form.bodyFeel} onChange={e => setForm(f => ({ ...f, bodyFeel: e.target.value }))}
            placeholder="How does your body feel right now?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mind state: {form.mindState}/10</p>
              <input type="range" min={1} max={10} value={form.mindState}
                onChange={e => setForm(f => ({ ...f, mindState: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Productivity: {form.productivityScore}/10</p>
              <input type="range" min={1} max={10} value={form.productivityScore}
                onChange={e => setForm(f => ({ ...f, productivityScore: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Close the Day</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const m = MOOD_CONFIG[e.mood]
          const d = DAY_CONFIG[e.dayRating]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${m.color}` }}>
              <span className="text-2xl">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">{e.date}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-indigo-400">📊 {e.productivityScore}/10</span>
                </div>
                {e.biggestWin && <p className="text-xs font-medium text-white mt-1">🏆 {e.biggestWin}</p>}
                {e.gratitude && <p className="text-xs text-yellow-300/80 mt-0.5">💛 {e.gratitude}</p>}
                {e.tomorrowFocus && <p className="text-xs text-blue-300/70 mt-0.5">Tomorrow: {e.tomorrowFocus}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Moon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">End each day with intention. Tomorrow begins tonight.</p>
          </div>
        )}
      </div>
    </div>
  )
}
