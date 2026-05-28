import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SelfCareArea = 'physical' | 'emotional' | 'mental' | 'social' | 'spiritual' | 'practical' | 'creative' | 'financial'
type Frequency = 'daily' | 'weekly' | 'monthly' | 'as-needed'

interface SelfCareActivity {
  id: string
  area: SelfCareArea
  name: string
  description: string
  frequency: Frequency
  duration: string
  benefits: string
  barriers: string
  lastDone: string
  streak: number
  isActive: boolean
  createdAt: string
}

const AREA_CONFIG: Record<SelfCareArea, { label: string; emoji: string; color: string }> = {
  physical:   { label: 'Physical',   emoji: '💪', color: '#22c55e' },
  emotional:  { label: 'Emotional',  emoji: '❤️', color: '#ec4899' },
  mental:     { label: 'Mental',     emoji: '🧠', color: '#6366f1' },
  social:     { label: 'Social',     emoji: '👥', color: '#3b82f6' },
  spiritual:  { label: 'Spiritual',  emoji: '✨', color: '#a855f7' },
  practical:  { label: 'Practical',  emoji: '🏠', color: '#f59e0b' },
  creative:   { label: 'Creative',   emoji: '🎨', color: '#f97316' },
  financial:  { label: 'Financial',  emoji: '💰', color: '#84cc16' },
}

const STORAGE_KEY = 'self_care_plan'

const DEFAULT_ACTIVITIES: Omit<SelfCareActivity, 'id' | 'createdAt'>[] = [
  { area: 'physical', name: 'Morning walk', description: '20-minute walk outside to start the day', frequency: 'daily', duration: '20 min', benefits: 'Energy, mental clarity, vitamin D', barriers: 'Bad weather, time', lastDone: '', streak: 0, isActive: true },
  { area: 'emotional', name: 'Journaling', description: 'Write 3 things grateful for + 1 feeling', frequency: 'daily', duration: '5 min', benefits: 'Emotional processing, gratitude', barriers: 'Feeling tired', lastDone: '', streak: 0, isActive: true },
  { area: 'mental', name: 'Reading', description: '20 minutes of a good book before bed', frequency: 'daily', duration: '20 min', benefits: 'Reduces screen time, stimulates mind', barriers: 'Phone distraction', lastDone: '', streak: 0, isActive: true },
]

export default function SelfCarePlan() {
  const { toastSuccess } = useToast()
  const [activities, setActivities] = useState<SelfCareActivity[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterArea, setFilterArea] = useState<string>('all')
  const [form, setForm] = useState<Omit<SelfCareActivity, 'id' | 'createdAt'>>({
    area: 'physical', name: '', description: '', frequency: 'daily',
    duration: '', benefits: '', barriers: '', lastDone: '', streak: 0, isActive: true,
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (stored.length === 0) {
        const defaults: SelfCareActivity[] = DEFAULT_ACTIVITIES.map((a, i) => ({
          id: `default-${i}`, ...a, createdAt: new Date().toISOString(),
        }))
        setActivities(defaults)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      } else {
        setActivities(stored)
      }
    } catch { /**/ }
  }, [])

  const save = (u: SelfCareActivity[]) => { setActivities(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const a: SelfCareActivity = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([a, ...activities])
    setForm(f => ({ ...f, name: '', description: '', duration: '', benefits: '', barriers: '' }))
    setShowForm(false)
    toastSuccess('Self-care activity added 💚')
  }

  const markDone = (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    save(activities.map(a => a.id === id ? { ...a, lastDone: today, streak: a.streak + 1 } : a))
    toastSuccess('Done! Keep it up ✨')
  }

  const filtered = activities.filter(a => filterArea === 'all' || a.area === filterArea)
  const active = activities.filter(a => a.isActive).length
  const today = new Date().toISOString().split('T')[0]
  const doneToday = activities.filter(a => a.lastDone === today).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Self-Care Plan
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build a personalized self-care routine.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{doneToday}</div>
          <div className="text-xs text-slate-500">Done Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{activities.reduce((s, a) => Math.max(s, a.streak), 0)}</div>
          <div className="text-xs text-slate-500">Best Streak</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(AREA_CONFIG) as [SelfCareArea, typeof AREA_CONFIG.physical][]).map(([k, a]) => (
          <button key={k} onClick={() => setFilterArea(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterArea === k ? { background: a.color + '30', color: a.color } : {}}>
            {a.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Self-Care Activity</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Activity name *" className="game-input flex-1" autoFocus />
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as SelfCareArea }))} className="game-input text-sm">
              {(Object.entries(AREA_CONFIG) as [SelfCareArea, typeof AREA_CONFIG.physical][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
          </div>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What does it involve?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as Frequency }))} className="game-input text-sm flex-1">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="as-needed">As needed</option>
            </select>
            <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="Duration" className="game-input flex-1 text-sm" />
          </div>
          <input value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))}
            placeholder="Benefits..." className="game-input w-full text-sm" />
          <input value={form.barriers} onChange={e => setForm(f => ({ ...f, barriers: e.target.value }))}
            placeholder="Common barriers..." className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(a => {
          const ar = AREA_CONFIG[a.area]
          const isExp = expanded === a.id
          const doneToday = a.lastDone === today
          return (
            <div key={a.id} className={`game-card overflow-hidden ${!a.isActive ? 'opacity-50' : ''}`} style={{ borderLeft: `3px solid ${ar.color}` }}>
              <div className="p-3 flex items-center gap-3">
                <span className="text-xl cursor-pointer" onClick={() => setExpanded(isExp ? null : a.id)}>{ar.emoji}</span>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(isExp ? null : a.id)}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{a.name}</span>
                    {doneToday && <span className="text-xs text-green-400">✅ Done</span>}
                    {a.streak > 0 && <span className="text-xs text-orange-400">🔥{a.streak}</span>}
                  </div>
                  <p className="text-xs text-slate-500">{ar.label} · {a.frequency}{a.duration && ` · ${a.duration}`}</p>
                </div>
                {!doneToday && a.isActive && (
                  <button onClick={() => markDone(a.id)} className="px-2 py-1 text-xs bg-green-700/20 text-green-400 rounded-lg hover:bg-green-700/40">Done</button>
                )}
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600 cursor-pointer" onClick={() => setExpanded(null)} /> : <ChevronDown className="w-4 h-4 text-slate-600 cursor-pointer" onClick={() => setExpanded(a.id)} />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {a.description && <p className="text-xs text-slate-300">{a.description}</p>}
                  {a.benefits && <p className="text-xs text-green-300">✨ {a.benefits}</p>}
                  {a.barriers && <p className="text-xs text-red-300">⚠️ Barriers: {a.barriers}</p>}
                  {a.lastDone && <p className="text-xs text-slate-500">Last done: {a.lastDone}</p>}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => save(activities.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x))}
                      className="text-xs text-slate-500 hover:text-slate-300">
                      {a.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={() => save(activities.filter(x => x.id !== a.id))} className="ml-auto text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You cannot pour from an empty cup. Design your self-care routine.</p>
          </div>
        )}
      </div>
    </div>
  )
}
