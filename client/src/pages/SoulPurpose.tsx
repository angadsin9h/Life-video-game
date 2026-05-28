import { useState, useEffect } from 'react'
import { Compass, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PurposeLayer = 'mission' | 'vision' | 'calling' | 'dharma' | 'legacy' | 'service' | 'joy-purpose' | 'unique-gift'
type PurposeClarity = 'foggy' | 'emerging' | 'forming' | 'clear' | 'crystal-clear'

interface SoulPurposeEntry {
  id: string
  layer: PurposeLayer
  clarity: PurposeClarity
  purposeStatement: string
  whyThisMatters: string
  howYouKnow: string
  whoItServes: string
  whenYouForgotIt: string
  nextAlignedAction: string
  clarityScore: number
  date: string
  createdAt: string
}

const LAYER_CONFIG: Record<PurposeLayer, { label: string; emoji: string; color: string; description: string }> = {
  mission:      { label: 'Mission',      emoji: '🎯', color: '#ef4444', description: 'What you are here to do' },
  vision:       { label: 'Vision',       emoji: '🔭', color: '#3b82f6', description: 'The world you want to create' },
  calling:      { label: 'Calling',      emoji: '📣', color: '#f59e0b', description: 'What calls to you deeply' },
  dharma:       { label: 'Dharma',       emoji: '☸️', color: '#6366f1', description: 'Your right path and duty' },
  legacy:       { label: 'Legacy',       emoji: '🌳', color: '#22c55e', description: 'What you leave behind' },
  service:      { label: 'Service',      emoji: '🤝', color: '#ec4899', description: 'How you serve others' },
  'joy-purpose':{ label: 'Joy-Purpose',  emoji: '✨', color: '#a855f7', description: 'Where joy meets purpose' },
  'unique-gift':{ label: 'Unique Gift',  emoji: '🎁', color: '#f97316', description: 'Your special contribution' },
}

const CLARITY_CONFIG: Record<PurposeClarity, { label: string; color: string }> = {
  foggy:        { label: 'Foggy',        color: '#94a3b8' },
  emerging:     { label: 'Emerging',     color: '#6366f1' },
  forming:      { label: 'Forming',      color: '#3b82f6' },
  clear:        { label: 'Clear',        color: '#22c55e' },
  'crystal-clear': { label: 'Crystal Clear', color: '#f59e0b' },
}

const STORAGE_KEY = 'soul_purpose_log'

export default function SoulPurpose() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SoulPurposeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SoulPurposeEntry, 'id' | 'createdAt'>>({
    layer: 'mission', clarity: 'emerging', purposeStatement: '',
    whyThisMatters: '', howYouKnow: '', whoItServes: '',
    whenYouForgotIt: '', nextAlignedAction: '', clarityScore: 6,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SoulPurposeEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.purposeStatement.trim()) return
    const e: SoulPurposeEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, purposeStatement: '', whyThisMatters: '', howYouKnow: '', whoItServes: '', whenYouForgotIt: '', nextAlignedAction: '' }))
    setShowForm(false)
    toastSuccess('Soul purpose captured — you are here for a reason 🧭')
  }

  const crystalClear = entries.filter(e => e.clarity === 'crystal-clear').length
  const avgClarity = entries.length ? Math.round(entries.reduce((s, e) => s + e.clarityScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-indigo-400" />
            Soul Purpose
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Explore and clarify your deepest mission, calling, and dharma.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Explore
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Explorations</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{crystalClear}</div>
          <div className="text-xs text-slate-500">Crystal Clear</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgClarity}/10</div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Purpose Exploration</h3>
          <div className="flex gap-2">
            <select value={form.layer} onChange={e => setForm(f => ({ ...f, layer: e.target.value as PurposeLayer }))} className="game-input text-sm flex-1">
              {(Object.entries(LAYER_CONFIG) as [PurposeLayer, typeof LAYER_CONFIG.mission][]).map(([k, l]) => (
                <option key={k} value={k}>{l.emoji} {l.label}</option>
              ))}
            </select>
            <select value={form.clarity} onChange={e => setForm(f => ({ ...f, clarity: e.target.value as PurposeClarity }))} className="game-input text-sm flex-1">
              {(Object.entries(CLARITY_CONFIG) as [PurposeClarity, typeof CLARITY_CONFIG.clear][]).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.purposeStatement} onChange={e => setForm(f => ({ ...f, purposeStatement: e.target.value }))}
            placeholder="State your purpose / mission / calling *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.whyThisMatters} onChange={e => setForm(f => ({ ...f, whyThisMatters: e.target.value }))}
            placeholder="Why does this matter deeply to you?" className="game-input w-full text-sm" />
          <input value={form.howYouKnow} onChange={e => setForm(f => ({ ...f, howYouKnow: e.target.value }))}
            placeholder="How do you know this is true for you?" className="game-input w-full text-sm" />
          <input value={form.whoItServes} onChange={e => setForm(f => ({ ...f, whoItServes: e.target.value }))}
            placeholder="Who does this purpose serve?" className="game-input w-full text-sm" />
          <input value={form.whenYouForgotIt} onChange={e => setForm(f => ({ ...f, whenYouForgotIt: e.target.value }))}
            placeholder="When do you forget this purpose?" className="game-input w-full text-sm" />
          <input value={form.nextAlignedAction} onChange={e => setForm(f => ({ ...f, nextAlignedAction: e.target.value }))}
            placeholder="Next action aligned with this purpose" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Clarity: {form.clarityScore}/10</p>
            <input type="range" min={1} max={10} value={form.clarityScore}
              onChange={e => setForm(f => ({ ...f, clarityScore: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Capture Purpose</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const l = LAYER_CONFIG[e.layer]
          const c = CLARITY_CONFIG[e.clarity]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${l.color}` }}>
              <span className="text-2xl">{l.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{l.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: c.color + '20', color: c.color }}>{c.label}</span>
                  <span className="text-xs text-indigo-400">🧭 {e.clarityScore}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.purposeStatement}</p>
                {e.nextAlignedAction && <p className="text-xs text-green-300/70 mt-0.5">→ {e.nextAlignedAction}</p>}
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
            <p className="text-sm">The two most important days: when you were born, and when you find out why.</p>
          </div>
        )}
      </div>
    </div>
  )
}
