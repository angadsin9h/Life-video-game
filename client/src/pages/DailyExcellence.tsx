import { useState, useEffect } from 'react'
import { Star, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExcellenceArea = 'work' | 'relationships' | 'health' | 'mind' | 'character' | 'craft' | 'service' | 'presence' | 'creativity' | 'leadership'
type ExcellenceStandard = 'minimum' | 'adequate' | 'good' | 'excellent' | 'extraordinary'

interface DailyExcellenceEntry {
  id: string
  area: ExcellenceArea
  standard: ExcellenceStandard
  whatYouDid: string
  howYouExceeded: string
  whatStoppedYou: string
  refinementMade: string
  prideLevel: string
  tomorrowStandard: string
  couldBeBetter: string
  excellenceScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<ExcellenceArea, { label: string; emoji: string; color: string }> = {
  work:         { label: 'Work',         emoji: '💼', color: '#3b82f6' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  health:       { label: 'Health',       emoji: '💪', color: '#22c55e' },
  mind:         { label: 'Mind',         emoji: '🧠', color: '#6366f1' },
  character:    { label: 'Character',    emoji: '⚖️', color: '#94a3b8' },
  craft:        { label: 'Craft',        emoji: '🔨', color: '#f97316' },
  service:      { label: 'Service',      emoji: '🙌', color: '#10b981' },
  presence:     { label: 'Presence',     emoji: '👁️', color: '#a855f7' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#f59e0b' },
  leadership:   { label: 'Leadership',   emoji: '👑', color: '#ef4444' },
}

const STANDARD_CONFIG: Record<ExcellenceStandard, { label: string; color: string }> = {
  minimum:       { label: 'Minimum',       color: '#ef4444' },
  adequate:      { label: 'Adequate',      color: '#f97316' },
  good:          { label: 'Good',          color: '#f59e0b' },
  excellent:     { label: 'Excellent',     color: '#3b82f6' },
  extraordinary: { label: 'Extraordinary', color: '#22c55e' },
}

const STORAGE_KEY = 'daily_excellence_log'

export default function DailyExcellence() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DailyExcellenceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DailyExcellenceEntry, 'id' | 'createdAt'>>({
    area: 'work', standard: 'excellent', whatYouDid: '',
    howYouExceeded: '', whatStoppedYou: '', refinementMade: '',
    prideLevel: '', tomorrowStandard: '', couldBeBetter: '', excellenceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DailyExcellenceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouDid.trim()) return
    const e: DailyExcellenceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatYouDid: '', howYouExceeded: '', whatStoppedYou: '', refinementMade: '', prideLevel: '', tomorrowStandard: '', couldBeBetter: '' }))
    setShowForm(false)
    toastSuccess('Excellence logged — the standard you walk past is the standard you accept ⭐')
  }

  const extraordinary = entries.filter(e => e.standard === 'extraordinary' || e.standard === 'excellent').length
  const avgExcellence = entries.length ? Math.round(entries.reduce((s, e) => s + e.excellenceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Daily Excellence
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set and maintain the highest standard in everything you do.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Acts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{extraordinary}</div>
          <div className="text-xs text-slate-500">Excellent+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgExcellence}/10</div>
          <div className="text-xs text-slate-500">Avg Excellence</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Excellence</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ExcellenceArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [ExcellenceArea, typeof AREA_CONFIG.work][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.standard} onChange={e => setForm(f => ({ ...f, standard: e.target.value as ExcellenceStandard }))} className="game-input text-sm flex-1">
              {(Object.entries(STANDARD_CONFIG) as [ExcellenceStandard, typeof STANDARD_CONFIG.excellent][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatYouDid} onChange={e => setForm(f => ({ ...f, whatYouDid: e.target.value }))}
            placeholder="What did you do today? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.howYouExceeded} onChange={e => setForm(f => ({ ...f, howYouExceeded: e.target.value }))}
            placeholder="How did you exceed the standard?" className="game-input w-full text-sm" />
          <input value={form.whatStoppedYou} onChange={e => setForm(f => ({ ...f, whatStoppedYou: e.target.value }))}
            placeholder="What prevented full excellence?" className="game-input w-full text-sm" />
          <input value={form.refinementMade} onChange={e => setForm(f => ({ ...f, refinementMade: e.target.value }))}
            placeholder="Refinement or improvement made" className="game-input w-full text-sm" />
          <input value={form.prideLevel} onChange={e => setForm(f => ({ ...f, prideLevel: e.target.value }))}
            placeholder="Your level of pride in this work" className="game-input w-full text-sm" />
          <input value={form.couldBeBetter} onChange={e => setForm(f => ({ ...f, couldBeBetter: e.target.value }))}
            placeholder="How could this have been even better?" className="game-input w-full text-sm" />
          <input value={form.tomorrowStandard} onChange={e => setForm(f => ({ ...f, tomorrowStandard: e.target.value }))}
            placeholder="Standard you're setting for tomorrow" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Excellence achieved: {form.excellenceScore}/10</p>
            <input type="range" min={1} max={10} value={form.excellenceScore}
              onChange={e => setForm(f => ({ ...f, excellenceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STANDARD_CONFIG[e.standard]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-yellow-400">⭐ {e.excellenceScore}/10</span>
                </div>
                {e.whatYouDid && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.whatYouDid}</p>}
                {e.tomorrowStandard && <p className="text-xs text-cyan-300/70 mt-0.5">→ {e.tomorrowStandard}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Excellence is not an act. It is a habit you build one day at a time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
