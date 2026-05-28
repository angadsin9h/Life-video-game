import { useState, useEffect } from 'react'
import { AlertCircle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AngerTrigger = 'people' | 'work' | 'traffic' | 'technology' | 'finances' | 'health' | 'politics' | 'self' | 'expectations' | 'other'
type AngerResponse = 'expressed' | 'suppressed' | 'redirected' | 'resolved' | 'journaled' | 'exercised' | 'breathed'

interface AngerEntry {
  id: string
  trigger: AngerTrigger
  response: AngerResponse
  intensity: number
  situation: string
  thoughts: string
  physicalSigns: string
  whatHelped: string
  lesson: string
  date: string
  resolved: boolean
  createdAt: string
}

const TRIGGER_CONFIG: Record<AngerTrigger, { label: string; emoji: string; color: string }> = {
  people:       { label: 'People',       emoji: '👥', color: '#ef4444' },
  work:         { label: 'Work',         emoji: '💼', color: '#f97316' },
  traffic:      { label: 'Traffic',      emoji: '🚗', color: '#f59e0b' },
  technology:   { label: 'Technology',   emoji: '💻', color: '#3b82f6' },
  finances:     { label: 'Finances',     emoji: '💰', color: '#22c55e' },
  health:       { label: 'Health',       emoji: '❤️', color: '#ec4899' },
  politics:     { label: 'Politics',     emoji: '🗳️', color: '#a855f7' },
  self:         { label: 'Self',         emoji: '🪞', color: '#6366f1' },
  expectations: { label: 'Expectations', emoji: '📊', color: '#0ea5e9' },
  other:        { label: 'Other',        emoji: '⚡', color: '#94a3b8' },
}

const RESPONSE_CONFIG: Record<AngerResponse, { label: string; emoji: string }> = {
  expressed:   { label: 'Expressed',   emoji: '🗣️' },
  suppressed:  { label: 'Suppressed',  emoji: '😶' },
  redirected:  { label: 'Redirected',  emoji: '↩️' },
  resolved:    { label: 'Resolved',    emoji: '✅' },
  journaled:   { label: 'Journaled',   emoji: '📓' },
  exercised:   { label: 'Exercised',   emoji: '🏃' },
  breathed:    { label: 'Breathed',    emoji: '🌬️' },
}

const STORAGE_KEY = 'anger_log'

export default function AngerLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AngerEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterTrigger, setFilterTrigger] = useState<string>('all')
  const [form, setForm] = useState<Omit<AngerEntry, 'id' | 'createdAt'>>({
    trigger: 'people', response: 'journaled', intensity: 3, situation: '',
    thoughts: '', physicalSigns: '', whatHelped: '', lesson: '',
    date: new Date().toISOString().split('T')[0], resolved: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AngerEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.situation.trim()) return
    const e: AngerEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, situation: '', thoughts: '', physicalSigns: '', whatHelped: '', lesson: '', resolved: false }))
    setShowForm(false)
    toastSuccess('Anger logged 🔥')
  }

  const filtered = entries.filter(e => filterTrigger === 'all' || e.trigger === filterTrigger)
  const avgIntensity = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.intensity, 0) / entries.length * 10) / 10 : 0
  const resolvedCount = entries.filter(e => e.resolved).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertCircle className="w-7 h-7 text-red-400" />
            Anger Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Understand your triggers and manage your emotions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Episodes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{avgIntensity}</div>
          <div className="text-xs text-slate-500">Avg Intensity</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{resolvedCount}</div>
          <div className="text-xs text-slate-500">Resolved</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterTrigger('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTrigger === 'all' ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TRIGGER_CONFIG) as [AngerTrigger, typeof TRIGGER_CONFIG.people][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterTrigger(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterTrigger === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterTrigger === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Anger Episode</h3>
          <div className="flex gap-2">
            <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as AngerTrigger }))} className="game-input text-sm flex-1">
              {(Object.entries(TRIGGER_CONFIG) as [AngerTrigger, typeof TRIGGER_CONFIG.people][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1" />
          </div>
          <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="What happened? *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <div>
            <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/10</p>
            <input type="range" min={1} max={10} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full h-1 accent-red-400" />
          </div>
          <input value={form.thoughts} onChange={e => setForm(f => ({ ...f, thoughts: e.target.value }))}
            placeholder="Thoughts at the time..." className="game-input w-full text-sm" />
          <input value={form.physicalSigns} onChange={e => setForm(f => ({ ...f, physicalSigns: e.target.value }))}
            placeholder="Physical signs (tense jaw, racing heart...)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <select value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value as AngerResponse }))} className="game-input text-sm flex-1">
              {(Object.entries(RESPONSE_CONFIG) as [AngerResponse, typeof RESPONSE_CONFIG.expressed][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <input value={form.whatHelped} onChange={e => setForm(f => ({ ...f, whatHelped: e.target.value }))}
              placeholder="What helped?" className="game-input flex-1 text-sm" />
          </div>
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Lesson learned..." className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TRIGGER_CONFIG[e.trigger]
          const r = RESPONSE_CONFIG[e.response]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{e.resolved ? '✅' : t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{e.situation}</span>
                    <span className="text-xs text-red-400">{e.intensity}/10</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · {r.emoji} {r.label} · {e.date}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.thoughts && <p className="text-xs text-slate-300">💭 {e.thoughts}</p>}
                  {e.physicalSigns && <p className="text-xs text-orange-300">⚡ {e.physicalSigns}</p>}
                  {e.whatHelped && <p className="text-xs text-green-300">💊 {e.whatHelped}</p>}
                  {e.lesson && <p className="text-xs text-blue-300">📖 {e.lesson}</p>}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => save(entries.map(x => x.id === e.id ? { ...x, resolved: !x.resolved } : x))}
                      className="text-xs text-green-600 hover:text-green-400">
                      {e.resolved ? 'Mark unresolved' : 'Mark resolved'}
                    </button>
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track your anger to understand and master your emotions.</p>
          </div>
        )}
      </div>
    </div>
  )
}
