import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TherapyType = 'cbt' | 'dbt' | 'ifs' | 'emdr' | 'somatic' | 'talk' | 'group' | 'coaching' | 'other'
type SessionMood = 'heavy' | 'neutral' | 'productive' | 'breakthrough' | 'difficult' | 'hopeful'

interface TherapySession {
  id: string
  date: string
  therapistName: string
  type: TherapyType
  mood: SessionMood
  topics: string
  insights: string
  homework: string
  nextSession: string
  rating: number
  cost: number
  createdAt: string
}

const TYPE_CONFIG: Record<TherapyType, { label: string; abbr: string; color: string }> = {
  cbt:      { label: 'Cognitive Behavioral', abbr: 'CBT',      color: '#6366f1' },
  dbt:      { label: 'Dialectical Behavior', abbr: 'DBT',      color: '#3b82f6' },
  ifs:      { label: 'Internal Family Sys.', abbr: 'IFS',      color: '#a855f7' },
  emdr:     { label: 'EMDR',                 abbr: 'EMDR',     color: '#22c55e' },
  somatic:  { label: 'Somatic',              abbr: 'Somatic',  color: '#f59e0b' },
  talk:     { label: 'Talk Therapy',         abbr: 'Talk',     color: '#94a3b8' },
  group:    { label: 'Group Therapy',        abbr: 'Group',    color: '#f97316' },
  coaching: { label: 'Life Coaching',        abbr: 'Coach',    color: '#ec4899' },
  other:    { label: 'Other',               abbr: 'Other',    color: '#64748b' },
}

const MOOD_CONFIG: Record<SessionMood, { label: string; color: string; emoji: string }> = {
  heavy:       { label: 'Heavy',       color: '#ef4444', emoji: '⚠️' },
  neutral:     { label: 'Neutral',     color: '#94a3b8', emoji: '😐' },
  productive:  { label: 'Productive',  color: '#3b82f6', emoji: '📈' },
  breakthrough:{ label: 'Breakthrough',color: '#22c55e', emoji: '💡' },
  difficult:   { label: 'Difficult',   color: '#f97316', emoji: '😤' },
  hopeful:     { label: 'Hopeful',     color: '#a855f7', emoji: '🌱' },
}

const STORAGE_KEY = 'therapy_log'

export default function TherapyLog() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<TherapySession, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], therapistName: '', type: 'talk',
    mood: 'neutral', topics: '', insights: '', homework: '', nextSession: '', rating: 0, cost: 0,
  })

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: TherapySession[]) => { setSessions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.date) return
    const s: TherapySession = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...sessions])
    setForm({ date: new Date().toISOString().split('T')[0], therapistName: '', type: 'talk', mood: 'neutral', topics: '', insights: '', homework: '', nextSession: '', rating: 0, cost: 0 })
    setShowForm(false)
    toastSuccess('Session logged 🧠')
  }

  const breakthroughs = sessions.filter(s => s.mood === 'breakthrough').length
  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-purple-400" />
            Therapy Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track sessions, insights, and progress.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{breakthroughs}</div>
          <div className="text-xs text-slate-500">Breakthroughs</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">${totalCost}</div>
          <div className="text-xs text-slate-500">Invested</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Session</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TherapyType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [TherapyType, typeof TYPE_CONFIG.talk][]).map(([k, t]) => (
                <option key={k} value={k}>{t.abbr} – {t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.therapistName} onChange={e => setForm(f => ({ ...f, therapistName: e.target.value }))}
              placeholder="Therapist name" className="game-input flex-1 text-sm" autoFocus />
            <input type="number" value={form.cost || ''} min={0}
              onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
              placeholder="Cost $" className="game-input w-24 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(MOOD_CONFIG) as [SessionMood, typeof MOOD_CONFIG.neutral][]).map(([k, m]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, mood: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.mood === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.mood === k ? { background: m.color + '30', color: m.color } : {}}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <textarea value={form.topics} onChange={e => setForm(f => ({ ...f, topics: e.target.value }))}
            placeholder="Topics discussed..." className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.insights} onChange={e => setForm(f => ({ ...f, insights: e.target.value }))}
            placeholder="Key insights & breakthroughs..." className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.homework} onChange={e => setForm(f => ({ ...f, homework: e.target.value }))}
            placeholder="Homework / actions to take" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input type="date" value={form.nextSession} onChange={e => setForm(f => ({ ...f, nextSession: e.target.value }))}
              className="game-input text-sm flex-1" title="Next session date" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}
                  className={`text-xl ${form.rating >= n ? 'text-purple-400' : 'text-slate-700'}`}>★</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map(s => {
          const t = TYPE_CONFIG[s.type]
          const m = MOOD_CONFIG[s.mood]
          const isExp = expanded === s.id
          return (
            <div key={s.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${m.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{s.therapistName || t.abbr + ' Session'}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: m.color + '20', color: m.color }}>{m.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{s.date} · {t.abbr}{s.cost > 0 && ` · $${s.cost}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {s.topics && <p className="text-xs text-slate-400"><span className="text-slate-500">Topics: </span>{s.topics}</p>}
                  {s.insights && <p className="text-sm text-teal-400 italic">💡 {s.insights}</p>}
                  {s.homework && <p className="text-xs text-blue-400">📋 Homework: {s.homework}</p>}
                  {s.nextSession && <p className="text-xs text-slate-500">Next: {s.nextSession}</p>}
                  {s.rating > 0 && <p className="text-xs text-purple-400">{'★'.repeat(s.rating)}</p>}
                  <button onClick={() => save(sessions.filter(x => x.id !== s.id))} className="text-xs text-slate-700 hover:text-red-400">Delete</button>
                </div>
              )}
            </div>
          )
        })}
        {sessions.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log your therapy sessions to track growth.</p>
          </div>
        )}
      </div>
    </div>
  )
}
