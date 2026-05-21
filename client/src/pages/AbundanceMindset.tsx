import { useState, useEffect } from 'react'
import { Sun, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AbundanceArea = 'money' | 'love' | 'time' | 'energy' | 'opportunities' | 'health' | 'creativity' | 'connections' | 'knowledge' | 'joy'
type AbundanceShift = 'scarcity-to-abundance' | 'abundance-deepening' | 'gratitude-trigger' | 'evidence-found' | 'belief-update'

interface AbundanceEntry {
  id: string
  area: AbundanceArea
  shift: AbundanceShift
  scaricityBelief: string
  abundanceReframe: string
  realWorldEvidence: string
  howItFeels: string
  affirmation: string
  abundanceScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<AbundanceArea, { label: string; emoji: string; color: string }> = {
  money:       { label: 'Money',       emoji: '💰', color: '#22c55e' },
  love:        { label: 'Love',        emoji: '❤️', color: '#ec4899' },
  time:        { label: 'Time',        emoji: '⏰', color: '#3b82f6' },
  energy:      { label: 'Energy',      emoji: '⚡', color: '#f59e0b' },
  opportunities: { label: 'Opportunities', emoji: '🚪', color: '#a855f7' },
  health:      { label: 'Health',      emoji: '💪', color: '#84cc16' },
  creativity:  { label: 'Creativity',  emoji: '🎨', color: '#f97316' },
  connections: { label: 'Connections', emoji: '🤝', color: '#06b6d4' },
  knowledge:   { label: 'Knowledge',   emoji: '📚', color: '#6366f1' },
  joy:         { label: 'Joy',         emoji: '✨', color: '#eab308' },
}

const SHIFT_CONFIG: Record<AbundanceShift, { label: string; color: string }> = {
  'scarcity-to-abundance': { label: 'Scarcity → Abundance', color: '#22c55e' },
  'abundance-deepening':   { label: 'Abundance Deepening',  color: '#a855f7' },
  'gratitude-trigger':     { label: 'Gratitude Trigger',    color: '#f59e0b' },
  'evidence-found':        { label: 'Evidence Found',       color: '#3b82f6' },
  'belief-update':         { label: 'Belief Update',        color: '#ec4899' },
}

const STORAGE_KEY = 'abundance_mindset_log'

export default function AbundanceMindset() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AbundanceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<AbundanceEntry, 'id' | 'createdAt'>>({
    area: 'money', shift: 'scarcity-to-abundance', scaricityBelief: '',
    abundanceReframe: '', realWorldEvidence: '', howItFeels: '',
    affirmation: '', abundanceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AbundanceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.abundanceReframe.trim()) return
    const e: AbundanceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, scaricityBelief: '', abundanceReframe: '', realWorldEvidence: '', howItFeels: '', affirmation: '' }))
    setShowForm(false)
    toastSuccess('Abundance recorded — what you appreciate, appreciates 🌟')
  }

  const avgScore = entries.length ? Math.round(entries.reduce((s, e) => s + e.abundanceScore, 0) / entries.length) : 0
  const shifts = entries.filter(e => e.shift === 'scarcity-to-abundance').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Abundance Mindset
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Reframe scarcity into abundance across all life areas.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{shifts}</div>
          <div className="text-xs text-slate-500">Shifts Made</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Abundance</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Abundance Entry</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as AbundanceArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [AbundanceArea, typeof AREA_CONFIG.money][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value as AbundanceShift }))} className="game-input text-sm flex-1">
              {(Object.entries(SHIFT_CONFIG) as [AbundanceShift, typeof SHIFT_CONFIG['belief-update']][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.scaricityBelief} onChange={e => setForm(f => ({ ...f, scaricityBelief: e.target.value }))}
            placeholder="What was the scarcity belief?" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.abundanceReframe} onChange={e => setForm(f => ({ ...f, abundanceReframe: e.target.value }))}
            placeholder="How do you reframe this as abundance? *" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.realWorldEvidence} onChange={e => setForm(f => ({ ...f, realWorldEvidence: e.target.value }))}
            placeholder="Real-world evidence of abundance in this area" className="game-input w-full text-sm" />
          <input value={form.howItFeels} onChange={e => setForm(f => ({ ...f, howItFeels: e.target.value }))}
            placeholder="How does the abundance perspective feel?" className="game-input w-full text-sm" />
          <input value={form.affirmation} onChange={e => setForm(f => ({ ...f, affirmation: e.target.value }))}
            placeholder="Abundance affirmation for this area" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Abundance feeling: {form.abundanceScore}/10</p>
            <input type="range" min={1} max={10} value={form.abundanceScore}
              onChange={e => setForm(f => ({ ...f, abundanceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Capture Abundance</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = SHIFT_CONFIG[e.shift]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-yellow-400">✨ {e.abundanceScore}/10</span>
                </div>
                {e.abundanceReframe && <p className="text-xs text-green-300/80 mt-1 line-clamp-2">{e.abundanceReframe}</p>}
                {e.affirmation && <p className="text-xs text-yellow-300/70 mt-0.5 italic">"{e.affirmation}"</p>}
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
            <p className="text-sm">Abundance is a mindset. Train it daily.</p>
          </div>
        )}
      </div>
    </div>
  )
}
