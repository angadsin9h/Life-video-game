import { useState, useEffect } from 'react'
import { Compass, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PurposeSignal = 'joy' | 'talent' | 'need' | 'calling' | 'mission' | 'vocation' | 'passion' | 'service' | 'impact' | 'legacy'
type PurposeClarity = 'lost' | 'searching' | 'sensing' | 'feeling' | 'knowing' | 'living'

interface PurposeLogEntry {
  id: string
  signal: PurposeSignal
  clarity: PurposeClarity
  purposeStatement: string
  whatLitYouUp: string
  whoNeedsThis: string
  uniqueContribution: string
  whereWorldNeedsIt: string
  fearBlocking: string
  nextAlignedStep: string
  alignmentScore: number
  date: string
  createdAt: string
}

const SIGNAL_CONFIG: Record<PurposeSignal, { label: string; emoji: string; color: string }> = {
  joy:       { label: 'Joy Signal',     emoji: '✨', color: '#f59e0b' },
  talent:    { label: 'Natural Talent', emoji: '💎', color: '#6366f1' },
  need:      { label: 'World Need',     emoji: '🌍', color: '#22c55e' },
  calling:   { label: 'Inner Calling',  emoji: '📣', color: '#ec4899' },
  mission:   { label: 'Mission',        emoji: '🎯', color: '#3b82f6' },
  vocation:  { label: 'Vocation',       emoji: '💼', color: '#f97316' },
  passion:   { label: 'Passion',        emoji: '🔥', color: '#ef4444' },
  service:   { label: 'Service',        emoji: '🤝', color: '#10b981' },
  impact:    { label: 'Impact',         emoji: '⚡', color: '#a855f7' },
  legacy:    { label: 'Legacy',         emoji: '🏛️', color: '#94a3b8' },
}

const CLARITY_CONFIG: Record<PurposeClarity, { label: string; color: string }> = {
  lost:      { label: 'Lost',      color: '#ef4444' },
  searching: { label: 'Searching', color: '#f97316' },
  sensing:   { label: 'Sensing',   color: '#f59e0b' },
  feeling:   { label: 'Feeling',   color: '#3b82f6' },
  knowing:   { label: 'Knowing',   color: '#22c55e' },
  living:    { label: 'Living It', color: '#a855f7' },
}

const STORAGE_KEY = 'purpose_log'

export default function PurposeLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PurposeLogEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PurposeLogEntry, 'id' | 'createdAt'>>({
    signal: 'calling', clarity: 'sensing', purposeStatement: '',
    whatLitYouUp: '', whoNeedsThis: '', uniqueContribution: '',
    whereWorldNeedsIt: '', fearBlocking: '', nextAlignedStep: '', alignmentScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PurposeLogEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.purposeStatement.trim()) return
    const e: PurposeLogEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, purposeStatement: '', whatLitYouUp: '', whoNeedsThis: '', uniqueContribution: '', whereWorldNeedsIt: '', fearBlocking: '', nextAlignedStep: '' }))
    setShowForm(false)
    toastSuccess('Purpose signal logged — the world needs what only you can give 🧭')
  }

  const living = entries.filter(e => e.clarity === 'living' || e.clarity === 'knowing').length
  const avgAlignment = entries.length ? Math.round(entries.reduce((s, e) => s + e.alignmentScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-orange-400" />
            Purpose Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Follow the signals that point toward your deepest purpose.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Signals</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{living}</div>
          <div className="text-xs text-slate-500">Knowing+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgAlignment}/10</div>
          <div className="text-xs text-slate-500">Avg Alignment</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Purpose Signal</h3>
          <div className="flex gap-2">
            <select value={form.signal} onChange={e => setForm(f => ({ ...f, signal: e.target.value as PurposeSignal }))} className="game-input text-sm flex-1">
              {(Object.entries(SIGNAL_CONFIG) as [PurposeSignal, typeof SIGNAL_CONFIG.calling][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.clarity} onChange={e => setForm(f => ({ ...f, clarity: e.target.value as PurposeClarity }))} className="game-input text-sm flex-1">
              {(Object.entries(CLARITY_CONFIG) as [PurposeClarity, typeof CLARITY_CONFIG.sensing][]).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.purposeStatement} onChange={e => setForm(f => ({ ...f, purposeStatement: e.target.value }))}
            placeholder="My purpose statement for this signal *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.whatLitYouUp} onChange={e => setForm(f => ({ ...f, whatLitYouUp: e.target.value }))}
            placeholder="What specifically lit you up?" className="game-input w-full text-sm" />
          <input value={form.uniqueContribution} onChange={e => setForm(f => ({ ...f, uniqueContribution: e.target.value }))}
            placeholder="Your unique contribution here" className="game-input w-full text-sm" />
          <input value={form.whoNeedsThis} onChange={e => setForm(f => ({ ...f, whoNeedsThis: e.target.value }))}
            placeholder="Who in the world needs this?" className="game-input w-full text-sm" />
          <input value={form.whereWorldNeedsIt} onChange={e => setForm(f => ({ ...f, whereWorldNeedsIt: e.target.value }))}
            placeholder="Where in the world does this serve?" className="game-input w-full text-sm" />
          <input value={form.fearBlocking} onChange={e => setForm(f => ({ ...f, fearBlocking: e.target.value }))}
            placeholder="Fear or belief blocking this purpose" className="game-input w-full text-sm" />
          <input value={form.nextAlignedStep} onChange={e => setForm(f => ({ ...f, nextAlignedStep: e.target.value }))}
            placeholder="Next aligned action toward this purpose" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Alignment score: {form.alignmentScore}/10</p>
            <input type="range" min={1} max={10} value={form.alignmentScore}
              onChange={e => setForm(f => ({ ...f, alignmentScore: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SIGNAL_CONFIG[e.signal]
          const c = CLARITY_CONFIG[e.clarity]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{s.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: c.color + '20', color: c.color }}>{c.label}</span>
                  <span className="text-xs text-orange-400">🧭 {e.alignmentScore}/10</span>
                </div>
                {e.purposeStatement && <p className="text-xs text-slate-300 mt-1 line-clamp-1 italic">"{e.purposeStatement}"</p>}
                {e.nextAlignedStep && <p className="text-xs text-green-300/70 mt-0.5">→ {e.nextAlignedStep}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">At the intersection of joy, talent, and the world's need — you find purpose.</p>
          </div>
        )}
      </div>
    </div>
  )
}
