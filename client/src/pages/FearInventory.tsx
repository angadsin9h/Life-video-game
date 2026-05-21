import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FearCategory = 'failure' | 'rejection' | 'success' | 'loneliness' | 'death' | 'loss' | 'judgment' | 'uncertainty' | 'vulnerability' | 'change'
type FearOrigin = 'childhood' | 'past-experience' | 'cultural' | 'unknown' | 'rational' | 'trauma' | 'inherited'
type FearStatus = 'paralyzing' | 'limiting' | 'present' | 'facing' | 'dissolving' | 'transcended'

interface FearEntry {
  id: string
  category: FearCategory
  origin: FearOrigin
  status: FearStatus
  fear: string
  rootBelief: string
  howItShowsUp: string
  costOfFear: string
  oppositeTruth: string
  facingAction: string
  intensity: number
  date: string
  createdAt: string
}

const CAT_CONFIG: Record<FearCategory, { label: string; emoji: string; color: string }> = {
  failure:       { label: 'Failure',       emoji: '📉', color: '#ef4444' },
  rejection:     { label: 'Rejection',     emoji: '🚫', color: '#f97316' },
  success:       { label: 'Success',       emoji: '🏆', color: '#f59e0b' },
  loneliness:    { label: 'Loneliness',    emoji: '😔', color: '#6366f1' },
  death:         { label: 'Death',         emoji: '💀', color: '#94a3b8' },
  loss:          { label: 'Loss',          emoji: '💔', color: '#ec4899' },
  judgment:      { label: 'Judgment',      emoji: '👁️', color: '#a855f7' },
  uncertainty:   { label: 'Uncertainty',   emoji: '❓', color: '#3b82f6' },
  vulnerability: { label: 'Vulnerability', emoji: '🫀', color: '#22c55e' },
  change:        { label: 'Change',        emoji: '🔄', color: '#84cc16' },
}

const STATUS_CONFIG: Record<FearStatus, { label: string; color: string; emoji: string }> = {
  paralyzing:  { label: 'Paralyzing',  color: '#dc2626', emoji: '🔴' },
  limiting:    { label: 'Limiting',    color: '#ef4444', emoji: '🟠' },
  present:     { label: 'Present',     color: '#f59e0b', emoji: '🟡' },
  facing:      { label: 'Facing',      color: '#3b82f6', emoji: '⚔️' },
  dissolving:  { label: 'Dissolving',  color: '#22c55e', emoji: '🌱' },
  transcended: { label: 'Transcended', color: '#a855f7', emoji: '🦋' },
}

const STORAGE_KEY = 'fear_inventory'

export default function FearInventory() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FearEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<FearEntry, 'id' | 'createdAt'>>({
    category: 'failure', origin: 'past-experience', status: 'limiting',
    fear: '', rootBelief: '', howItShowsUp: '', costOfFear: '',
    oppositeTruth: '', facingAction: '', intensity: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FearEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.fear.trim()) return
    const e: FearEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, fear: '', rootBelief: '', howItShowsUp: '', costOfFear: '', oppositeTruth: '', facingAction: '' }))
    setShowForm(false)
    toastSuccess('Fear named — courage grows where fear is faced ⚔️')
  }

  const transcended = entries.filter(e => e.status === 'transcended').length
  const facing = entries.filter(e => e.status === 'facing' || e.status === 'dissolving').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-red-400" />
            Fear Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Name your fears. Understand their roots. Face them.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Name
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Named</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{facing}</div>
          <div className="text-xs text-slate-500">Being Faced</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{transcended}</div>
          <div className="text-xs text-slate-500">Transcended</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Name the Fear</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as FearCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [FearCategory, typeof CAT_CONFIG.failure][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FearStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [FearStatus, typeof STATUS_CONFIG.present][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.fear} onChange={e => setForm(f => ({ ...f, fear: e.target.value }))}
            placeholder="Describe the fear honestly *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.rootBelief} onChange={e => setForm(f => ({ ...f, rootBelief: e.target.value }))}
            placeholder="Root belief driving this fear" className="game-input w-full text-sm" />
          <input value={form.howItShowsUp} onChange={e => setForm(f => ({ ...f, howItShowsUp: e.target.value }))}
            placeholder="How does it show up in your life?" className="game-input w-full text-sm" />
          <input value={form.costOfFear} onChange={e => setForm(f => ({ ...f, costOfFear: e.target.value }))}
            placeholder="What is the cost of this fear?" className="game-input w-full text-sm" />
          <input value={form.oppositeTruth} onChange={e => setForm(f => ({ ...f, oppositeTruth: e.target.value }))}
            placeholder="What is the opposite truth?" className="game-input w-full text-sm" />
          <input value={form.facingAction} onChange={e => setForm(f => ({ ...f, facingAction: e.target.value }))}
            placeholder="One action to face this fear today" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/10</p>
            <input type="range" min={1} max={10} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full h-1 accent-red-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">Name the Fear</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CAT_CONFIG[e.category]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{s.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{c.label}</span>
                  <span className="text-xs text-red-400">🔥 {e.intensity}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.fear}</p>
                {e.oppositeTruth && <p className="text-xs text-green-300/80 mt-0.5">Truth: {e.oppositeTruth}</p>}
                {e.facingAction && <p className="text-xs text-blue-300/70 mt-0.5">Action: {e.facingAction}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Courage is not the absence of fear. It's naming it and acting anyway.</p>
          </div>
        )}
      </div>
    </div>
  )
}
