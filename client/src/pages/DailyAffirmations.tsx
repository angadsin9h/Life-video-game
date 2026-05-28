import { useState, useEffect } from 'react'
import { Sun, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AffirmationCategory = 'confidence' | 'abundance' | 'health' | 'relationships' | 'success' | 'peace' | 'growth' | 'love' | 'other'

interface Affirmation {
  id: string
  text: string
  category: AffirmationCategory
  isFavorite: boolean
  timesRecited: number
  createdAt: string
}

interface DailySession {
  date: string
  affirmationIds: string[]
  completedAt: string
}

const CAT_CONFIG: Record<AffirmationCategory, { label: string; emoji: string; color: string }> = {
  confidence:   { label: 'Confidence',   emoji: '💪', color: '#f59e0b' },
  abundance:    { label: 'Abundance',    emoji: '💰', color: '#22c55e' },
  health:       { label: 'Health',       emoji: '❤️', color: '#ef4444' },
  relationships:{ label: 'Relationships',emoji: '💕', color: '#ec4899' },
  success:      { label: 'Success',      emoji: '🏆', color: '#6366f1' },
  peace:        { label: 'Peace',        emoji: '☮️', color: '#3b82f6' },
  growth:       { label: 'Growth',       emoji: '🌱', color: '#84cc16' },
  love:         { label: 'Love',         emoji: '✨', color: '#a855f7' },
  other:        { label: 'Other',        emoji: '🌟', color: '#94a3b8' },
}

const DEFAULT_AFFIRMATIONS = [
  { text: 'I am capable of achieving everything I set my mind to.', category: 'confidence' as AffirmationCategory },
  { text: 'I attract abundance and opportunity into my life.', category: 'abundance' as AffirmationCategory },
  { text: 'My body is healthy, strong, and full of energy.', category: 'health' as AffirmationCategory },
  { text: 'I am worthy of deep, meaningful love and connection.', category: 'love' as AffirmationCategory },
  { text: 'Every day I grow wiser, stronger, and more resilient.', category: 'growth' as AffirmationCategory },
]

const STORAGE_KEY = 'daily_affirmations'
const SESSION_KEY = 'affirmation_sessions'

export default function DailyAffirmations() {
  const { toastSuccess } = useToast()
  const [affirmations, setAffirmations] = useState<Affirmation[]>([])
  const [sessions, setSessions] = useState<DailySession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [current, setCurrent] = useState(0)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<Affirmation, 'id' | 'createdAt' | 'timesRecited'>>({
    text: '', category: 'confidence', isFavorite: false,
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (stored.length === 0) {
        const defaults: Affirmation[] = DEFAULT_AFFIRMATIONS.map((a, i) => ({
          id: `default-${i}`, ...a, isFavorite: false, timesRecited: 0, createdAt: new Date().toISOString()
        }))
        setAffirmations(defaults)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      } else {
        setAffirmations(stored)
      }
      setSessions(JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveAffirmations = (u: Affirmation[]) => { setAffirmations(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.text.trim()) return
    const a: Affirmation = { id: Date.now().toString(), ...form, timesRecited: 0, createdAt: new Date().toISOString() }
    saveAffirmations([a, ...affirmations])
    setForm({ text: '', category: 'confidence', isFavorite: false })
    setShowForm(false)
    toastSuccess('Affirmation added ✨')
  }

  const recite = () => {
    const filtered = filterCat === 'all' ? affirmations : affirmations.filter(a => a.category === filterCat)
    if (filtered.length === 0) return
    const a = filtered[current % filtered.length]
    saveAffirmations(affirmations.map(x => x.id === a.id ? { ...x, timesRecited: x.timesRecited + 1 } : x))
    setCurrent(c => c + 1)
    toastSuccess('Affirmation recited 🌟')
  }

  const filtered = filterCat === 'all' ? affirmations : affirmations.filter(a => a.category === filterCat)
  const today = new Date().toISOString().split('T')[0]
  const todaySession = sessions.find(s => s.date === today)
  const streak = (() => {
    let count = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (sessions.find(s => s.date === ds)) { count++; d.setDate(d.getDate() - 1) } else break
    }
    return count
  })()
  const totalRecited = affirmations.reduce((s, a) => s + a.timesRecited, 0)

  const currentAff = filtered.length > 0 ? filtered[current % filtered.length] : null

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Affirmations
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Rewire your mind with daily affirmations.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{affirmations.length}</div>
          <div className="text-xs text-slate-500">Affirmations</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{totalRecited}</div>
          <div className="text-xs text-slate-500">Recited</div>
        </div>
      </div>

      {currentAff && (
        <div className="game-card p-6 text-center border border-yellow-500/20 bg-yellow-500/5">
          <span className="text-3xl mb-3 block">{CAT_CONFIG[currentAff.category].emoji}</span>
          <p className="text-white text-base font-medium leading-relaxed mb-4 italic">"{currentAff.text}"</p>
          <div className="flex gap-2 justify-center">
            <button onClick={recite}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
              <RefreshCw className="w-4 h-4" /> Recite
            </button>
            <button onClick={() => setCurrent(c => c + 1)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Next</button>
          </div>
          <p className="text-xs text-slate-600 mt-2">Recited {currentAff.timesRecited} times</p>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(CAT_CONFIG).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Affirmation</h3>
          <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="I am... / I have... / I attract... *" className="game-input w-full h-16 resize-none" autoFocus />
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as AffirmationCategory }))} className="game-input text-sm w-full">
            {(Object.entries(CAT_CONFIG) as [AffirmationCategory, typeof CAT_CONFIG.confidence][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(a => {
          const c = CAT_CONFIG[a.category]
          return (
            <div key={a.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-lg mt-0.5">{c.emoji}</span>
              <div className="flex-1">
                <p className="text-sm text-slate-300 leading-relaxed">{a.text}</p>
                <p className="text-xs text-slate-600 mt-0.5">Recited {a.timesRecited}x</p>
              </div>
              <button onClick={() => saveAffirmations(affirmations.filter(x => x.id !== a.id))} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Add affirmations to rewire your mindset daily.</p>
          </div>
        )}
      </div>
    </div>
  )
}
