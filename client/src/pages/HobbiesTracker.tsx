import { useState, useEffect } from 'react'
import { Gamepad2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type HobbyCategory = 'creative' | 'physical' | 'mental' | 'social' | 'collecting' | 'technical' | 'outdoor' | 'other'
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

interface Hobby {
  id: string
  name: string
  category: HobbyCategory
  skillLevel: SkillLevel
  frequency: string
  hoursTotal: number
  lastPracticed: string
  goals: string
  notes: string
  active: boolean
  createdAt: string
}

interface HobbySession {
  id: string
  hobbyId: string
  date: string
  minutes: number
  notes: string
  mood: number
  createdAt: string
}

const CAT_CONFIG: Record<HobbyCategory, { label: string; emoji: string; color: string }> = {
  creative:   { label: 'Creative',   emoji: '🎨', color: '#a855f7' },
  physical:   { label: 'Physical',   emoji: '🏃', color: '#22c55e' },
  mental:     { label: 'Mental',     emoji: '🧩', color: '#3b82f6' },
  social:     { label: 'Social',     emoji: '👥', color: '#ec4899' },
  collecting: { label: 'Collecting', emoji: '🏺', color: '#f59e0b' },
  technical:  { label: 'Technical',  emoji: '⚙️', color: '#6366f1' },
  outdoor:    { label: 'Outdoor',    emoji: '🌲', color: '#84cc16' },
  other:      { label: 'Other',      emoji: '✨', color: '#94a3b8' },
}

const LEVEL_CONFIG: Record<SkillLevel, { label: string; color: string }> = {
  beginner:     { label: 'Beginner',     color: '#94a3b8' },
  intermediate: { label: 'Intermediate', color: '#3b82f6' },
  advanced:     { label: 'Advanced',     color: '#a855f7' },
  expert:       { label: 'Expert',       color: '#f59e0b' },
}

const STORAGE_KEY = 'hobbies_tracker'
const SESSION_KEY = 'hobbies_sessions'

export default function HobbiesTracker() {
  const { toastSuccess } = useToast()
  const [hobbies, setHobbies] = useState<Hobby[]>([])
  const [sessions, setSessions] = useState<HobbySession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showLog, setShowLog] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Hobby, 'id' | 'createdAt' | 'hoursTotal' | 'lastPracticed'>>({
    name: '', category: 'creative', skillLevel: 'beginner', frequency: 'weekly',
    goals: '', notes: '', active: true,
  })
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split('T')[0], minutes: 30, notes: '', mood: 7 })

  useEffect(() => {
    try {
      setHobbies(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setSessions(JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveHobbies = (u: Hobby[]) => { setHobbies(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveSessions = (u: HobbySession[]) => { setSessions(u); localStorage.setItem(SESSION_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const h: Hobby = { id: Date.now().toString(), ...form, hoursTotal: 0, lastPracticed: '', createdAt: new Date().toISOString() }
    saveHobbies([h, ...hobbies])
    setForm({ name: '', category: 'creative', skillLevel: 'beginner', frequency: 'weekly', goals: '', notes: '', active: true })
    setShowForm(false)
    toastSuccess(`${form.name} added!`)
  }

  const logSession = (hobbyId: string) => {
    if (logForm.minutes <= 0) return
    const s: HobbySession = { id: Date.now().toString(), hobbyId, ...logForm, createdAt: new Date().toISOString() }
    saveSessions([s, ...sessions])
    const hoursToAdd = logForm.minutes / 60
    saveHobbies(hobbies.map(h => h.id === hobbyId
      ? { ...h, hoursTotal: h.hoursTotal + hoursToAdd, lastPracticed: logForm.date }
      : h))
    setLogForm({ date: new Date().toISOString().split('T')[0], minutes: 30, notes: '', mood: 7 })
    setShowLog(null)
    toastSuccess('Session logged! 🎯')
  }

  const totalHours = hobbies.reduce((s, h) => s + h.hoursTotal, 0)
  const active = hobbies.filter(h => h.active)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Gamepad2 className="w-7 h-7 text-violet-400" />
            Hobbies Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track the things you do for the love of it.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{active.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{Math.round(totalHours)}</div>
          <div className="text-xs text-slate-500">Hours Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Hobby</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Hobby name *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as HobbyCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [HobbyCategory, typeof CAT_CONFIG.creative][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.skillLevel} onChange={e => setForm(f => ({ ...f, skillLevel: e.target.value as SkillLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(LEVEL_CONFIG) as [SkillLevel, typeof LEVEL_CONFIG.beginner][]).map(([k, l]) => (
                <option key={k} value={k}>{l.label}</option>
              ))}
            </select>
          </div>
          <input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
            placeholder="How often? (e.g. weekly, 3x/week)" className="game-input w-full text-sm" />
          <textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
            placeholder="Goals for this hobby..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {hobbies.map(h => {
          const c = CAT_CONFIG[h.category]
          const l = LEVEL_CONFIG[h.skillLevel]
          const isExp = expanded === h.id
          const hobbySessions = sessions.filter(s => s.hobbyId === h.id)
          return (
            <div key={h.id} className={`game-card overflow-hidden ${!h.active ? 'opacity-60' : ''}`}
              style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3">
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 cursor-pointer" onClick={() => setExpanded(isExp ? null : h.id)}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{h.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: l.color + '20', color: l.color }}>{l.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.label} · {Math.round(h.hoursTotal)}h total · {hobbySessions.length} sessions</p>
                </div>
                <button onClick={() => setShowLog(h.id)}
                  className="px-2.5 py-1 bg-violet-700/30 text-violet-400 rounded-xl text-xs hover:bg-violet-700/50">
                  + Log
                </button>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600 cursor-pointer" onClick={() => setExpanded(null)} /> : <ChevronDown className="w-4 h-4 text-slate-600 cursor-pointer" onClick={() => setExpanded(h.id)} />}
              </div>

              {showLog === h.id && (
                <div className="border-t border-slate-800 p-3 space-y-2 bg-slate-800/30">
                  <div className="flex gap-2">
                    <input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
                    <div className="flex items-center gap-1">
                      <input type="number" value={logForm.minutes} min={1}
                        onChange={e => setLogForm(f => ({ ...f, minutes: Number(e.target.value) }))}
                        className="game-input w-16 text-sm text-center" />
                      <span className="text-xs text-slate-500">min</span>
                    </div>
                  </div>
                  <input value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Session notes..." className="game-input w-full text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => logSession(h.id)} className="flex-1 py-1.5 bg-violet-700 text-white rounded-xl text-xs">Save Session</button>
                    <button onClick={() => setShowLog(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-xl text-xs">Cancel</button>
                  </div>
                </div>
              )}

              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {h.goals && <p className="text-xs text-slate-400"><span className="text-slate-500">Goals: </span>{h.goals}</p>}
                  {h.lastPracticed && <p className="text-xs text-slate-500">Last practiced: {h.lastPracticed}</p>}
                  {hobbySessions.slice(0, 3).map(s => (
                    <div key={s.id} className="flex gap-3 text-xs text-slate-500">
                      <span>{s.date}</span>
                      <span>{s.minutes}min</span>
                      {s.notes && <span className="text-slate-400 truncate">{s.notes}</span>}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => saveHobbies(hobbies.map(x => x.id === h.id ? { ...x, active: !x.active } : x))}
                      className="text-xs text-slate-500 hover:text-slate-300">
                      {h.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => saveHobbies(hobbies.filter(x => x.id !== h.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {hobbies.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track the activities that bring you joy.</p>
          </div>
        )}
      </div>
    </div>
  )
}
